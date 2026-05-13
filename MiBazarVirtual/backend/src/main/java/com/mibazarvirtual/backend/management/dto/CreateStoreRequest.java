// src/main/java/com/mibazarvirtual/backend/management/dto/CreateStoreRequest.java
package com.mibazarvirtual.backend.management.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateStoreRequest(
        @NotBlank @Size(max = 120) String name,
        String description,
        @Size(max = 255) String address,
        @Size(max = 100) String city,
        @Size(max = 20) String phone,
        @Size(max = 160) String schedule,
        @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude
) {
}
