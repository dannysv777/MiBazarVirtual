// src/main/java/com/mibazarvirtual/backend/repository/ProductRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Product;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByIdAndStatus(Long id, Product.Status status);

    Page<Product> findByStatus(Product.Status status, Pageable pageable);

    Page<Product> findByStoreIdAndStatus(Long storeId, Product.Status status, Pageable pageable);

    Page<Product> findByCategoryIdAndStatus(Long categoryId, Product.Status status, Pageable pageable);

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
}
