// src/main/java/com/mibazarvirtual/backend/repository/OrderRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Order;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    boolean existsByBuyerIdAndStoreIdAndStatus(Long buyerId, Long storeId, Order.Status status);

    Page<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    Page<Order> findByStoreIdOrderByCreatedAtDesc(Long storeId, Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtDesc(Order.Status status, Pageable pageable);

    Page<Order> findByStoreIdAndStatusOrderByCreatedAtDesc(Long storeId, Order.Status status, Pageable pageable);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<Order> findByIdAndBuyerId(Long id, Long buyerId);

    Page<Order> findByDeliveryWorkerIdAndStatusInOrderByCreatedAtDesc(
            Long deliveryWorkerId,
            java.util.List<Order.Status> statuses,
            Pageable pageable
    );

    @Query(value = """
            SELECT
                COUNT(*) AS totalOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS deliveredOrders,
                COALESCE(SUM(CASE WHEN status IN ('READY_FOR_PICKUP', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) AS activeOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) AS totalCollected
            FROM orders
            WHERE delivery_worker_id = :deliveryWorkerId
            """, nativeQuery = true)
    DeliveryStatsProjection getDeliveryStats(@Param("deliveryWorkerId") Long deliveryWorkerId);

    @Query("""
            select distinct oi.order
            from OrderItem oi
            where oi.store.id = :storeId
            order by oi.order.createdAt desc
            """)
    Page<Order> findSellerOrders(@Param("storeId") Long storeId, Pageable pageable);

    @Query("""
            select distinct oi.order
            from OrderItem oi
            where oi.store.id = :storeId
              and oi.order.status = :status
            order by oi.order.createdAt desc
            """)
    Page<Order> findSellerOrdersByStatus(
            @Param("storeId") Long storeId,
            @Param("status") Order.Status status,
            Pageable pageable
    );

    @Query(value = """
            SELECT
                COUNT(*) AS totalOrders,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingOrders,
                COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedOrders,
                COALESCE(SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) AS inProgressOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS deliveredOrders,
                COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelledOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) AS totalRevenue
            FROM (
                SELECT DISTINCT o.id, o.status, o.total
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                WHERE oi.store_id = :storeId
            ) seller_orders
            """, nativeQuery = true)
    SellerOrderStatsProjection getSellerOrderStats(@Param("storeId") Long storeId);

    @Query(value = """
            SELECT
                COUNT(*) AS totalOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS deliveredOrders,
                COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelledOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) AS totalSpent
            FROM orders
            WHERE buyer_id = :buyerId
            """, nativeQuery = true)
    BuyerOrderStatsProjection getBuyerOrderStats(@Param("buyerId") Long buyerId);

    @Query(value = """
            SELECT
                COUNT(*) AS totalOrders,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingOrders,
                COALESCE(SUM(CASE WHEN status = 'PARTIALLY_CONFIRMED' THEN 1 ELSE 0 END), 0) AS partiallyConfirmedOrders,
                COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedOrders,
                COALESCE(SUM(CASE WHEN status = 'READY_FOR_PICKUP' THEN 1 ELSE 0 END), 0) AS readyForPickupOrders,
                COALESCE(SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) AS inProgressOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS deliveredOrders,
                COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelledOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) AS deliveredRevenue,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN delivery_fee ELSE 0 END), 0) AS deliveryFees
            FROM orders
            """, nativeQuery = true)
    AdminOrderStatsProjection getAdminOrderStats();

    interface SellerOrderStatsProjection {
        long getTotalOrders();

        long getPendingOrders();

        long getConfirmedOrders();

        long getInProgressOrders();

        long getDeliveredOrders();

        long getCancelledOrders();

        java.math.BigDecimal getTotalRevenue();
    }

    interface BuyerOrderStatsProjection {
        long getTotalOrders();

        long getDeliveredOrders();

        long getCancelledOrders();

        java.math.BigDecimal getTotalSpent();
    }

    interface DeliveryStatsProjection {
        long getTotalOrders();

        long getDeliveredOrders();

        long getActiveOrders();

        java.math.BigDecimal getTotalCollected();
    }

    interface AdminOrderStatsProjection {
        long getTotalOrders();

        long getPendingOrders();

        long getPartiallyConfirmedOrders();

        long getConfirmedOrders();

        long getReadyForPickupOrders();

        long getInProgressOrders();

        long getDeliveredOrders();

        long getCancelledOrders();

        java.math.BigDecimal getDeliveredRevenue();

        java.math.BigDecimal getDeliveryFees();
    }
}
