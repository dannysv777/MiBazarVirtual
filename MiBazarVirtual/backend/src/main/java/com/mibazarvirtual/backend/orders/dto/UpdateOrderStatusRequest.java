// src/main/java/com/mibazarvirtual/backend/orders/dto/UpdateOrderStatusRequest.java
package com.mibazarvirtual.backend.orders.dto;

import com.mibazarvirtual.backend.entity.Order;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull Order.Status status
) {
}
