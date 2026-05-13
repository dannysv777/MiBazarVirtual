// src/main/java/com/mibazarvirtual/backend/management/dto/CreateProductRequest.java
package com.mibazarvirtual.backend.management.dto;

import com.mibazarvirtual.backend.entity.Product;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateProductRequest(
        @NotBlank @Size(max = 150) String name,
        String description,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @NotNull @Min(0) Integer stock,
        @NotNull Product.Unit unit,
        @NotNull Long categoryId,
        @Size(max = 500) String imageUrl
) {
}
