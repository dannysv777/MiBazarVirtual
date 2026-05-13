// src/main/java/com/mibazarvirtual/backend/management/StoreManagementController.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.management.dto.CreateStoreRequest;
import com.mibazarvirtual.backend.management.dto.UpdateStoreRequest;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreManagementController {

    private final StoreManagementService storeManagementService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<StoreDTO>> create(
            @Valid @RequestBody CreateStoreRequest request,
            Authentication authentication
    ) {
        User seller = authenticatedUserResolver.currentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(storeManagementService.create(seller, request), "Store created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<StoreDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStoreRequest request,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(storeManagementService.updateOwn(id, sellerId, request), "Store updated"));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<StoreDTO>> mine(Authentication authentication) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(storeManagementService.getMine(sellerId), "Seller store"));
    }
}
