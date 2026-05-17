package com.mibazarvirtual.backend.recommendation;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> feed(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String excludeStoreIds,
            @RequestParam(required = false) Double seed
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                recommendationService.getFeed(userId, limit, parseIds(excludeStoreIds), seed),
                "Recommendation feed"
        ));
    }

    @GetMapping("/stores")
    public ResponseEntity<ApiResponse<List<StoreDTO>>> stores(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "6") int limit,
            @RequestParam(required = false) Double seed
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                recommendationService.getRecommendedStores(userId, limit, seed),
                "Recommended stores"
        ));
    }

    @GetMapping("/similar")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> similar(
            @RequestParam Long productId,
            @RequestParam(defaultValue = "6") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                recommendationService.getSimilarProducts(productId, limit),
                "Similar products"
        ));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> trending(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "8") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                recommendationService.getTrending(categoryId, limit),
                "Trending products"
        ));
    }

    @GetMapping("/for-you")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> forYou(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                recommendationService.getForYou(userId, limit),
                "Personalized recommendations"
        ));
    }

    private List<Long> parseIds(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(Long::valueOf)
                .toList();
    }
}
