// src/main/java/com/mibazarvirtual/backend/app/AppInfoService.java
package com.mibazarvirtual.backend.app;

import com.mibazarvirtual.backend.app.dto.AppInfoResponse;
import com.mibazarvirtual.backend.entity.Product;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.repository.CategoryRepository;
import com.mibazarvirtual.backend.repository.ProductRepository;
import com.mibazarvirtual.backend.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppInfoService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;

    @Cacheable("appInfo")
    @Transactional(readOnly = true)
    public AppInfoResponse getInfo() {
        return new AppInfoResponse(
                "MiBazarVirtual",
                "1.0.0",
                productRepository.countByStatus(Product.Status.ACTIVE),
                storeRepository.countByStatus(Store.Status.ACTIVE),
                categoryRepository.countByActiveTrue()
        );
    }

    @CacheEvict(value = "appInfo", allEntries = true)
    @Scheduled(fixedRate = 300000)
    public void evictAppInfoCache() {
    }
}
