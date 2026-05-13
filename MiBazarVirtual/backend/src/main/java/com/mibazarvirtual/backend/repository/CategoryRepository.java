package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderBySortOrderAscNameAsc();
}
