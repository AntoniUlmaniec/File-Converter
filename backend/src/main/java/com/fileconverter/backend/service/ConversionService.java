package com.fileconverter.backend.service;

import com.fileconverter.backend.exception.ValidationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ConversionService {

    private final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Kategoria 1: Obrazy
    private static final Set<String> IMAGE_MIMES = Set.of("image/jpeg", "image/png", "image/bmp");
    private static final Set<String> IMAGE_FORMATS = Set.of("jpg", "jpeg", "png", "bmp");

    // Kategoria 2: Wideo
    private static final Set<String> VIDEO_MIMES = Set.of("video/mp4", "video/x-msvideo", "video/quicktime", "video/x-flv");
    private static final Set<String> VIDEO_FORMATS = Set.of("mp4", "avi", "mov", "flv");

    // Kategoria 3: Audio
    private static final Set<String> AUDIO_MIMES = Set.of("audio/mpeg", "audio/wav", "audio/3gpp", "audio/midi", "audio/x-midi");
    private static final Set<String> AUDIO_FORMATS = Set.of("mp3", "wav", "3gp", "midi");

    // Suma wszystkich dozwolonych typów
    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>();
    static {
        ALLOWED_MIME_TYPES.addAll(IMAGE_MIMES);
        ALLOWED_MIME_TYPES.addAll(VIDEO_MIMES);
        ALLOWED_MIME_TYPES.addAll(AUDIO_MIMES);
    }
    // --- KONIEC KATEGORII ---


    public List<Path> processConversion(String targetFormat, MultipartFile[] files) {

        validateFiles(files, targetFormat);

        List<Path> convertedFilePaths = new ArrayList<>();

        for (MultipartFile fileToConvert : files) {
            Path tempInputFile = null;
            Path tempOutputFile = null;
            String originalName = fileToConvert.getOriginalFilename();
            String baseName = getBaseName(originalName);

            try {
                String inputSuffix = getExtension(originalName);
                tempInputFile = Files.createTempFile("converter_input_", inputSuffix);

                String outputFilename = baseName + "." + targetFormat;
                tempOutputFile = Files.createTempFile("converter_output_", outputFilename);

                fileToConvert.transferTo(tempInputFile.toFile());

                System.out.println("--- Konwertuję plik: " + originalName + " ---");

                ProcessBuilder processBuilder = new ProcessBuilder(
                        "ffmpeg",
                        "-y",
                        "-i",
                        tempInputFile.toAbsolutePath().toString(),
                        tempOutputFile.toAbsolutePath().toString()
                );

                processBuilder.inheritIO();

                Process process = processBuilder.start();
                int exitCode = process.waitFor();

                if (exitCode == 0) {
                    System.out.println("Sukces: " + tempOutputFile.toAbsolutePath());
                    convertedFilePaths.add(tempOutputFile);
                } else {
                    System.err.println("Błąd podczas konwersji pliku: " + originalName + " (Kod: " + exitCode + ")");
                }

            } catch (IOException | InterruptedException e) {
                System.err.println("Krytyczny błąd przy pliku " + originalName + ": " + e.getMessage());
            } finally {
                try {
                    if (tempInputFile != null) Files.deleteIfExists(tempInputFile);
                } catch (IOException e) {
                    System.err.println("Nie udało się usunąć pliku wejściowego: " + e.getMessage());
                }
            }
        }

        if (convertedFilePaths.isEmpty()) {
            throw new RuntimeException("Nie udało się skonwertować żadnego z plików.");
        }

        return convertedFilePaths;
    }

    private void validateFiles(MultipartFile[] files, String targetFormat) {
        if (files == null || files.length == 0) {
            throw new ValidationException("Nie wybrano żadnych plików.");
        }
        if (files.length > 5) {
            throw new ValidationException("Można wgrać maksymalnie 5 plików naraz.");
        }

        Category targetCategory = getCategoryForFormat(targetFormat);
        if (targetCategory == Category.UNKNOWN) {
            throw new ValidationException("Docelowy format '" + targetFormat + "' jest nieobsługiwany.");
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                throw new ValidationException("Jeden z plików jest pusty.");
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new ValidationException("Jeden z plików jest za duży! (Limit: 10MB)");
            }

            String mimeType = file.getContentType();
            if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
                throw new ValidationException("Format pliku (" + mimeType + ") jest nieobsługiwany!");
            }

            Category inputCategory = getCategoryForMime(mimeType);

            boolean isConversionAllowed = false;

            if (inputCategory == Category.IMAGE && targetCategory == Category.IMAGE) {
                isConversionAllowed = true;
            } else if (inputCategory == Category.AUDIO && targetCategory == Category.AUDIO) {
                isConversionAllowed = true;
            } else if (inputCategory == Category.VIDEO && (targetCategory == Category.VIDEO || targetCategory == Category.AUDIO)) {
                isConversionAllowed = true;
            }

            if (!isConversionAllowed) {
                throw new ValidationException("Konwersja z " + inputCategory + " do " + targetCategory + " jest niedozwolona.");
            }
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".tmp";
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) return ".tmp";
        return filename.substring(lastDot);
    }

    private String getBaseName(String filename) {
        if (filename == null) return "plik";
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) return filename;
        return filename.substring(0, lastDot);
    }

    private enum Category { IMAGE, VIDEO, AUDIO, UNKNOWN }

    private Category getCategoryForMime(String mimeType) {
        if (IMAGE_MIMES.contains(mimeType)) return Category.IMAGE;
        if (VIDEO_MIMES.contains(mimeType)) return Category.VIDEO;
        if (AUDIO_MIMES.contains(mimeType)) return Category.AUDIO;
        return Category.UNKNOWN;
    }

    private Category getCategoryForFormat(String format) {
        String cleanFormat = format.toLowerCase().replace(".", "");
        if (IMAGE_FORMATS.contains(cleanFormat)) return Category.IMAGE;
        if (VIDEO_FORMATS.contains(cleanFormat)) return Category.VIDEO;
        if (AUDIO_FORMATS.contains(cleanFormat)) return Category.AUDIO;
        return Category.UNKNOWN;
    }
}