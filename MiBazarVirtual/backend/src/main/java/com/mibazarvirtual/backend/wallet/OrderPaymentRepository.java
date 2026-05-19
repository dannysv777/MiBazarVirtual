package com.mibazarvirtual.backend.wallet;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderPaymentRepository extends JpaRepository<OrderPayment, Long> {

    Optional<OrderPayment> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    @Query(value = """
            SELECT
                COUNT(*) AS paymentRecords,
                COALESCE(SUM(amount), 0) AS grossPaymentAmount,
                COALESCE(SUM(platform_fee), 0) AS platformFees,
                COALESCE(SUM(seller_payout), 0) AS sellerPayouts
            FROM order_payments
            """, nativeQuery = true)
    AdminPaymentStatsProjection getAdminPaymentStats();

    interface AdminPaymentStatsProjection {
        long getPaymentRecords();

        java.math.BigDecimal getGrossPaymentAmount();

        java.math.BigDecimal getPlatformFees();

        java.math.BigDecimal getSellerPayouts();
    }
}
