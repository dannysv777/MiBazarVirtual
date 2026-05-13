// src/main/java/com/mibazarvirtual/backend/management/CategoryManagementService.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.CategoryDTO;
import com.mibazarvirtual.backend.entity.Category;
import com.mibazarvirtual.backend.exception.CategoryNotFoundException;
import com.mibazarvirtual.backend.management.dto.CreateCategoryRequest;
import com.mibazarvirtual.backend.repository.CategoryRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryManagementService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CategoryDTO create(CreateCategoryRequest request) {
        Category category = new Category();
        category.setName(request.name().trim());
        category.setDescription(request.description());
        category.setIconUrl(request.icon());
        category.setSlug(toSlug(request.name()));
        category.setActive(true);
        Category saved = categoryRepository.save(category);
        log.info("Created category {}", saved.getId());
        return CategoryDTO.from(saved);
    }

    @Transactional
    public CategoryDTO update(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        category.setName(request.name().trim());
        category.setDescription(request.description());
        category.setIconUrl(request.icon());
        category.setSlug(toSlug(request.name()));
        return CategoryDTO.from(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        if (productRepository.existsByCategoryId(id)) {
            throw new DataIntegrityViolationException("Category has linked products and cannot be deleted");
        }
        categoryRepository.delete(category);
        log.info("Deleted category {}", id);
    }

    private String toSlug(String value) {
        return value.toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
