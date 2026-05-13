// src/main/java/com/mibazarvirtual/backend/repository/OrderItemRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.OrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIdOrderByIdAsc(Long orderId);
}
