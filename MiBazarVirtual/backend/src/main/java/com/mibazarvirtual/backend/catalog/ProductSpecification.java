// src/main/java/com/mibazarvirtual/backend/catalog/ProductSpecification.java
package com.mibazarvirtual.backend.catalog;

import com.mibazarvirtual.backend.entity.Product;
import java.math.BigDecimal;
import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecification {

    private ProductSpecification() {
    }

    public static Specification<Product> active() {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), Product.Status.ACTIVE);
    }

    public static Specification<Product> textSearch(String queryText) {
        return (root, query, criteriaBuilder) -> {
            if (queryText == null || queryText.isBlank()) {
                return criteriaBuilder.conjunction();
            }
            String pattern = "%" + queryText.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
            );
        };
    }

    public static Specification<Product> category(Long categoryId) {
        return (root, query, criteriaBuilder) -> categoryId == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> store(Long storeId) {
        return (root, query, criteriaBuilder) -> storeId == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("store").get("id"), storeId);
    }

    public static Specification<Product> minPrice(Double minPrice) {
        return (root, query, criteriaBuilder) -> minPrice == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.greaterThanOrEqualTo(root.get("price"), BigDecimal.valueOf(minPrice));
    }

    public static Specification<Product> maxPrice(Double maxPrice) {
        return (root, query, criteriaBuilder) -> maxPrice == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.lessThanOrEqualTo(root.get("price"), BigDecimal.valueOf(maxPrice));
    }

    public static Specification<Product> inStock(Boolean inStock) {
        return (root, query, criteriaBuilder) -> Boolean.TRUE.equals(inStock)
                ? criteriaBuilder.greaterThan(root.get("stock"), 0)
                : criteriaBuilder.conjunction();
    }
}
