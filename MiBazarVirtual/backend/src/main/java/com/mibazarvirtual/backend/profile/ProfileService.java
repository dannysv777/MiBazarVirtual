// src/main/java/com/mibazarvirtual/backend/profile/ProfileService.java
package com.mibazarvirtual.backend.profile;

import com.mibazarvirtual.backend.profile.dto.ProfileResponse;
import com.mibazarvirtual.backend.profile.dto.UpdateProfileRequest;
import com.mibazarvirtual.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return userRepository.findById(userId)
                .map(ProfileResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        return userRepository.findById(userId)
                .map(user -> {
                    user.setFullName(request.fullName().trim());
                    user.setPhone(request.phone());
                    return ProfileResponse.from(user);
                })
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
    }
}
