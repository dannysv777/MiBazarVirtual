package com.mibazarvirtual.backend.stats.dto;

import com.mibazarvirtual.backend.repository.StoreRepository;
import java.math.BigDecimal;

public record AdminStoreReportResponse(
        Long storeId,
        String storeName,
        String sellerEmail,
        String status,
        long totalOrders,
        long deliveredOrders,
        BigDecimal totalSales,
        long productCount
) {
    public static AdminStoreReportResponse from(StoreRepository.AdminStoreReportProjection projection) {
        return new AdminStoreReportResponse(
                projection.getStoreId(),
                projection.getStoreName(),
                projection.getSellerEmail(),
                projection.getStatus(),
                projection.getTotalOrders(),
                projection.getDeliveredOrders(),
                projection.getTotalSales() == null ? BigDecimal.ZERO : projection.getTotalSales(),
                projection.getProductCount()
        );
    }
}
