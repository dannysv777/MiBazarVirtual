package com.mibazarvirtual.backend.stats.dto;

import java.math.BigDecimal;

public record DeliveryStatsResponse(
        long totalOrders,
        long activeOrders,
        long deliveredOrders,
        BigDecimal totalCollected
) {
}
