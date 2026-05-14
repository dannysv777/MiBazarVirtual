// src/main/java/com/mibazarvirtual/backend/repository/ProductRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Product;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findByIdAndStatus(Long id, Product.Status status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findLockedById(@Param("id") Long id);

    Page<Product> findByStatus(Product.Status status, Pageable pageable);

    Page<Product> findByStoreIdAndStatus(Long storeId, Product.Status status, Pageable pageable);

    Page<Product> findByCategoryIdAndStatus(Long categoryId, Product.Status status, Pageable pageable);

    boolean existsByCategoryId(Long categoryId);

    long countByStatus(Product.Status status);

    @Query(value = """
            SELECT
                COUNT(*) AS totalProducts,
                COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) AS activeProducts,
                COALESCE(SUM(CASE WHEN stock = 0 AND status <> 'DELETED' THEN 1 ELSE 0 END), 0) AS outOfStockProducts
            FROM products
            WHERE store_id = :storeId
            """, nativeQuery = true)
    ProductStatsProjection getProductStatsByStoreId(@Param("storeId") Long storeId);

    @Query("""
            select p
            from Product p
            where p.store.user.id = :sellerId
              and p.status <> :status
            """)
    Page<Product> findSellerProducts(
            @Param("sellerId") Long sellerId,
            @Param("status") Product.Status status,
            Pageable pageable
    );

    @Query("""
            select p
            from Product p
            where p.status = :status
              and (
                lower(p.name) like lower(concat('%', :query, '%'))
                or lower(p.description) like lower(concat('%', :query, '%'))
                or lower(p.store.name) like lower(concat('%', :query, '%'))
              )
            """)
    Page<Product> searchActiveProducts(
            @Param("query") String query,
            @Param("status") Product.Status status,
            Pageable pageable
    );

    interface ProductStatsProjection {
        long getTotalProducts();

        long getActiveProducts();

        long getOutOfStockProducts();
    }
}
