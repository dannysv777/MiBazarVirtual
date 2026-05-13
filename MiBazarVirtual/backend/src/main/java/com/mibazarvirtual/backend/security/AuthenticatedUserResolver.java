// src/main/java/com/mibazarvirtual/backend/security/AuthenticatedUserResolver.java
package com.mibazarvirtual.backend.security;

import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticatedUserResolver {

    private final UserRepository userRepository;

    public Long currentUserId(Authentication authentication) {
        if (authentication == null) {
            authentication = SecurityContextHolder.getContext().getAuthentication();
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new MessageDeliveryException("Unauthorized");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.id();
        }
        if (principal instanceof User user) {
            return user.getId();
        }

        String name = authentication.getName();
        return userRepository.findByEmail(name)
                .or(() -> userRepository.findByUsername(name))
                .map(User::getId)
                .orElseThrow(() -> new MessageDeliveryException("Unauthorized"));
    }

    public User currentUser(Authentication authentication) {
        Long userId = currentUserId(authentication);
        return userRepository.findById(userId)
                .orElseThrow(() -> new MessageDeliveryException("Unauthorized"));
    }
}
