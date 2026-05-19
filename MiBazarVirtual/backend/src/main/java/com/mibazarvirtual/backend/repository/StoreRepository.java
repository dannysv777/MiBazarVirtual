package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Store;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByStatusOrderByRatingAvgDescNameAsc(Store.Status status);

    Optional<Store> findByIdAndStatus(Long id, Store.Status status);

    Optional<Store> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    long countByStatus(Store.Status status);

    @Query("""
            select distinct s
            from Store s
            left join fetch s.user
            where s.status = com.mibazarvirtual.backend.entity.Store.Status.ACTIVE
            """)
    List<Store> findActiveForRecommendations();

    @Query(value = """
            SELECT
                s.id AS storeId,
                s.name AS storeName,
                u.email AS sellerEmail,
                s.status AS status,
                COUNT(DISTINCT o.id) AS totalOrders,
                COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN 1 ELSE 0 END), 0) AS deliveredOrders,
                COALESCE(SUM(CASE WHEN o.status = 'DELIVERED' THEN oi.subtotal ELSE 0 END), 0) AS totalSales,
                COUNT(DISTINCT p.id) AS productCount
            FROM stores s
            JOIN users u ON u.id = s.user_id
            LEFT JOIN products p ON p.store_id = s.id AND p.status <> 'DELETED'
            LEFT JOIN order_items oi ON oi.store_id = s.id
            LEFT JOIN orders o ON o.id = oi.order_id
            GROUP BY s.id, s.name, u.email, s.status
            ORDER BY totalSales DESC, s.name ASC
            """, nativeQuery = true)
    List<AdminStoreReportProjection> getAdminStoreReports();

    interface AdminStoreReportProjection {
        Long getStoreId();

        String getStoreName();

        String getSellerEmail();

        String getStatus();

        long getTotalOrders();

        long getDeliveredOrders();

        BigDecimal getTotalSales();

        long getProductCount();
    }
}
