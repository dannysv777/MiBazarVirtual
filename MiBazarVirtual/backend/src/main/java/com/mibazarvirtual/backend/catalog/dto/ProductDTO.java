package com.mibazarvirtual.backend.catalog.dto;

import com.mibazarvirtual.backend.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductDTO(
        Long id,
        Long storeId,
        String storeName,
        Long sellerId,
        String sellerUsername,
        Long categoryId,
        String categoryName,
        String name,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        String unit,
        int stock,
        String coverImage,
        LocalDate expirationDate,
        String status
) {
    public static ProductDTO from(Product product) {
        return new ProductDTO(
                product.getId(),
                product.getStore().getId(),
                product.getStore().getName(),
                product.getStore().getUser().getId(),
                product.getStore().getUser().getUsername(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getDiscountPrice(),
                product.getUnit().name(),
                product.getStock(),
                product.getCoverImage(),
                product.getExpirationDate(),
                product.getStatus().name()
        );
    }
}
