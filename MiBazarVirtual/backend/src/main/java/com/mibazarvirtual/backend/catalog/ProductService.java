package com.mibazarvirtual.backend.catalog;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProducts(String query, Long categoryId, Pageable pageable) {
        return getProducts(query, categoryId, null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProducts(
            String query,
            Long categoryId,
            Long storeId,
            Double minPrice,
            Double maxPrice,
            Boolean inStock,
            Pageable pageable
    ) {
        Specification<Product> specification = ProductSpecification.active()
                .and(ProductSpecification.textSearch(query))
                .and(ProductSpecification.category(categoryId))
                .and(ProductSpecification.store(storeId))
                .and(ProductSpecification.minPrice(minPrice))
                .and(ProductSpecification.maxPrice(maxPrice))
                .and(ProductSpecification.inStock(inStock));
        return productRepository.findAll(specification, pageable).map(ProductDTO::from);
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
