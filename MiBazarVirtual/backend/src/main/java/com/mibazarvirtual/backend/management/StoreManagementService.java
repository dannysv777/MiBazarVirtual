// src/main/java/com/mibazarvirtual/backend/management/StoreManagementService.java
package com.mibazarvirtual.backend.management;

import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.exception.DuplicateStoreException;
import com.mibazarvirtual.backend.exception.StoreNotFoundException;
import com.mibazarvirtual.backend.exception.UnauthorizedOwnerException;
import com.mibazarvirtual.backend.management.dto.CreateStoreRequest;
import com.mibazarvirtual.backend.management.dto.UpdateStoreRequest;
import com.mibazarvirtual.backend.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StoreManagementService {

    private final StoreRepository storeRepository;

    @Transactional
    public StoreDTO create(User seller, CreateStoreRequest request) {
        if (seller.getRole() != User.Role.SELLER) {
            throw new AccessDeniedException("Only sellers can create stores");
        }
        if (storeRepository.existsByUserId(seller.getId())) {
            throw new DuplicateStoreException(seller.getId());
        }

        Store store = new Store();
        store.setUser(seller);
        store.setStatus(Store.Status.PENDING);
        applyCreate(store, request);
        Store saved = storeRepository.save(store);
        log.info("Created store {} for seller {}", saved.getId(), seller.getId());
        return StoreDTO.from(saved);
    }

    @Transactional
    public StoreDTO updateOwn(Long storeId, Long sellerId, UpdateStoreRequest request) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException(storeId));
        validateOwner(store, sellerId);
        applyUpdate(store, request);
        return StoreDTO.from(store);
    }

    @Transactional
    public StoreDTO approve(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException(storeId));
        store.setStatus(Store.Status.ACTIVE);
        log.info("Approved store {}", storeId);
        return StoreDTO.from(store);
    }

    @Transactional
    public StoreDTO deactivate(Long storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException(storeId));
        store.setStatus(Store.Status.SUSPENDED);
        log.info("Suspended store {}", storeId);
        return StoreDTO.from(store);
    }

    @Transactional(readOnly = true)
    public StoreDTO getMine(Long sellerId) {
        return storeRepository.findByUserId(sellerId)
                .map(StoreDTO::from)
                .orElseThrow(() -> new StoreNotFoundException(sellerId));
    }

    private void applyCreate(Store store, CreateStoreRequest request) {
        store.setName(request.name().trim());
        store.setDescription(request.description());
        store.setAddress(request.address());
        store.setCity(request.city());
        store.setPhone(request.phone());
        store.setSchedule(request.schedule());
        store.setLogoUrl(request.logoUrl());
        store.setBannerUrl(request.bannerUrl());
        store.setLatitude(request.latitude());
        store.setLongitude(request.longitude());
    }

    private void applyUpdate(Store store, UpdateStoreRequest request) {
        if (request.name() != null) store.setName(request.name().trim());
        if (request.description() != null) store.setDescription(request.description());
        if (request.address() != null) store.setAddress(request.address());
        if (request.city() != null) store.setCity(request.city());
        if (request.phone() != null) store.setPhone(request.phone());
        if (request.schedule() != null) store.setSchedule(request.schedule());
        if (request.logoUrl() != null) store.setLogoUrl(request.logoUrl());
        if (request.bannerUrl() != null) store.setBannerUrl(request.bannerUrl());
        if (request.latitude() != null) store.setLatitude(request.latitude());
        if (request.longitude() != null) store.setLongitude(request.longitude());
    }

    private void validateOwner(Store store, Long sellerId) {
        if (!store.getUser().getId().equals(sellerId)) {
            throw new UnauthorizedOwnerException("Seller does not own this store");
        }
    }
}
