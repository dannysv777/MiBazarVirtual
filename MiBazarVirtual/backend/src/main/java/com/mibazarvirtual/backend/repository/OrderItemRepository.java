// src/main/java/com/mibazarvirtual/backend/repository/OrderItemRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.OrderItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIdOrderByIdAsc(Long orderId);

    @Query("""
            select oi
            from OrderItem oi
            join fetch oi.order o
            join fetch oi.product p
            join fetch oi.store s
            join fetch s.user
            where o.id = :orderId
            order by oi.id asc
            """)
    List<OrderItem> findDeliveryItemsByOrderId(@Param("orderId") Long orderId);

    List<OrderItem> findByOrderIdAndStoreIdOrderByIdAsc(Long orderId, Long storeId);

    @Query("""
            select oi
            from OrderItem oi
            join fetch oi.order o
            join fetch oi.product p
            join fetch oi.store s
            where oi.id = :itemId
              and o.id = :orderId
            """)
    java.util.Optional<OrderItem> findDetailedByOrderIdAndItemId(
            @Param("orderId") Long orderId,
            @Param("itemId") Long itemId
    );

    @Query("""
            select oi.product.id as productId, count(oi.id) as total
            from OrderItem oi
            where oi.order.status = com.mibazarvirtual.backend.entity.Order.Status.DELIVERED
              and oi.order.createdAt >= :since
            group by oi.product.id
            """)
    List<ProductCountProjection> countDeliveredByProductSince(@Param("since") LocalDateTime since);

    @Query("""
            select oi.product.store.id as storeId, count(oi.id) as total
            from OrderItem oi
            where oi.order.status = com.mibazarvirtual.backend.entity.Order.Status.DELIVERED
            group by oi.product.store.id
            """)
    List<StoreCountProjection> countDeliveredByStore();

    @Query("""
            select oi.product.category.id as categoryId, count(oi.id) as total
            from OrderItem oi
            where oi.order.buyer.id = :buyerId
              and oi.order.status = com.mibazarvirtual.backend.entity.Order.Status.DELIVERED
            group by oi.product.category.id
            order by count(oi.id) desc
            """)
    List<CategoryCountProjection> findBuyerTopCategories(@Param("buyerId") Long buyerId);

    @Query("""
            select oi.product.id
            from OrderItem oi
            where oi.order.buyer.id = :buyerId
              and oi.order.status = com.mibazarvirtual.backend.entity.Order.Status.DELIVERED
            group by oi.product.id
            having count(oi.id) >= 3
            """)
    List<Long> findBuyerAvoidedProductIds(@Param("buyerId") Long buyerId);

    @Query("""
            select avg(oi.unitPrice)
            from OrderItem oi
            where oi.order.buyer.id = :buyerId
              and oi.order.status = com.mibazarvirtual.backend.entity.Order.Status.DELIVERED
            """)
    BigDecimal findBuyerAverageUnitPrice(@Param("buyerId") Long buyerId);

    interface ProductCountProjection {
        Long getProductId();

        long getTotal();
    }

    interface StoreCountProjection {
        Long getStoreId();

        long getTotal();
    }

    interface CategoryCountProjection {
        Long getCategoryId();

        long getTotal();
    }
}
