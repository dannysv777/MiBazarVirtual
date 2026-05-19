package com.mibazarvirtual.backend.wallet.dto;

import com.mibazarvirtual.backend.wallet.SavedCard;

public record SavedCardDTO(
        Long id,
        String alias,
        String lastFour,
        String brand,
        Integer expiryMonth,
        Integer expiryYear,
        Boolean isDefault
) {
    public static SavedCardDTO from(SavedCard card) {
        return new SavedCardDTO(
                card.getId(),
                card.getCardAlias(),
                card.getLastFour(),
                card.getCardBrand(),
                card.getExpiryMonth().intValue(),
                card.getExpiryYear().intValue(),
                card.getIsDefault()
        );
    }
}
