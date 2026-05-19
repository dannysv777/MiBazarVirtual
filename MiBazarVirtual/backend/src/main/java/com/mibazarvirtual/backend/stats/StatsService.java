// src/main/java/com/mibazarvirtual/backend/stats/StatsService.java
package com.mibazarvirtual.backend.stats;

import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.exception.StoreNotFoundException;
import com.mibazarvirtual.backend.repository.ConversationRepository;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import com.mibazarvirtual.backend.stats.dto.BuyerStatsResponse;
import com.mibazarvirtual.backend.stats.dto.DeliveryStatsResponse;
import com.mibazarvirtual.backend.stats.dto.SellerStatsResponse;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ConversationRepository conversationRepository;

    @Transactional(readOnly = true)
    public SellerStatsResponse getSellerStats(Long sellerId) {
        Store store = storeRepository.findByUserId(sellerId)
                .orElseThrow(() -> new StoreNotFoundException(sellerId));
        OrderRepository.SellerOrderStatsProjection orderStats = orderRepository.getSellerOrderStats(store.getId());
        ProductRepository.ProductStatsProjection productStats = productRepository.getProductStatsByStoreId(store.getId());

        return new SellerStatsResponse(
                orderStats.getTotalOrders(),
                orderStats.getPendingOrders(),
                orderStats.getConfirmedOrders(),
                orderStats.getInProgressOrders(),
                orderStats.getDeliveredOrders(),
                orderStats.getCancelledOrders(),
                orderStats.getTotalRevenue() == null ? BigDecimal.ZERO : orderStats.getTotalRevenue(),
                productStats.getTotalProducts(),
                productStats.getActiveProducts(),
                productStats.getOutOfStockProducts(),
                store.getRatingAvg().doubleValue(),
                store.getRatingCount()
        );
    }

    @Transactional(readOnly = true)
    public BuyerStatsResponse getBuyerStats(Long buyerId) {
        OrderRepository.BuyerOrderStatsProjection orderStats = orderRepository.getBuyerOrderStats(buyerId);
        return new BuyerStatsResponse(
                orderStats.getTotalOrders(),
                orderStats.getDeliveredOrders(),
                orderStats.getCancelledOrders(),
                orderStats.getTotalSpent() == null ? BigDecimal.ZERO : orderStats.getTotalSpent(),
                conversationRepository.countByBuyerIdOrSellerId(buyerId, buyerId)
        );
    }

    @Transactional(readOnly = true)
    public DeliveryStatsResponse getDeliveryStats(Long deliveryWorkerId) {
        OrderRepository.DeliveryStatsProjection orderStats = orderRepository.getDeliveryStats(deliveryWorkerId);
        return new DeliveryStatsResponse(
                orderStats.getTotalOrders(),
                orderStats.getActiveOrders(),
                orderStats.getDeliveredOrders(),
                orderStats.getTotalCollected() == null ? BigDecimal.ZERO : orderStats.getTotalCollected()
        );
    }
}
