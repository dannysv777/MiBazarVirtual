// src/main/java/com/mibazarvirtual/backend/orders/dto/OrderItemRequest.java
package com.mibazarvirtual.backend.orders.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity
) {
}
