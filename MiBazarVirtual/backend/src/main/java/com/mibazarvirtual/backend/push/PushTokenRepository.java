package com.mibazarvirtual.backend.push;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushTokenRepository extends JpaRepository<PushToken, Long> {

    Optional<PushToken> findByToken(String token);

    List<PushToken> findByUserIdAndActiveTrue(Long userId);

    List<PushToken> findByUserIdInAndActiveTrue(List<Long> userIds);

    long countByUserIdAndActiveTrue(Long userId);
}
