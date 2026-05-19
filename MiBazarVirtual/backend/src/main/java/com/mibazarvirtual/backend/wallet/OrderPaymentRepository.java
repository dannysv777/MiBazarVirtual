package com.mibazarvirtual.backend.wallet;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {

    Optional<OrderPayment> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);
}
