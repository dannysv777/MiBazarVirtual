package com.mibazarvirtual.backend.catalog;

import com.mibazarvirtual.backend.catalog.dto.StoreDTO;
import com.mibazarvirtual.backend.entity.Store;
import com.mibazarvirtual.backend.repository.StoreRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    @Transactional(readOnly = true)
    public List<StoreDTO> getActiveStores() {
        return storeRepository.findByStatusOrderByRatingAvgDescNameAsc(Store.Status.ACTIVE).stream()
                .map(StoreDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoreDTO getActiveStore(Long storeId) {
        return storeRepository.findByIdAndStatus(storeId, Store.Status.ACTIVE)
                .map(StoreDTO::from)
                .orElseThrow(() -> new EntityNotFoundException("Store not found: " + storeId));
    }
}
