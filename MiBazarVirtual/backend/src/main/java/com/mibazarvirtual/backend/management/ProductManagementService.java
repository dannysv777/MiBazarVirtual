// src/main/java/com/mibazarvirtual/backend/management/ProductManagementService.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.ProductDTO;
import com.mibazarvirtual.backend.entity.Category;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.exception.CategoryNotFoundException;
import com.mibazarvirtual.backend.exception.ProductNotFoundException;
import com.mibazarvirtual.backend.exception.StoreNotFoundException;
import com.mibazarvirtual.backend.exception.UnauthorizedOwnerException;
import com.mibazarvirtual.backend.management.dto.CreateProductRequest;
import com.mibazarvirtual.backend.management.dto.UpdateProductRequest;
import com.mibazarvirtual.backend.repository.CategoryRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductManagementService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductDTO create(Long sellerId, CreateProductRequest request) {
        Store store = storeRepository.findByUserId(sellerId)
                .orElseThrow(() -> new StoreNotFoundException(sellerId));
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new CategoryNotFoundException(request.categoryId()));

        Product product = new Product();
        product.setStore(store);
        product.setCategory(category);
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setUnit(request.unit());
        product.setCoverImage(request.imageUrl());
        product.setStatus(request.stock() == 0 ? Product.Status.OUT_OF_STOCK : Product.Status.ACTIVE);

        Product saved = productRepository.save(product);
        log.info("Created product {} for seller {}", saved.getId(), sellerId);
        return ProductDTO.from(saved);
    }

    @Transactional
    public ProductDTO update(Long productId, Long sellerId, UpdateProductRequest request) {
        Product product = getOwnedProduct(productId, sellerId);
        if (request.name() != null) product.setName(request.name().trim());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.stock() != null) {
            product.setStock(request.stock());
            product.setStatus(request.stock() == 0 ? Product.Status.OUT_OF_STOCK : Product.Status.ACTIVE);
        }
        if (request.unit() != null) product.setUnit(request.unit());
        if (request.imageUrl() != null) product.setCoverImage(request.imageUrl());
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(request.categoryId()));
            product.setCategory(category);
        }
        return ProductDTO.from(product);
    }

    @Transactional
    public ProductDTO softDelete(Long productId, Long sellerId) {
        Product product = getOwnedProduct(productId, sellerId);
        product.setStatus(Product.Status.DELETED);
        log.info("Soft deleted product {}", productId);
        return ProductDTO.from(product);
    }

    @Transactional
    public ProductDTO updateStock(Long productId, Long sellerId, Integer quantity) {
        Product product = getOwnedProduct(productId, sellerId);
        product.setStock(quantity);
        if (product.getStatus() != Product.Status.DELETED) {
            product.setStatus(quantity == 0 ? Product.Status.OUT_OF_STOCK : Product.Status.ACTIVE);
        }
        return ProductDTO.from(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> mine(Long sellerId, Pageable pageable) {
        return productRepository.findSellerProducts(sellerId, Product.Status.DELETED, pageable)
                .map(ProductDTO::from);
    }

    private Product getOwnedProduct(Long productId, Long sellerId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        if (!product.getStore().getUser().getId().equals(sellerId)) {
            throw new UnauthorizedOwnerException("Seller does not own this product");
        }
        return product;
    }
}
