// src/main/java/com/mibazarvirtual/backend/stats/dto/BuyerStatsResponse.java
package com.mibazarvirtual.backend.stats.dto;

import java.math.BigDecimal;

public record BuyerStatsResponse(
        long totalOrders,
        long deliveredOrders,
        long cancelledOrders,
        BigDecimal totalSpent,
        long activeConversations
) {
}
