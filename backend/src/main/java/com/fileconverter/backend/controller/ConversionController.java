package com.fileconverter.backend.controller;

import com.fileconverter.backend.exception.ValidationException;
import com.fileconverter.backend.service.ConversionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", exposedHeaders = HttpHeaders.CONTENT_DISPOSITION)
public class ConversionController {

    private final ConversionService conversionService;

    @Autowired
    public ConversionController(ConversionService conversionService) {
        this.conversionService = conversionService;
    }

    @PostMapping("/convert")
    public ResponseEntity<?> handleFileUpload(
            @RequestParam("targetFormat") String targetFormat,
            @RequestParam("files") MultipartFile[] files) {

        try {
            List<Path> convertedFilePaths = conversionService.processConversion(targetFormat, files);

            Path finalFileToSend;

            if (convertedFilePaths.size() == 1) {
                // JEŚLI 1 PLIK: bierzemy go bezpośrednio
                finalFileToSend = convertedFilePaths.get(0);
                System.out.println("Zwracam pojedynczy plik: " + finalFileToSend.getFileName());
            } else {
                // JEŚLI WIELE PLIKÓW: tworzymy ZIPa
                System.out.println("Tworzę ZIP dla " + convertedFilePaths.size() + " plików.");
                finalFileToSend = createZip(convertedFilePaths);
            }

            return buildFileResponse(finalFileToSend);

        } catch (ValidationException e) {
            // Obsługa błędu walidacji
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException | IOException e) {
            // Obsługa błędów konwersji lub ZIPa
            return ResponseEntity.internalServerError().body("Błąd serwera: " + e.getMessage());
        }
    }

    private Path createZip(List<Path> files) throws IOException {
        Path zipFile = Files.createTempFile("konwersja_", ".zip");

        try (ZipOutputStream zos = new ZipOutputStream(Files.newOutputStream(zipFile))) {
            for (Path file : files) {
                ZipEntry zipEntry = new ZipEntry(file.getFileName().toString());
                zos.putNextEntry(zipEntry);

                Files.copy(file, zos);
                zos.closeEntry();

                Files.delete(file);
            }
        }

        // Zwracamy ścieżkę do gotowego ZIPA
        return zipFile;
    }

    // Buduje odpowiedź HTTP 200 OK z plikiem do pobrania.
    private ResponseEntity<Resource> buildFileResponse(Path filePath) throws MalformedURLException {
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("Błąd: Nie można odczytać skonwertowanego pliku: " + filePath.getFileName());
        }

        // Ustawiamy nagłówek, który mówi przeglądarce: "to jest plik do pobrania"
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}