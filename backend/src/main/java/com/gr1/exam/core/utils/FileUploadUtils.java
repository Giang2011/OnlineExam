package com.gr1.exam.core.utils;

import com.gr1.exam.core.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Tiện ích xử lý upload file ảnh.
 * Lưu file vào thư mục uploads/ và trả về đường dẫn tương đối.
 */
@Component
public class FileUploadUtils {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    /**
     * Upload file ảnh vào thư mục con (subfolder) bên trong uploads/.
     *
     * @param file      MultipartFile từ request
     * @param subfolder Thư mục con (VD: "questions", "answers")
     * @return Đường dẫn tương đối: VD "/uploads/questions/abc123.png"
     */
    public String uploadImage(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPEG, PNG, GIF, WebP, SVG.");
        }

        // Tạo tên file unique bằng UUID
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String newFilename = UUID.randomUUID().toString() + extension;

        // Tạo thư mục nếu chưa có
        Path targetDir = Paths.get(uploadDir, subfolder);
        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            throw new BadRequestException("Không thể tạo thư mục upload: " + e.getMessage());
        }

        // Lưu file
        Path targetPath = targetDir.resolve(newFilename);
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Lỗi khi lưu file: " + e.getMessage());
        }

        // Trả về đường dẫn tương đối (dùng để truy cập qua /uploads/**)
        return "/uploads/" + subfolder + "/" + newFilename;
    }

    /**
     * Xóa file ảnh khi không còn cần thiết (VD: khi cập nhật ảnh mới).
     *
     * @param imageUrl Đường dẫn tương đối: VD "/uploads/questions/abc123.png"
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        // Chuyển từ "/uploads/questions/abc.png" → "uploads/questions/abc.png"
        String relativePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
        Path filePath = Paths.get(relativePath);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log warning nhưng không throw exception — xóa file thất bại không gây lỗi nghiệp vụ
        }
    }
}
