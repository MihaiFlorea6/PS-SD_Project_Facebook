package org.example.Assigment1.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*")
public class ImageController {

    // Folderul unde se salveaza imaginile - configurat in application.properties
    // Daca nu e configurat, foloseste "uploads" in directorul curent
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * POST /api/images/upload
     * Incarca o imagine si returneaza URL-ul ei
     * Body: multipart/form-data cu campul "file"
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fisierul este gol"));
        }

        // Verifica extensia - acceptam doar imagini
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nume fisier invalid"));
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        if (!extension.matches("jpg|jpeg|png|gif|webp")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doar imagini sunt acceptate (jpg, jpeg, png, gif, webp)"));
        }

        try {
            // Creeaza folderul daca nu exista
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Genereaza un nume unic pentru fisier pentru a evita conflicte
            String uniqueFilename = UUID.randomUUID().toString() + "." + extension;
            Path filePath = uploadPath.resolve(uniqueFilename);

            // Salveaza fisierul
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Returneaza URL-ul imaginii
            String imageUrl = "/api/images/" + uniqueFilename;
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "url", imageUrl,
                    "filename", uniqueFilename,
                    "originalName", originalFilename
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Eroare la salvarea fisierului: " + e.getMessage()));
        }
    }

    /**
     * GET /api/images/{filename}
     * Serveste imaginea din folder
     */
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            // Detecteaza tipul continutului
            String contentType = "image/jpeg";
            if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".gif")) contentType = "image/gif";
            else if (filename.endsWith(".webp")) contentType = "image/webp";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}