// src/main/java/com/mibazarvirtual/backend/repository/UserRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);
}
