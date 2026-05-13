package com.mibazarvirtual.backend.catalog.dto;

import com.mibazarvirtual.backend.entity.Category;

public record CategoryDTO(
        Long id,
        Long parentId,
        String name,
        String slug,
        String iconUrl,
        int sortOrder
) {
    public static CategoryDTO from(Category category) {
        return new CategoryDTO(
                category.getId(),
                category.getParent() == null ? null : category.getParent().getId(),
                category.getName(),
                category.getSlug(),
                category.getIconUrl(),
                category.getSortOrder()
        );
    }
}
