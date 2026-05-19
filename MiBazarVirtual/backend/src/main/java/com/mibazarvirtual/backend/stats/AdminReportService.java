package com.mibazarvirtual.backend.stats;

import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.repository.OrderRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import com.mibazarvirtual.backend.repository.UserRepository;
import com.mibazarvirtual.backend.stats.dto.AdminOverviewResponse;
import com.mibazarvirtual.backend.stats.dto.AdminStoreReportResponse;
import com.mibazarvirtual.backend.wallet.OrderPaymentRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminReportService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview() {
        OrderRepository.AdminOrderStatsProjection orderStats = orderRepository.getAdminOrderStats();
        OrderPaymentRepository.AdminPaymentStatsProjection paymentStats = orderPaymentRepository.getAdminPaymentStats();

        return new AdminOverviewResponse(
                userRepository.count(),
                userRepository.countByRole(User.Role.BUYER),
                userRepository.countByRole(User.Role.SELLER),
                userRepository.countByRole(User.Role.DELIVERY),
                storeRepository.countByStatus(Store.Status.ACTIVE),
                storeRepository.countByStatus(Store.Status.PENDING),
                storeRepository.countByStatus(Store.Status.SUSPENDED),
                productRepository.count(),
                productRepository.countByStatus(Product.Status.ACTIVE),
                productRepository.countByStatus(Product.Status.OUT_OF_STOCK),
                orderStats.getTotalOrders(),
                orderStats.getPendingOrders(),
                orderStats.getPartiallyConfirmedOrders(),
                orderStats.getConfirmedOrders(),
                orderStats.getReadyForPickupOrders(),
                orderStats.getInProgressOrders(),
                orderStats.getDeliveredOrders(),
                orderStats.getCancelledOrders(),
                safe(orderStats.getDeliveredRevenue()),
                safe(orderStats.getDeliveryFees()),
                paymentStats.getPaymentRecords(),
                safe(paymentStats.getGrossPaymentAmount()),
                safe(paymentStats.getPlatformFees()),
                safe(paymentStats.getSellerPayouts())
        );
    }

    @Transactional(readOnly = true)
    public List<AdminStoreReportResponse> getStoreReports() {
        return storeRepository.getAdminStoreReports()
                .stream()
                .map(AdminStoreReportResponse::from)
                .toList();
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
