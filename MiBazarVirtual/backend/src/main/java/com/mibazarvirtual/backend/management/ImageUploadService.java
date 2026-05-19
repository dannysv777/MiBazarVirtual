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
import org.springframework.util.StringUtils;
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
        if (!StringUtils.hasText(file.getContentType()) || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
        if (!StringUtils.hasText(cloudinary.config.cloudName)
                || !StringUtils.hasText(cloudinary.config.apiKey)
                || !StringUtils.hasText(cloudinary.config.apiSecret)) {
            throw new IllegalStateException("Cloudinary credentials are not configured");
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
