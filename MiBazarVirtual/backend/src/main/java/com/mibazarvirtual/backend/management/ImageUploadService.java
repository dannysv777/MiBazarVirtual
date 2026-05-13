// src/main/java/com/mibazarvirtual/backend/management/ImageUploadService.java
package com.mibazarvirtual.backend.management;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mibazarvirtual.backend.management.dto.ImageUploadResponse;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageUploadService {

    private final Cloudinary cloudinary;

    public ImageUploadResponse upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "mibazarvirtual")
            );
            String url = String.valueOf(result.get("secure_url"));
            log.info("Uploaded image to Cloudinary");
            return new ImageUploadResponse(url);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not upload image", exception);
        }
    }
}
