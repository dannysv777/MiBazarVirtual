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
import com.mibazarvirtual.backend.notification.NotificationService;
import com.mibazarvirtual.backend.orders.dto.CreateOrderRequest;
import com.mibazarvirtual.backend.orders.dto.OrderItemRequest;
import com.mibazarvirtual.backend.orders.dto.OrderResponse;
import com.mibazarvirtual.backend.repository.OrderItemRepository;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import com.mibazarvirtual.backend.repository.UserRepository;
import com.mibazarvirtual.backend.wallet.WalletService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
    private final NotificationService notificationService;
    private final WalletService walletService;

    @Transactional
    public OrderResponse createOrder(Long buyerId, CreateOrderRequest request) {
        if (request.deliveryType() == Order.DeliveryType.DELIVERY
                && (request.deliveryAddress() == null || request.deliveryAddress().isBlank())) {
            throw new IllegalArgumentException("deliveryAddress is required for DELIVERY orders");
        }

        Map<Long, Integer> quantitiesByProduct = aggregateQuantities(request.items());
        Map<Product, Integer> products = new LinkedHashMap<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> entry : quantitiesByProduct.entrySet()) {
            Product product = productRepository.findLockedById(entry.getKey())
                    .orElseThrow(() -> new ProductNotFoundException(entry.getKey()));
            int requestedQuantity = entry.getValue();
            validateProductForOrder(product, buyerId, requestedQuantity);
            products.put(product, requestedQuantity);
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(requestedQuantity)));
        }

        BigDecimal deliveryFee = request.deliveryType() == Order.DeliveryType.DELIVERY ? DELIVERY_FEE : BigDecimal.ZERO;
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new AccessDeniedException("Authenticated buyer was not found"));

        Order order = new Order();
        order.setBuyer(buyer);
        order.setStore(resolveLegacySingleStore(products));
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
        savedItems.stream()
                .filter(item -> item.getStore() != null)
                .collect(Collectors.groupingBy(OrderItem::getStore, LinkedHashMap::new, Collectors.counting()))
                .forEach((store, itemCount) -> notificationService.notifyNewOrderReceived(savedOrder, store, itemCount));
        walletService.createPaymentRecord(savedOrder.getId(), savedOrder.getTotal(), "CASH_ON_DELIVERY");
        log.info("Created multi-vendor order {} for buyer {}", savedOrder.getId(), buyerId);
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
        if (order.getStatus() != Order.Status.PENDING && order.getStatus() != Order.Status.PARTIALLY_CONFIRMED) {
            throw new CannotCancelOrderException();
        }

        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
        for (OrderItem item : items) {
            if (item.getItemStatus() != OrderItem.ItemStatus.REJECTED) {
                restoreStock(item);
            }
        }

        order.setStatus(Order.Status.CANCELLED);
        notificationService.notifyOrderCancelled(order, "Cancelado por el comprador");
        log.info("Cancelled order {} by buyer {}", orderId, buyerId);
        return OrderResponse.from(order, items);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getSellerOrders(Long sellerId, Order.Status status, Pageable pageable) {
        Store store = storeRepository.findByUserId(sellerId)
                .orElseThrow(() -> new StoreNotFoundException(sellerId));
        Page<Order> orders = status == null
                ? orderRepository.findSellerOrders(store.getId(), pageable)
                : orderRepository.findSellerOrdersByStatus(store.getId(), status, pageable);
        return orders.map(order -> OrderResponse.from(
                order,
                orderItemRepository.findByOrderIdAndStoreIdOrderByIdAsc(order.getId(), store.getId())
        ));
    }

    @Transactional
    public OrderResponse confirmItem(Long orderId, Long itemId, Long sellerId, boolean available, String note) {
        Store sellerStore = storeRepository.findByUserId(sellerId)
                .orElseThrow(() -> new StoreNotFoundException(sellerId));
        OrderItem item = orderItemRepository.findDetailedByOrderIdAndItemId(orderId, itemId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!item.getStore().getId().equals(sellerStore.getId())) {
            throw new AccessDeniedException("Seller does not own this order item");
        }
        if (item.getOrder().getStatus() == Order.Status.CANCELLED || item.getOrder().getStatus() == Order.Status.DELIVERED) {
            throw new InvalidOrderStatusTransitionException(item.getOrder().getStatus(), item.getOrder().getStatus());
        }
        if (item.getItemStatus() != OrderItem.ItemStatus.PENDING) {
            return OrderResponse.from(item.getOrder(), orderItemRepository.findByOrderIdAndStoreIdOrderByIdAsc(orderId, sellerStore.getId()));
        }

        item.setItemStatus(available ? OrderItem.ItemStatus.CONFIRMED : OrderItem.ItemStatus.REJECTED);
        item.setVendorNote(note == null || note.isBlank() ? null : note.trim());

        if (!available) {
            restoreStock(item);
            notificationService.notifyItemRejected(item.getOrder().getBuyer().getId(), item.getProductName());
        }

        recalculateOrderAfterVendorResponse(item.getOrder());
        log.info("Seller {} marked order {} item {} as {}", sellerId, orderId, itemId, item.getItemStatus());
        return OrderResponse.from(item.getOrder(), orderItemRepository.findByOrderIdAndStoreIdOrderByIdAsc(orderId, sellerStore.getId()));
    }

    @Transactional
    public OrderResponse updateSellerOrderStatus(Long sellerId, Long orderId, Order.Status nextStatus) {
        if (nextStatus == Order.Status.CONFIRMED) {
            Store store = storeRepository.findByUserId(sellerId)
                    .orElseThrow(() -> new StoreNotFoundException(sellerId));
            List<OrderItem> items = orderItemRepository.findByOrderIdAndStoreIdOrderByIdAsc(orderId, store.getId());
            for (OrderItem item : items) {
                if (item.getItemStatus() == OrderItem.ItemStatus.PENDING) {
                    confirmItem(orderId, item.getId(), sellerId, true, null);
                }
            }
            Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));
            return OrderResponse.from(order, orderItemRepository.findByOrderIdAndStoreIdOrderByIdAsc(orderId, store.getId()));
        }
        throw new InvalidOrderStatusTransitionException(Order.Status.CONFIRMED, nextStatus);
    }

    @Transactional
    public OrderResponse acceptOrder(Long orderId, Long deliveryWorkerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        User deliveryWorker = userRepository.findById(deliveryWorkerId)
                .orElseThrow(() -> new AccessDeniedException("Delivery worker was not found"));
        if (deliveryWorker.getRole() != User.Role.DELIVERY) {
            throw new AccessDeniedException("Only delivery users can accept orders");
        }
        if (order.getStatus() != Order.Status.CONFIRMED) {
            throw new InvalidOrderStatusTransitionException(order.getStatus(), Order.Status.READY_FOR_PICKUP);
        }

        order.setDeliveryWorker(deliveryWorker);
        order.setDeliveryAcceptedAt(LocalDateTime.now());
        order.setStatus(Order.Status.READY_FOR_PICKUP);
        notificationService.notifyDeliveryAccepted(order);
        log.info("Delivery worker {} accepted order {}", deliveryWorkerId, orderId);
        return toResponse(order);
    }

    @Transactional
    public OrderResponse markInProgress(Long orderId, Long deliveryWorkerId) {
        Order order = findDeliveryOrder(orderId, deliveryWorkerId);
        if (order.getStatus() != Order.Status.READY_FOR_PICKUP) {
            throw new InvalidOrderStatusTransitionException(order.getStatus(), Order.Status.IN_PROGRESS);
        }
        order.setStatus(Order.Status.IN_PROGRESS);
        notificationService.notifyOrderInProgress(order);
        return toResponse(order);
    }

    @Transactional
    public OrderResponse markDelivered(Long orderId, Long deliveryWorkerId) {
        Order order = findDeliveryOrder(orderId, deliveryWorkerId);
        if (order.getStatus() != Order.Status.IN_PROGRESS) {
            throw new InvalidOrderStatusTransitionException(order.getStatus(), Order.Status.DELIVERED);
        }
        order.setStatus(Order.Status.DELIVERED);
        notificationService.notifyOrderDelivered(order);
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAdminOrders(Order.Status status, Long storeId, Pageable pageable) {
        Page<Order> orders;
        if (status != null && storeId != null) {
            orders = orderRepository.findSellerOrdersByStatus(storeId, status, pageable);
        } else if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else if (storeId != null) {
            orders = orderRepository.findSellerOrders(storeId, pageable);
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

    private Store resolveLegacySingleStore(Map<Product, Integer> products) {
        List<Long> storeIds = products.keySet().stream()
                .map(product -> product.getStore().getId())
                .distinct()
                .toList();
        return storeIds.size() == 1 ? products.keySet().iterator().next().getStore() : null;
    }

    private void validateProductForOrder(Product product, Long buyerId, int requestedQuantity) {
        if (product.getStore().getUser().getId().equals(buyerId)) {
            throw new AccessDeniedException("Buyer cannot order from their own store");
        }
        if (product.getStore().getStatus() != Store.Status.ACTIVE) {
            throw new IllegalArgumentException("Store is not active");
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
        item.setStore(product.getStore());
        item.setProductName(product.getName());
        item.setUnit(product.getUnit());
        item.setQuantity(quantity);
        item.setUnitPrice(product.getPrice());
        item.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        item.setItemStatus(OrderItem.ItemStatus.PENDING);
        return item;
    }

    private void recalculateOrderAfterVendorResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderIdOrderByIdAsc(order.getId());
        long pendingCount = items.stream().filter(item -> item.getItemStatus() == OrderItem.ItemStatus.PENDING).count();
        long confirmedCount = items.stream().filter(item -> item.getItemStatus() == OrderItem.ItemStatus.CONFIRMED).count();
        long rejectedCount = items.stream().filter(item -> item.getItemStatus() == OrderItem.ItemStatus.REJECTED).count();

        if (confirmedCount == 0 && rejectedCount == items.size()) {
            order.setSubtotal(BigDecimal.ZERO);
            order.setDeliveryFee(BigDecimal.ZERO);
            order.setTotal(BigDecimal.ZERO);
            order.setStatus(Order.Status.CANCELLED);
            notificationService.notifyOrderCancelled(order, "Todos los productos fueron rechazados");
            return;
        }

        if (pendingCount == 0 && confirmedCount > 0) {
            updateOrderTotalsFromConfirmedItems(order, items);
            order.setStatus(Order.Status.CONFIRMED);
            notificationService.notifyOrderConfirmed(order);
            if (rejectedCount > 0) {
                notificationService.notifyItemRejected(order.getBuyer().getId(), rejectedCount + " producto(s) de tu pedido");
            }
            notificationService.notifyDeliveryAvailable(order);
            return;
        }

        if (confirmedCount > 0 || rejectedCount > 0) {
            order.setStatus(Order.Status.PARTIALLY_CONFIRMED);
        } else {
            order.setStatus(Order.Status.PENDING);
        }
    }

    private void updateOrderTotalsFromConfirmedItems(Order order, List<OrderItem> items) {
        BigDecimal subtotal = items.stream()
                .filter(item -> item.getItemStatus() == OrderItem.ItemStatus.CONFIRMED)
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal deliveryFee = order.getDeliveryType() == Order.DeliveryType.DELIVERY ? DELIVERY_FEE : BigDecimal.ZERO;
        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTotal(subtotal.add(deliveryFee));
    }

    private Order findDeliveryOrder(Long orderId, Long deliveryWorkerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        if (order.getDeliveryWorker() == null || !order.getDeliveryWorker().getId().equals(deliveryWorkerId)) {
            throw new AccessDeniedException("Delivery worker does not own this order");
        }
        return order;
    }

    private void restoreStock(OrderItem item) {
        Product product = productRepository.findLockedById(item.getProduct().getId())
                .orElseThrow(() -> new ProductNotFoundException(item.getProduct().getId()));
        product.setStock(product.getStock() + item.getQuantity());
        if (product.getStatus() == Product.Status.OUT_OF_STOCK && product.getStock() > 0) {
            product.setStatus(Product.Status.ACTIVE);
        }
    }

    private OrderResponse toResponse(Order order) {
        return OrderResponse.from(order, orderItemRepository.findByOrderIdOrderByIdAsc(order.getId()));
    }
}
