// src/main/java/com/mibazarvirtual/backend/management/dto/UpdateStockRequest.java
package com.mibazarvirtual.backend.management.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateStockRequest(@NotNull @Min(0) Integer quantity) {
}
