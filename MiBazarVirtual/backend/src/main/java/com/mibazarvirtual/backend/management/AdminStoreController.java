// src/main/java/com/mibazarvirtual/backend/management/AdminStoreController.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import com.mibazarvirtual.backend.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stores")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStoreController {

    private final StoreManagementService storeManagementService;

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<StoreDTO>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(storeManagementService.approve(id), "Store approved"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<StoreDTO>> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(storeManagementService.deactivate(id), "Store deactivated"));
    }
}
