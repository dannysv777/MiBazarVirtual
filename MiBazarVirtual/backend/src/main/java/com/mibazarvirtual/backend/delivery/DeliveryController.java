package com.mibazarvirtual.backend.delivery;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.orders.OrderService;
import com.mibazarvirtual.backend.repository.OrderItemRepository;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/delivery/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY')")
public class DeliveryController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<Page<DeliveryOrderDTO>>> available(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DeliveryOrderDTO> orders = orderRepository
                .findByStatusOrderByCreatedAtDesc(Order.Status.CONFIRMED, pageable)
                .map(order -> DeliveryOrderDTO.from(order, orderItemRepository.findDeliveryItemsByOrderId(order.getId())));
        return ResponseEntity.ok(ApiResponse.ok(orders, "Available delivery orders"));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<Page<DeliveryOrderDTO>>> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        Long deliveryWorkerId = authenticatedUserResolver.currentUserId(authentication);
        Pageable pageable = PageRequest.of(page, size);
        Page<DeliveryOrderDTO> orders = orderRepository
                .findByDeliveryWorkerIdAndStatusInOrderByCreatedAtDesc(
                        deliveryWorkerId,
                        List.of(Order.Status.READY_FOR_PICKUP, Order.Status.IN_PROGRESS),
                        pageable
                )
                .map(order -> DeliveryOrderDTO.from(order, orderItemRepository.findDeliveryItemsByOrderId(order.getId())));
        return ResponseEntity.ok(ApiResponse.ok(orders, "My delivery orders"));
    }

    @PatchMapping("/{orderId}/accept")
    public ResponseEntity<ApiResponse<?>> accept(@PathVariable Long orderId, Authentication authentication) {
        Long deliveryWorkerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(orderService.acceptOrder(orderId, deliveryWorkerId), "Order accepted"));
    }

    @PatchMapping("/{orderId}/pickup")
    public ResponseEntity<ApiResponse<?>> pickup(@PathVariable Long orderId, Authentication authentication) {
        Long deliveryWorkerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(orderService.markInProgress(orderId, deliveryWorkerId), "Order in progress"));
    }

    @PatchMapping("/{orderId}/deliver")
    public ResponseEntity<ApiResponse<?>> deliver(@PathVariable Long orderId, Authentication authentication) {
        Long deliveryWorkerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(orderService.markDelivered(orderId, deliveryWorkerId), "Order delivered"));
    }
}
