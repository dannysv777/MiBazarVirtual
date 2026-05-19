package com.mibazarvirtual.backend.stats.dto;

import java.math.BigDecimal;

public record AdminOverviewResponse(
        long totalUsers,
        long buyers,
        long sellers,
        long deliveryWorkers,
        long activeStores,
        long pendingStores,
        long suspendedStores,
        long totalProducts,
        long activeProducts,
        long outOfStockProducts,
        long totalOrders,
        long pendingOrders,
        long partiallyConfirmedOrders,
        long confirmedOrders,
        long readyForPickupOrders,
        long inProgressOrders,
        long deliveredOrders,
        long cancelledOrders,
        BigDecimal deliveredRevenue,
        BigDecimal deliveryFees,
        long paymentRecords,
        BigDecimal grossPaymentAmount,
        BigDecimal platformFees,
        BigDecimal sellerPayouts
) {
}
