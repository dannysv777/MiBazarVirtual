// src/main/java/com/mibazarvirtual/backend/repository/ReviewRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Review;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByOrderId(Long orderId);

    Page<Review> findByStoreIdOrderByCreatedAtDesc(Long storeId, Pageable pageable);

    @Query(value = "SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE store_id = :storeId", nativeQuery = true)
    BigDecimal averageRatingByStoreId(@Param("storeId") Long storeId);

    long countByStoreId(Long storeId);
}
