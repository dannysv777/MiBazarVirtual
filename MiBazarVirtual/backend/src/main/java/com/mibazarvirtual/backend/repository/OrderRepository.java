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

    @Query(value = """
            SELECT
                COUNT(*) AS totalOrders,
                COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pendingOrders,
                COALESCE(SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END), 0) AS confirmedOrders,
                COALESCE(SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) AS inProgressOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS deliveredOrders,
                COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelledOrders,
                COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0) AS totalRevenue
            FROM orders
            WHERE store_id = :storeId
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
}
