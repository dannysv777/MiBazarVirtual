package com.mibazarvirtual.backend.favorite;

import com.mibazarvirtual.backend.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FavoriteProductDTO(
        Long id,
        Long storeId,
        String storeName,
        String storeSchedule,
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
        String imageUrl,
        LocalDate expirationDate,
        String status,
        boolean isFavorite,
        boolean isOutOfStock
) {
    public static FavoriteProductDTO from(Product product) {
        boolean outOfStock = product.getStock() <= 0 || product.getStatus() == Product.Status.OUT_OF_STOCK;
        return new FavoriteProductDTO(
                product.getId(),
                product.getStore().getId(),
                product.getStore().getName(),
                product.getStore().getSchedule(),
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
                product.getCoverImage(),
                product.getExpirationDate(),
                product.getStatus().name(),
                true,
                outOfStock
        );
    }
}
