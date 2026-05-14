// src/main/java/com/mibazarvirtual/backend/stats/dto/SellerStatsResponse.java
package com.mibazarvirtual.backend.stats.dto;

import java.math.BigDecimal;

public record SellerStatsResponse(
        long totalOrders,
        long pendingOrders,
        long confirmedOrders,
        long inProgressOrders,
        long deliveredOrders,
        long cancelledOrders,
        BigDecimal totalRevenue,
        long totalProducts,
        long activeProducts,
        long outOfStockProducts,
        double averageRating,
        long totalReviews
) {
}
