package com.fileconverter.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
// WAŻNE: To pozwala Reactowi (z portu 5173) gadać z Javą (na 8080)
@CrossOrigin(origins = "http://localhost:5173")
public class ConversionController {

    // To jest twój endpoint API
    @PostMapping("/convert")
    public ResponseEntity<String> handleFileUpload(
            @RequestParam("targetFormat") String targetFormat,
            @RequestParam("files") MultipartFile[] files) {

        System.out.println("--- NOWE ŻĄDANIE ---");
        System.out.println("Wybrany format: " + targetFormat);
        System.out.println("Ilość plików: " + files.length);
        System.out.println("Nazwa pierwszego pliku: " + files[0].getOriginalFilename());
        System.out.println("---------------------");

        // TODO: Tutaj w przyszłości dodasz logikę konwersji

        // Na razie zwracamy prosty tekst
        return ResponseEntity.ok("Pliki otrzymane! Zobacz konsolę w backendzie.");
    }
}
