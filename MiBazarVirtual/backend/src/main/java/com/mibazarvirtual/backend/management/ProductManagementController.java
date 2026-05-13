// src/main/java/com/mibazarvirtual/backend/management/ProductManagementController.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.management.dto.CreateProductRequest;
import com.mibazarvirtual.backend.management.dto.UpdateProductRequest;
import com.mibazarvirtual.backend.management.dto.UpdateStockRequest;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class ProductManagementController {

    private final ProductManagementService productManagementService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDTO>> create(
            @Valid @RequestBody CreateProductRequest request,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(productManagementService.create(sellerId, request), "Product created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(productManagementService.update(id, sellerId, request), "Product updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> delete(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(productManagementService.softDelete(id, sellerId), "Product deleted"));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ApiResponse<ProductDTO>> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStockRequest request,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(
                productManagementService.updateStock(id, sellerId, request.quantity()),
                "Stock updated"
        ));
    }

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> mine(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(productManagementService.mine(sellerId, pageable), "Seller products"));
    }
}
