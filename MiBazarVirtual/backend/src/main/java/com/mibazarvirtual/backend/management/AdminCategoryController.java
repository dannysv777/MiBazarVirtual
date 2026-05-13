// src/main/java/com/mibazarvirtual/backend/management/AdminCategoryController.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.CategoryDTO;
import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.management.dto.CreateCategoryRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final CategoryManagementService categoryManagementService;

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> create(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(categoryManagementService.create(request), "Category created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(categoryManagementService.update(id, request), "Category updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryManagementService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Category deleted"));
    }
}
