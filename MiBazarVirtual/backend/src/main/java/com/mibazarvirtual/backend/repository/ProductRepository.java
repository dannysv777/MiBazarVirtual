// src/main/java/com/mibazarvirtual/backend/repository/ProductRepository.java
package com.mibazarvirtual.backend.repository;

import com.mibazarvirtual.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
