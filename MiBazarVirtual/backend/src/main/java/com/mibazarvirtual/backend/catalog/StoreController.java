package com.mibazarvirtual.backend.catalog;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<StoreDTO>> getStores() {
        return ResponseEntity.ok(storeService.getActiveStores());
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreDTO> getStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(storeService.getActiveStore(storeId));
    }

    @GetMapping("/{storeId}/products")
    public ResponseEntity<Page<ProductDTO>> getStoreProducts(
            @PathVariable Long storeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(productService.getProductsByStore(storeId, pageable));
    }
}
