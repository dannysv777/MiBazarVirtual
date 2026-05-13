package com.mibazarvirtual.backend.catalog;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProducts(String query, Long categoryId, Pageable pageable) {
        Page<Product> products;
        if (query != null && !query.isBlank()) {
            products = productRepository.searchActiveProducts(query.trim(), Product.Status.ACTIVE, pageable);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryIdAndStatus(categoryId, Product.Status.ACTIVE, pageable);
        } else {
            products = productRepository.findByStatus(Product.Status.ACTIVE, pageable);
        }
        return products.map(ProductDTO::from);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProduct(Long productId) {
        return productRepository.findByIdAndStatus(productId, Product.Status.ACTIVE)
                .map(ProductDTO::from)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + productId));
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByStore(Long storeId, Pageable pageable) {
        return productRepository.findByStoreIdAndStatus(storeId, Product.Status.ACTIVE, pageable)
                .map(ProductDTO::from);
    }
}
