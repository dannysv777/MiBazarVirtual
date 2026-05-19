package com.mibazarvirtual.backend.delivery;

import com.mibazarvirtual.backend.entity.OrderItem;
import com.mibazarvirtual.backend.entity.Store;
import java.util.List;

public record VendorGroupDTO(
        String storeName,
        String storeAddress,
        List<ItemSummaryDTO> items
) {
    public static VendorGroupDTO from(Store store, List<OrderItem> items) {
        return new VendorGroupDTO(
                store.getName(),
                store.getAddress(),
                items.stream().map(ItemSummaryDTO::from).toList()
        );
    }
}
