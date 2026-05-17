package com.mibazarvirtual.backend.recommendation;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.exception.ProductNotFoundException;
import com.mibazarvirtual.backend.repository.OrderItemRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final int MAX_PRODUCTS_PER_STORE = 2;
    private static final int MAX_PRODUCTS_PER_CATEGORY = 3;

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    @Cacheable(
            value = "feedRecommendations",
            key = "(#userId == null ? 'guest' : #userId) + ':' + #limit + ':' + (#excludeStoreIds == null ? '' : #excludeStoreIds.toString()) + ':' + (#seed == null ? 'random' : #seed)"
    )
    public List<ProductDTO> getFeed(Long userId, int limit, List<Long> excludeStoreIds, Double seed) {
        RecommendationStats stats = loadStats(userId);
        Set<Long> preferredCategories = topCategoryIds(userId);
        List<ScoredProduct> scored = activeProducts().stream()
                .map(product -> new ScoredProduct(product, scoreFeedProduct(product, stats, preferredCategories, excludeStoreIds, seed, 20)))
                .filter(scoredProduct -> scoredProduct.score() > 0)
                .sorted(Comparator.comparingDouble(ScoredProduct::score).reversed())
                .toList();

        List<Product> selected = diversify(scored, limit);
        addNewSellerSlot(selected, scored, stats, limit);
        return selected.stream().map(ProductDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<StoreDTO> getRecommendedStores(Long userId, int limit, Double seed) {
        Set<Long> preferredCategories = topCategoryIds(userId);
        List<Product> products = activeProducts();
        Map<Long, Set<Long>> storeCategories = products.stream()
                .collect(Collectors.groupingBy(
                        product -> product.getStore().getId(),
                        Collectors.mapping(product -> product.getCategory().getId(), Collectors.toSet())
                ));

        List<Store> stores = storeRepository.findActiveForRecommendations();
        LocalDateTime newStoreCutoff = LocalDateTime.now().minusDays(30);

        return stores.stream()
                .map(store -> {
                    double score = store.getRatingAvg().doubleValue() * 20;
                    score += Math.min(store.getRatingCount() == null ? 0 : store.getRatingCount(), 50);
                    if (store.getCreatedAt() != null && store.getCreatedAt().isAfter(newStoreCutoff)) {
                        score += 40;
                    }
                    if (!preferredCategories.isEmpty()
                            && storeCategories.getOrDefault(store.getId(), Set.of()).stream().anyMatch(preferredCategories::contains)) {
                        score += 35;
                    }
                    score += random(seed, store.getId(), 30);
                    return new ScoredStore(store, score);
                })
                .sorted(Comparator.comparingDouble(ScoredStore::score).reversed())
                .limit(normalizeLimit(limit, 6))
                .map(scoredStore -> StoreDTO.from(scoredStore.store()))
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "similarRecommendations", key = "#productId + ':' + #limit")
    public List<ProductDTO> getSimilarProducts(Long productId, int limit) {
        Product source = productRepository.findByIdAndStatus(productId, Product.Status.ACTIVE)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        double sourcePrice = source.getPrice().doubleValue();
        long sourceCategoryId = source.getCategory().getId();
        long sourceStoreId = source.getStore().getId();

        List<ScoredProduct> scored = activeProducts().stream()
                .filter(product -> !product.getId().equals(productId))
                .map(product -> {
                    double score = 0;
                    if (product.getCategory().getId().equals(sourceCategoryId)) score += 50;
                    if (product.getStore().getId().equals(sourceStoreId)) score += 20;
                    if (withinThirtyPercent(sourcePrice, product.getPrice().doubleValue())) score += 15;
                    if (product.getStore().getRatingAvg().doubleValue() >= 4.0) score += 10;
                    score += random(null, product.getId(), 15);
                    return new ScoredProduct(product, score);
                })
                .sorted(Comparator.comparingDouble(ScoredProduct::score).reversed())
                .toList();

        return diversify(scored, normalizeLimit(limit, 6)).stream().map(ProductDTO::from).toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "trendingRecommendations", key = "(#categoryId == null ? 'all' : #categoryId) + ':' + #limit")
    public List<ProductDTO> getTrending(Long categoryId, int limit) {
        int normalizedLimit = normalizeLimit(limit, 8);
        Map<Long, Long> weeklySales = productCountMap(orderItemRepository.countDeliveredByProductSince(LocalDateTime.now().minusDays(7)));
        List<Product> candidates = activeProducts().stream()
                .filter(product -> categoryId == null || product.getCategory().getId().equals(categoryId))
                .toList();

        List<ScoredProduct> scored = candidates.stream()
                .filter(product -> weeklySales.getOrDefault(product.getId(), 0L) > 0)
                .map(product -> new ScoredProduct(product, weeklySales.getOrDefault(product.getId(), 0L) * 20 + random(null, product.getId(), 10)))
                .sorted(Comparator.comparingDouble(ScoredProduct::score).reversed())
                .toList();

        List<Product> selected = diversify(scored, normalizedLimit);
        if (selected.size() < normalizedLimit) {
            Set<Long> selectedIds = selected.stream().map(Product::getId).collect(Collectors.toSet());
            List<ScoredProduct> fillers = candidates.stream()
                    .filter(product -> !selectedIds.contains(product.getId()))
                    .filter(product -> product.getCreatedAt() != null && product.getCreatedAt().isAfter(LocalDateTime.now().minusDays(14)))
                    .map(product -> new ScoredProduct(product, random(null, product.getId(), 30)))
                    .sorted(Comparator.comparingDouble(ScoredProduct::score).reversed())
                    .toList();
            selected.addAll(diversify(fillers, normalizedLimit - selected.size()));
        }

        return selected.stream().map(ProductDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> getForYou(Long userId, int limit) {
        Set<Long> preferredCategories = topCategoryIds(userId);
        if (preferredCategories.isEmpty()) {
            return getTrending(null, limit);
        }

        RecommendationStats stats = loadStats(userId);
        Set<Long> avoidedProductIds = new HashSet<>(orderItemRepository.findBuyerAvoidedProductIds(userId));
        BigDecimal averagePrice = orderItemRepository.findBuyerAverageUnitPrice(userId);
        double avg = averagePrice == null ? 0 : averagePrice.doubleValue();

        List<ScoredProduct> scored = activeProducts().stream()
                .filter(product -> !avoidedProductIds.contains(product.getId()))
                .map(product -> {
                    double score = scoreFeedProduct(product, stats, preferredCategories, List.of(), null, 20);
                    if (avg > 0 && withinThirtyPercent(avg, product.getPrice().doubleValue())) {
                        score += 15;
                    }
                    return new ScoredProduct(product, score);
                })
                .sorted(Comparator.comparingDouble(ScoredProduct::score).reversed())
                .toList();

        return diversify(scored, normalizeLimit(limit, 10)).stream().map(ProductDTO::from).toList();
    }

    @CacheEvict(value = {"feedRecommendations", "trendingRecommendations", "similarRecommendations"}, allEntries = true)
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void evictRecommendationCaches() {
        // Simple in-memory cache eviction for Railway-friendly recommendation freshness.
    }

    private List<Product> activeProducts() {
        return productRepository.findActiveInStockForRecommendations();
    }

    private RecommendationStats loadStats(Long userId) {
        Map<Long, Long> sales30Days = productCountMap(orderItemRepository.countDeliveredByProductSince(LocalDateTime.now().minusDays(30)));
        Map<Long, Long> storeSales = storeCountMap(orderItemRepository.countDeliveredByStore());
        return new RecommendationStats(sales30Days, storeSales);
    }

    private Set<Long> topCategoryIds(Long userId) {
        if (userId == null) return Set.of();
        return orderItemRepository.findBuyerTopCategories(userId).stream()
                .limit(3)
                .map(OrderItemRepository.CategoryCountProjection::getCategoryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private double scoreFeedProduct(
            Product product,
            RecommendationStats stats,
            Set<Long> preferredCategories,
            List<Long> excludeStoreIds,
            Double seed,
            int randomRange
    ) {
        if (product.getStock() == null || product.getStock() <= 0) return 0;

        double score = 0;
        LocalDateTime createdAt = product.getCreatedAt();
        if (createdAt != null && createdAt.isAfter(LocalDateTime.now().minusDays(7))) {
            score += 40;
        } else if (createdAt != null && createdAt.isAfter(LocalDateTime.now().minusDays(30))) {
            score += 20;
        }

        double rating = product.getStore().getRatingAvg().doubleValue();
        if (rating >= 4.5) score += 30;
        else if (rating >= 4.0) score += 20;
        else if (rating >= 3.0) score += 10;

        long productSales = stats.productSales30Days().getOrDefault(product.getId(), 0L);
        if (productSales >= 10) score += 25;
        else if (productSales >= 5) score += 15;
        else if (productSales >= 1) score += 5;

        if (product.getStock() < 5) score -= 10;

        long storeSales = stats.storeDeliveredSales().getOrDefault(product.getStore().getId(), 0L);
        if (storeSales == 0) score += 35;
        else if (storeSales <= 5) score += 15;

        if (preferredCategories.contains(product.getCategory().getId())) {
            score += 25;
        }

        if (excludeStoreIds != null && excludeStoreIds.contains(product.getStore().getId())) {
            score -= 30;
        }

        score += random(seed, product.getId(), randomRange);
        return score;
    }

    private void addNewSellerSlot(List<Product> selected, List<ScoredProduct> scored, RecommendationStats stats, int limit) {
        if (selected.size() >= normalizeLimit(limit, 12) || scored.isEmpty()) return;
        boolean hasNewSeller = selected.stream()
                .anyMatch(product -> stats.storeDeliveredSales().getOrDefault(product.getStore().getId(), 0L) == 0);
        if (hasNewSeller) return;

        scored.stream()
                .map(ScoredProduct::product)
                .filter(product -> stats.storeDeliveredSales().getOrDefault(product.getStore().getId(), 0L) == 0)
                .filter(product -> selected.stream().noneMatch(current -> current.getId().equals(product.getId())))
                .findFirst()
                .ifPresent(selected::add);
    }

    private List<Product> diversify(List<ScoredProduct> scored, int limit) {
        int normalizedLimit = normalizeLimit(limit, 12);
        Map<Long, Integer> storeCounts = new HashMap<>();
        Map<Long, Integer> categoryCounts = new HashMap<>();
        List<Product> selected = new ArrayList<>();

        for (ScoredProduct scoredProduct : scored) {
            Product product = scoredProduct.product();
            Long storeId = product.getStore().getId();
            Long categoryId = product.getCategory().getId();
            if (storeCounts.getOrDefault(storeId, 0) >= MAX_PRODUCTS_PER_STORE) continue;
            if (categoryCounts.getOrDefault(categoryId, 0) >= MAX_PRODUCTS_PER_CATEGORY) continue;

            selected.add(product);
            storeCounts.merge(storeId, 1, Integer::sum);
            categoryCounts.merge(categoryId, 1, Integer::sum);
            if (selected.size() >= normalizedLimit) break;
        }

        return selected;
    }

    private Map<Long, Long> productCountMap(List<OrderItemRepository.ProductCountProjection> projections) {
        return projections.stream().collect(Collectors.toMap(
                OrderItemRepository.ProductCountProjection::getProductId,
                OrderItemRepository.ProductCountProjection::getTotal
        ));
    }

    private Map<Long, Long> storeCountMap(List<OrderItemRepository.StoreCountProjection> projections) {
        return projections.stream().collect(Collectors.toMap(
                OrderItemRepository.StoreCountProjection::getStoreId,
                OrderItemRepository.StoreCountProjection::getTotal
        ));
    }

    private boolean withinThirtyPercent(double reference, double candidate) {
        if (reference <= 0) return false;
        double lower = reference * 0.7;
        double upper = reference * 1.3;
        return candidate >= lower && candidate <= upper;
    }

    private double random(Double seed, Long id, int range) {
        if (seed == null) {
            return ThreadLocalRandom.current().nextDouble(range);
        }
        double value = Math.abs(Math.sin(seed * 10_000 + id * 37.17));
        return value * range;
    }

    private int normalizeLimit(int limit, int fallback) {
        if (limit <= 0) return fallback;
        return Math.min(limit, 50);
    }

    private record RecommendationStats(Map<Long, Long> productSales30Days, Map<Long, Long> storeDeliveredSales) {
    }

    private record ScoredProduct(Product product, double score) {
    }

    private record ScoredStore(Store store, double score) {
    }
}
