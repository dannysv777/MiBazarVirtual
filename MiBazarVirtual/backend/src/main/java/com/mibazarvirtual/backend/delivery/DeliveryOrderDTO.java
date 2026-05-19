package com.mibazarvirtual.backend.delivery;

import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.entity.OrderItem;
import com.mibazarvirtual.backend.entity.Store;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record DeliveryOrderDTO(
        Long orderId,
        Long buyerId,
        String buyerName,
        String deliveryAddress,
        String buyerPhone,
        BigDecimal totalAmount,
        Integer itemCount,
        List<VendorGroupDTO> vendorGroups,
        String status,
        LocalDateTime deliveryAcceptedAt
) {
    public static DeliveryOrderDTO from(Order order, List<OrderItem> items) {
        Map<Store, List<OrderItem>> itemsByStore = items.stream()
                .filter(item -> item.getItemStatus() == OrderItem.ItemStatus.CONFIRMED)
                .filter(item -> item.getStore() != null)
                .collect(Collectors.groupingBy(OrderItem::getStore, LinkedHashMap::new, Collectors.toList()));

        return new DeliveryOrderDTO(
                order.getId(),
                order.getBuyer().getId(),
                order.getBuyer().getFullName(),
                order.getDeliveryAddress(),
                order.getBuyer().getPhone(),
                order.getTotal(),
                itemsByStore.values().stream().mapToInt(List::size).sum(),
                itemsByStore.entrySet().stream()
                        .map(entry -> VendorGroupDTO.from(entry.getKey(), entry.getValue()))
                        .toList(),
                order.getStatus().name(),
                order.getDeliveryAcceptedAt()
        );
    }
}
