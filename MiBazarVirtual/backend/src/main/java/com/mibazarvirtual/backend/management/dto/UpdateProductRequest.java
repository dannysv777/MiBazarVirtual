// src/main/java/com/mibazarvirtual/backend/management/dto/UpdateProductRequest.java
package com.mibazarvirtual.backend.management.dto;

import com.mibazarvirtual.backend.entity.Product;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateProductRequest(
        @Size(max = 150) String name,
        String description,
        @DecimalMin("0.01") BigDecimal price,
        @Min(0) Integer stock,
        Product.Unit unit,
        Long categoryId,
        @Size(max = 500) String imageUrl,
        Product.Status status
) {
}
