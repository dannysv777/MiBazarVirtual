// src/main/java/com/mibazarvirtual/backend/repository/OrderRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Order;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    boolean existsByBuyerIdAndStoreIdAndStatus(Long buyerId, Long storeId, Order.Status status);

    Page<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    Page<Order> findByStoreIdOrderByCreatedAtDesc(Long storeId, Pageable pageable);

    Page<Order> findByStatusOrderByCreatedAtDesc(Order.Status status, Pageable pageable);

    Page<Order> findByStoreIdAndStatusOrderByCreatedAtDesc(Long storeId, Order.Status status, Pageable pageable);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<Order> findByIdAndBuyerId(Long id, Long buyerId);
}
