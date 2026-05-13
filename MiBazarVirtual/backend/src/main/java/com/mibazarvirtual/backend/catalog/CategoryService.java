package com.mibazarvirtual.backend.catalog;

import com.mibazarvirtual.backend.catalog.dto.CategoryDTO;
import com.mibazarvirtual.backend.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .map(CategoryDTO::from)
                .toList();
    }
}
