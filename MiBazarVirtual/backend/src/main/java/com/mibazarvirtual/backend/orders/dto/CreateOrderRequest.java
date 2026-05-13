// src/main/java/com/mibazarvirtual/backend/orders/dto/CreateOrderRequest.java
package com.mibazarvirtual.backend.orders.dto;

import com.mibazarvirtual.backend.entity.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateOrderRequest(
        @NotNull Long storeId,
        @NotNull Order.DeliveryType deliveryType,
        @Size(max = 255) String deliveryAddress,
        String notes,
        @NotEmpty List<@Valid OrderItemRequest> items
) {
}
