package com.mibazarvirtual.backend.delivery;

import com.mibazarvirtual.backend.entity.OrderItem;
import com.mibazarvirtual.backend.entity.Store;
import java.util.List;

public record VendorGroupDTO(
        Long storeId,
        String storeName,
        Long sellerId,
        String sellerUsername,
        String storeAddress,
        List<ItemSummaryDTO> items
) {
    public static VendorGroupDTO from(Store store, List<OrderItem> items) {
        return new VendorGroupDTO(
                store.getId(),
                store.getName(),
                store.getUser().getId(),
                store.getUser().getUsername(),
                store.getAddress(),
                items.stream().map(ItemSummaryDTO::from).toList()
        );
    }
}
