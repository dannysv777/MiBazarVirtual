package com.mibazarvirtual.backend.delivery;

import com.mibazarvirtual.backend.entity.OrderItem;
import java.math.BigDecimal;

public record ItemSummaryDTO(
        String productName,
        Integer quantity,
        BigDecimal unitPrice
) {
    public static ItemSummaryDTO from(OrderItem item) {
        return new ItemSummaryDTO(item.getProductName(), item.getQuantity(), item.getUnitPrice());
    }
}
