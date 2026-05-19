package com.mibazarvirtual.backend.wallet;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SavedCardRepository extends JpaRepository<SavedCard, Long> {

    List<SavedCard> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);

    Optional<SavedCard> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserId(Long userId);

    @Modifying
    @Query("update SavedCard c set c.isDefault = false where c.user.id = :userId")
    void clearDefaultForUser(@Param("userId") Long userId);
}
