// src/main/java/com/mibazarvirtual/backend/orders/dto/OrderResponse.java
package com.mibazarvirtual.backend.orders.dto;

import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.entity.OrderItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        Long buyerId,
        String buyerUsername,
        Long storeId,
        String storeName,
        String status,
        String deliveryType,
        String deliveryAddress,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal total,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order, List<OrderItem> items) {
        return new OrderResponse(
                order.getId(),
                order.getBuyer().getId(),
                order.getBuyer().getUsername(),
                order.getStore().getId(),
                order.getStore().getName(),
                order.getStatus().name(),
                order.getDeliveryType().name(),
                order.getDeliveryAddress(),
                order.getSubtotal(),
                order.getDeliveryFee(),
                order.getTotal(),
                order.getNotes(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                items.stream().map(OrderItemResponse::from).toList()
        );
    }
}
