// src/main/java/com/mibazarvirtual/backend/orders/OrderService.java
package com.mibazarvirtual.backend.orders;

import com.mibazarvirtual.backend.entity.Order;
import com.mibazarvirtual.backend.entity.OrderItem;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.exception.CannotCancelOrderException;
import com.mibazarvirtual.backend.exception.InsufficientStockException;
import com.mibazarvirtual.backend.exception.InvalidOrderStatusTransitionException;
import com.mibazarvirtual.backend.exception.OrderNotFoundException;
import com.mibazarvirtual.backend.exception.ProductNotFoundException;
import com.mibazarvirtual.backend.exception.StoreNotFoundException;
import com.mibazarvirtual.backend.orders.dto.CreateOrderRequest;
import com.mibazarvirtual.backend.orders.dto.OrderItemRequest;
import com.mibazarvirtual.backend.orders.dto.OrderResponse;
import com.mibazarvirtual.backend.repository.OrderItemRepository;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import com.mibazarvirtual.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private static final BigDecimal DELIVERY_FEE = new BigDecimal("15.00");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse createOrder(Long buyerId, CreateOrderRequest request) {
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new StoreNotFoundException(request.storeId()));
        if (store.getUser().getId().equals(buyerId)) {
            throw new AccessDeniedException("Buyer cannot order from their own store");
        }
        if (store.getStatus() != Store.Status.ACTIVE) {
            throw new IllegalArgumentException("Store is not active");
        }
        if (request.deliveryType() == Order.DeliveryType.DELIVERY
                && (request.deliveryAddress() == null || request.deliveryAddress().isBlank())) {
            throw new IllegalArgumentException("deliveryAddress is required for DELIVERY orders");
        }
        if (orderRepository.existsByBuyerIdAndStoreIdAndStatus(buyerId, store.getId(), Order.Status.PENDING)) {
            throw new IllegalStateException("Buyer already has a pending order for this store");
        }

        Map<Long, Integer> quantitiesByProduct = aggregateQuantities(request.items());
        Map<Product, Integer> products = new LinkedHashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : quantitiesByProduct.entrySet()) {
            Product product = productRepository.findLockedById(entry.getKey())
                    .orElseThrow(() -> new ProductNotFoundException(entry.getKey()));
            int requestedQuantity = entry.getValue();
            validateProductForOrder(product, store.getId(), requestedQuantity);
            products.put(product, requestedQuantity);
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(requestedQuantity)));
        }

        BigDecimal deliveryFee = request.deliveryType() == Order.DeliveryType.DELIVERY ? DELIVERY_FEE : BigDecimal.ZERO;

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new AccessDeniedException("Authenticated buyer was not found"));

        Order order = new Order();
        order.setBuyer(buyer);
        order.setStore(store);
        order.setStatus(Order.Status.PENDING);
        order.setDeliveryType(request.deliveryType());
        order.setDeliveryAddress(request.deliveryType() == Order.DeliveryType.DELIVERY ? request.deliveryAddress().trim() : null);
        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTotal(subtotal.add(deliveryFee));
        order.setNotes(request.notes());

        Order savedOrder = orderRepository.save(order);
        List<OrderItem> items = products.entrySet().stream()
                .map(entry -> buildOrderItem(savedOrder, entry.getKey(), entry.getValue()))
                .toList();

        products.forEach((product, quantity) -> {
            product.setStock(product.getStock() - quantity);
            if (product.getStock() == 0) {
                product.setStatus(Product.Status.OUT_OF_STOCK);
            }
        });

        List<OrderItem> savedItems = orderItemRepository.saveAll(items);
        log.info("Created order {} for buyer {} and store {}", savedOrder.getId(), buyerId, store.getId());
        return OrderResponse.from(savedOrder, savedItems);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getBuyerOrders(Long buyerId, Pageable pageable) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse getBuyerOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findByIdAndBuyerId(orderId, buyerId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelBuyerOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findByIdAndBuyerId(orderId, buyerId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        if (order.getStatus() != Order.Status.PENDING) {
            throw new CannotCancelOrderException();
        }

        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
        for (OrderItem item : items) {
            Product product = productRepository.findLockedById(item.getProduct().getId())
                    .orElseThrow(() -> new ProductNotFoundException(item.getProduct().getId()));
            product.setStock(product.getStock() + item.getQuantity());
            if (product.getStatus() == Product.Status.OUT_OF_STOCK && product.getStock() > 0) {
                product.setStatus(Product.Status.ACTIVE);
            }
        }

        order.setStatus(Order.Status.CANCELLED);
        log.info("Cancelled order {} by buyer {}", orderId, buyerId);
        return OrderResponse.from(order, items);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getSellerOrders(Long sellerId, Order.Status status, Pageable pageable) {
        Store store = storeRepository.findByUserId(sellerId)
                .orElseThrow(() -> new StoreNotFoundException(sellerId));
        Page<Order> orders = status == null
                ? orderRepository.findByStoreIdOrderByCreatedAtDesc(store.getId(), pageable)
                : orderRepository.findByStoreIdAndStatusOrderByCreatedAtDesc(store.getId(), status, pageable);
        return orders.map(this::toResponse);
    }

    @Transactional
    public OrderResponse updateSellerOrderStatus(Long sellerId, Long orderId, Order.Status nextStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        if (!order.getStore().getUser().getId().equals(sellerId)) {
            throw new AccessDeniedException("Seller does not own this order");
        }
        validateStatusTransition(order.getStatus(), nextStatus);
        order.setStatus(nextStatus);
        log.info("Updated order {} status to {}", orderId, nextStatus);
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAdminOrders(Order.Status status, Long storeId, Pageable pageable) {
        Page<Order> orders;
        if (status != null && storeId != null) {
            orders = orderRepository.findByStoreIdAndStatusOrderByCreatedAtDesc(storeId, status, pageable);
        } else if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (storeId != null) {
            orders = orderRepository.findByStoreIdOrderByCreatedAtDesc(storeId, pageable);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return orders.map(this::toResponse);
    }

    private Map<Long, Integer> aggregateQuantities(List<OrderItemRequest> items) {
        Map<Long, Integer> quantitiesByProduct = new LinkedHashMap<>();
        for (OrderItemRequest item : items) {
            quantitiesByProduct.merge(item.productId(), item.quantity(), Integer::sum);
        }
        return quantitiesByProduct;
    }

    private void validateProductForOrder(Product product, Long storeId, int requestedQuantity) {
        if (!product.getStore().getId().equals(storeId)) {
            throw new IllegalArgumentException("Product " + product.getId() + " does not belong to the selected store");
        }
        if (product.getStatus() != Product.Status.ACTIVE) {
            throw new IllegalArgumentException("Product '" + product.getName() + "' is not available");
        }
        if (product.getStock() < requestedQuantity) {
            throw new InsufficientStockException(product.getName(), product.getStock());
        }
    }

    private OrderItem buildOrderItem(Order order, Product product, int quantity) {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setProductName(product.getName());
        item.setUnit(product.getUnit());
        item.setQuantity(quantity);
        item.setUnitPrice(product.getPrice());
        item.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        return item;
    }

    private void validateStatusTransition(Order.Status currentStatus, Order.Status nextStatus) {
        if (nextStatus == Order.Status.CANCELLED
                || currentStatus == Order.Status.CANCELLED
                || currentStatus == Order.Status.DELIVERED
                || nextStatus.ordinal() != currentStatus.ordinal() + 1) {
            throw new InvalidOrderStatusTransitionException(currentStatus, nextStatus);
        }
    }

    private OrderResponse toResponse(Order order) {
        return OrderResponse.from(order, orderItemRepository.findByOrderIdOrderByIdAsc(order.getId()));
    }
}
