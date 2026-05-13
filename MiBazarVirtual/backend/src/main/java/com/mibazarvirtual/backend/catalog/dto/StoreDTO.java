package com.mibazarvirtual.backend.catalog.dto;

import com.mibazarvirtual.backend.entity.Store;
import java.math.BigDecimal;

public record StoreDTO(
        Long id,
        Long sellerId,
        String sellerUsername,
        String name,
        String description,
        String logoUrl,
        String bannerUrl,
        String address,
        String city,
        String phone,
        String schedule,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal deliveryRadius,
        BigDecimal ratingAvg,
        int ratingCount,
        String status
) {
    public static StoreDTO from(Store store) {
        return new StoreDTO(
                store.getId(),
                store.getUser().getId(),
                store.getUser().getUsername(),
                store.getName(),
                store.getDescription(),
                store.getLogoUrl(),
                store.getBannerUrl(),
                store.getAddress(),
                store.getCity(),
                store.getPhone(),
                store.getSchedule(),
                store.getLatitude(),
                store.getLongitude(),
                store.getDeliveryRadius(),
                store.getRatingAvg(),
                store.getRatingCount(),
                store.getStatus().name()
        );
    }
}
