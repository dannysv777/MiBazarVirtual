package com.mibazarvirtual.backend.favorite;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserId(Long userId);

    Optional<Favorite> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    @Modifying
    void deleteByUserIdAndProductId(Long userId, Long productId);

    long countByProductId(Long productId);

    @Query("select f.user.id from Favorite f where f.product.id = :productId")
    List<Long> findUserIdsByProductId(@Param("productId") Long productId);
}
