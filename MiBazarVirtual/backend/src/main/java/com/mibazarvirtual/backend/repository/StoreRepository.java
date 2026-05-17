package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Store;
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
}
