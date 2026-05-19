// src/main/java/com/mibazarvirtual/backend/orders/dto/OrderItemResponse.java
package com.mibazarvirtual.backend.orders.dto;

import com.mibazarvirtual.backend.entity.OrderItem;
import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        Long storeId,
        String storeName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        String itemStatus,
        String vendorNote
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProductName(),
                item.getProduct().getCoverImage(),
                item.getStore().getId(),
                item.getStore().getName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal(),
                item.getItemStatus().name(),
                item.getVendorNote()
        );
    }
}
