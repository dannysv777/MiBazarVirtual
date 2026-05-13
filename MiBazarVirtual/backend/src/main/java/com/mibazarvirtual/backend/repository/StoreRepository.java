package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Store;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByStatusOrderByRatingAvgDescNameAsc(Store.Status status);

    Optional<Store> findByIdAndStatus(Long id, Store.Status status);
}
