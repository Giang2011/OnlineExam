package com.gr1.exam.module.paperexam.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.external.vision.dto.VisionQuestionResultDTO;
import com.gr1.exam.external.vision.dto.VisionQuestionScanStatus;
import com.gr1.exam.external.vision.dto.VisionRecognizedAnswerDTO;
import com.gr1.exam.external.vision.dto.VisionScanRequestDTO;
import com.gr1.exam.external.vision.dto.VisionScanResponseDTO;
import com.gr1.exam.external.vision.dto.VisionScanStatus;
import com.gr1.exam.external.vision.service.VisionScanFacadeService;
import com.gr1.exam.module.paperexam.dto.PaperExamScanQuestionResultDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamScanRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamScanResponseDTO;
import com.gr1.exam.module.paperexam.entity.PaperExam;
import com.gr1.exam.module.paperexam.entity.PaperExamQuestion;
import com.gr1.exam.module.paperexam.entity.PaperExamScanQuestionResult;
import com.gr1.exam.module.paperexam.entity.PaperExamScanResult;
import com.gr1.exam.module.paperexam.repository.PaperExamQuestionRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamScanQuestionResultRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamScanResultRepository;
import com.gr1.exam.module.question.entity.Answer;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaperExamScanService {

    private final PaperExamRepository paperExamRepository;
    private final PaperExamQuestionRepository paperExamQuestionRepository;
    private final PaperExamScanResultRepository paperExamScanResultRepository;
    private final PaperExamScanQuestionResultRepository paperExamScanQuestionResultRepository;
    private final VisionScanFacadeService visionScanFacadeService;
    private final ObjectMapper objectMapper;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Transactional
    public PaperExamScanResponseDTO scanPaperExam(Integer paperExamId, MultipartFile image, PaperExamScanRequestDTO request) {
        PaperExam paperExam = paperExamRepository.findById(paperExamId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + paperExamId));

        Integer actualQuestionCount = request.getActualQuestionCount() != null ? request.getActualQuestionCount() : paperExam.getTotalQuestions();
        validateScanInput(image, actualQuestionCount);

        String storedImagePath = storeUploadedImage(paperExamId, image);
        VisionScanRequestDTO visionRequest = VisionScanRequestDTO.builder()
                .paperExamId(paperExamId)
                .actualQuestionCount(actualQuestionCount)
                .formVariant(request.getFormVariant() == null ? 75 : request.getFormVariant())
                .debug(request.getDebug())
                .scanMode(request.getScanMode() == null ? "AUTO" : request.getScanMode())
                .image(image)
                .build();

        VisionScanResponseDTO visionResponse = visionScanFacadeService.scanPaperExam(visionRequest);
        List<PaperExamQuestion> questions = paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(paperExamId);
        List<PaperExamScanQuestionResultDTO> questionResults = buildQuestionResults(questions, visionResponse, actualQuestionCount);

        int totalCorrect = (int) questionResults.stream().filter(result -> result.getStatus() == VisionQuestionScanStatus.CORRECT).count();
        int totalWrong = (int) questionResults.stream().filter(result -> result.getStatus() == VisionQuestionScanStatus.WRONG).count();
        int totalEmpty = (int) questionResults.stream().filter(result -> result.getStatus() == VisionQuestionScanStatus.EMPTY).count();
        int totalNeedsReview = (int) questionResults.stream().filter(result -> result.getStatus() == VisionQuestionScanStatus.NEEDS_REVIEW).count();
        int totalMultiMarked = (int) questionResults.stream().filter(result -> result.getStatus() == VisionQuestionScanStatus.MULTI_MARKED).count();

        float score = actualQuestionCount <= 0 ? 0F : (float) totalCorrect / actualQuestionCount * paperExam.getTotalQuestions();

        PaperExamScanResult scanResult = PaperExamScanResult.builder()
                .paperExam(paperExam)
                .formVariant(request.getFormVariant() == null ? 75 : request.getFormVariant())
                .actualQuestionCount(actualQuestionCount)
                .totalQuestions(paperExam.getTotalQuestions())
                .score(score)
                .totalCorrect(totalCorrect)
                .totalWrong(totalWrong)
                .totalEmpty(totalEmpty)
                .totalNeedsReview(totalNeedsReview)
                .totalMultiMarked(totalMultiMarked)
                .status(visionResponse.getStatus() == null ? VisionScanStatus.FAILED_TO_READ : visionResponse.getStatus())
                .imagePath(storedImagePath)
                .rawVisionOutput(visionResponse.getRawOutput())
                .visionErrors(serializeErrors(visionResponse.getErrors()))
                .build();
        scanResult = paperExamScanResultRepository.save(scanResult);

        List<PaperExamScanQuestionResult> savedQuestionResults = new ArrayList<>();
        for (PaperExamScanQuestionResultDTO dto : questionResults) {
            PaperExamScanQuestionResult entity = PaperExamScanQuestionResult.builder()
                    .scanResult(scanResult)
                    .questionIndex(dto.getQuestionIndex())
                    .selectedOptions(dto.getSelectedOptions())
                    .correctOptions(dto.getCorrectOptions())
                    .status(dto.getStatus())
                    .isEmpty(dto.getIsEmpty())
                    .markedCount(dto.getMarkedCount())
                    .confidence(dto.getConfidence())
                    .note(dto.getNote())
                    .build();
            savedQuestionResults.add(entity);
        }
        paperExamScanQuestionResultRepository.saveAll(savedQuestionResults);

        return toResponseDTO(scanResult, questionResults, visionResponse.getRawOutput(), visionResponse.getErrors());
    }

    private void validateScanInput(MultipartFile image, Integer actualQuestionCount) {
        if (image == null || image.isEmpty()) {
            throw new BadRequestException("Ảnh scan không được để trống.");
        }
        if (actualQuestionCount == null || actualQuestionCount <= 0) {
            throw new BadRequestException("actualQuestionCount phải lớn hơn 0.");
        }
    }

    private String storeUploadedImage(Integer paperExamId, MultipartFile image) {
        try {
            Path uploadsRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path paperExamDir = uploadsRoot.resolve("paper-exams").resolve(String.valueOf(paperExamId));
            Files.createDirectories(paperExamDir);

            String originalName = image.getOriginalFilename() == null ? "scan" : image.getOriginalFilename();
            String extension = getExtension(originalName);
            String fileName = "scan-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS")) + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
            Path targetFile = paperExamDir.resolve(fileName);
            Files.copy(image.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            Path relative = Paths.get("uploads").resolve("paper-exams").resolve(String.valueOf(paperExamId)).resolve(fileName);
            return relative.toString().replace('\\', '/');
        } catch (IOException ex) {
            throw new BadRequestException("Không thể lưu ảnh scan.");
        }
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0) {
            return ".jpg";
        }
        String extension = filename.substring(dotIndex).trim();
        return extension.isBlank() ? ".jpg" : extension;
    }

    private String serializeErrors(List<String> errors) {
        if (errors == null || errors.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(errors);
        } catch (JsonProcessingException ex) {
            return String.join("; ", errors);
        }
    }

    private List<PaperExamScanQuestionResultDTO> buildQuestionResults(List<PaperExamQuestion> questions, VisionScanResponseDTO visionResponse, Integer actualQuestionCount) {
        Set<Integer> recognizedIndexes = new HashSet<>();
        List<PaperExamScanQuestionResultDTO> results = new ArrayList<>();
        List<VisionRecognizedAnswerDTO> recognizedAnswers = visionResponse.getRecognizedAnswers() == null ? List.of() : visionResponse.getRecognizedAnswers();

        for (PaperExamQuestion question : questions) {
            int questionIndex = question.getOrderIndex();
            if (questionIndex > actualQuestionCount) {
                results.add(buildIgnoredResult(questionIndex));
                continue;
            }

            VisionRecognizedAnswerDTO recognized = recognizedAnswers.stream()
                    .filter(item -> item.getQuestionIndex() != null && item.getQuestionIndex().equals(questionIndex))
                    .findFirst()
                    .orElse(VisionRecognizedAnswerDTO.builder()
                            .questionIndex(questionIndex)
                            .selectedOptions(List.of())
                            .isEmpty(Boolean.TRUE)
                            .markedCount(0)
                            .confidence(0D)
                            .build());
            recognizedIndexes.add(questionIndex);

            List<String> correctOptions = extractCorrectOptions(question);
            results.add(mapResult(questionIndex, recognized, correctOptions));
        }

        for (VisionRecognizedAnswerDTO recognized : recognizedAnswers) {
            if (recognized.getQuestionIndex() == null || recognizedIndexes.contains(recognized.getQuestionIndex())) {
                continue;
            }
            results.add(PaperExamScanQuestionResultDTO.builder()
                    .questionIndex(recognized.getQuestionIndex())
                    .selectedOptions(normalizeOptions(recognized.getSelectedOptions()))
                    .correctOptions(List.of())
                    .status(VisionQuestionScanStatus.IGNORED)
                    .isEmpty(Boolean.TRUE.equals(recognized.getIsEmpty()))
                    .markedCount(recognized.getMarkedCount())
                    .confidence(recognized.getConfidence())
                    .note("Câu không thuộc phạm vi chấm")
                    .build());
        }

        results.sort(Comparator.comparing(PaperExamScanQuestionResultDTO::getQuestionIndex));
        return results;
    }

    private PaperExamScanQuestionResultDTO buildIgnoredResult(int questionIndex) {
        return PaperExamScanQuestionResultDTO.builder()
                .questionIndex(questionIndex)
                .selectedOptions(List.of())
                .correctOptions(List.of())
                .status(VisionQuestionScanStatus.IGNORED)
                .isEmpty(Boolean.TRUE)
                .markedCount(0)
                .confidence(1D)
                .note("Câu nằm ngoài actualQuestionCount và được bỏ qua")
                .build();
    }

    private PaperExamScanQuestionResultDTO mapResult(Integer questionIndex, VisionRecognizedAnswerDTO recognized, List<String> correctOptions) {
        List<String> selectedOptions = normalizeOptions(recognized.getSelectedOptions());
        boolean isEmpty = Boolean.TRUE.equals(recognized.getIsEmpty()) || selectedOptions.isEmpty();
        boolean multiMarked = recognized.getMarkedCount() != null && recognized.getMarkedCount() > 1;
        boolean exactMatch = exactSetMatch(selectedOptions, correctOptions);

        VisionQuestionScanStatus status;
        String note = null;
        if (isEmpty) {
            status = VisionQuestionScanStatus.EMPTY;
        } else if (multiMarked && correctOptions.size() == 1) {
            status = VisionQuestionScanStatus.MULTI_MARKED;
            note = "Nhiều lựa chọn được tô trong khi câu chỉ có 1 đáp án đúng.";
        } else if (recognized.getConfidence() != null && recognized.getConfidence() < 0.5d) {
            status = VisionQuestionScanStatus.NEEDS_REVIEW;
            note = "Độ tin cậy thấp, cần kiểm tra lại.";
        } else if (exactMatch) {
            status = VisionQuestionScanStatus.CORRECT;
        } else {
            status = VisionQuestionScanStatus.WRONG;
        }

        return PaperExamScanQuestionResultDTO.builder()
                .questionIndex(questionIndex)
                .selectedOptions(selectedOptions)
                .correctOptions(correctOptions)
                .status(status)
                .isEmpty(isEmpty)
                .markedCount(recognized.getMarkedCount())
                .confidence(recognized.getConfidence())
                .note(note)
                .build();
    }

    private List<String> extractCorrectOptions(PaperExamQuestion question) {
        List<Answer> answers = question.getQuestion().getAnswers();
        if (answers == null) {
            return List.of();
        }

        List<String> correct = new ArrayList<>();
        for (int i = 0; i < answers.size(); i++) {
            Answer answer = answers.get(i);
            if (Boolean.TRUE.equals(answer.getIsCorrect())) {
                correct.add(String.valueOf((char) ('A' + i)));
            }
        }
        return correct;
    }

    private List<String> normalizeOptions(List<String> selectedOptions) {
        if (selectedOptions == null || selectedOptions.isEmpty()) {
            return List.of();
        }
        return selectedOptions.stream()
                .filter(option -> option != null && !option.isBlank())
                .map(this::normalizeOption)
                .filter(option -> !option.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    private String normalizeOption(String option) {
        String normalized = option.trim().toUpperCase(Locale.ROOT);
        normalized = normalized.replaceAll("^[^A-Z]+", "");
        normalized = normalized.replaceAll("[^A-Z]+$", "");
        if (normalized.length() == 1 && normalized.charAt(0) >= 'A' && normalized.charAt(0) <= 'Z') {
            return normalized;
        }
        return "";
    }

    @Transactional(readOnly = true)
    public PaperExamScanResponseDTO getPaperExamScanResult(Integer scanResultId) {
        PaperExamScanResult scanResult = paperExamScanResultRepository.findById(scanResultId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kết quả scan với id: " + scanResultId));

        List<PaperExamScanQuestionResultDTO> questionResults = toQuestionResultDTOs(scanResult.getQuestionResults());
        return toResponseDTO(scanResult, questionResults, scanResult.getRawVisionOutput(), deserializeErrors(scanResult.getVisionErrors()));
    }

    @Transactional(readOnly = true)
    public List<PaperExamScanResponseDTO> listPaperExamScanResults(Integer paperExamId) {
        return paperExamScanResultRepository.findByPaperExamIdOrderByCreatedAtDesc(paperExamId).stream()
                .map(scanResult -> toResponseDTO(scanResult, toQuestionResultDTOs(scanResult.getQuestionResults()), scanResult.getRawVisionOutput(), deserializeErrors(scanResult.getVisionErrors())))
                .toList();
    }

    private PaperExamScanResponseDTO toResponseDTO(PaperExamScanResult scanResult, List<PaperExamScanQuestionResultDTO> questionResults, String rawVisionOutput, List<String> errors) {
        return PaperExamScanResponseDTO.builder()
                .id(scanResult.getId())
                .status(scanResult.getStatus())
                .paperExamId(scanResult.getPaperExamId())
                .formVariant(scanResult.getFormVariant())
                .actualQuestionCount(scanResult.getActualQuestionCount())
                .totalQuestions(scanResult.getTotalQuestions())
                .score(scanResult.getScore())
                .totalCorrect(scanResult.getTotalCorrect())
                .totalWrong(scanResult.getTotalWrong())
                .totalEmpty(scanResult.getTotalEmpty())
                .totalNeedsReview(scanResult.getTotalNeedsReview())
                .totalMultiMarked(scanResult.getTotalMultiMarked())
                .imagePath(scanResult.getImagePath())
                .createdAt(scanResult.getCreatedAt())
                .updatedAt(scanResult.getUpdatedAt())
                .questionResults(questionResults)
                .rawVisionOutput(rawVisionOutput)
                .errors(errors)
                .build();
    }

    private List<PaperExamScanQuestionResultDTO> toQuestionResultDTOs(List<PaperExamScanQuestionResult> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        return entities.stream()
                .map(item -> PaperExamScanQuestionResultDTO.builder()
                        .questionIndex(item.getQuestionIndex())
                        .selectedOptions(item.getSelectedOptions())
                        .correctOptions(item.getCorrectOptions())
                        .status(item.getStatus())
                        .isEmpty(item.getIsEmpty())
                        .markedCount(item.getMarkedCount())
                        .confidence(item.getConfidence())
                        .note(item.getNote())
                        .build())
                .sorted(Comparator.comparing(PaperExamScanQuestionResultDTO::getQuestionIndex))
                .toList();
    }

    private List<String> deserializeErrors(String errors) {
        if (errors == null || errors.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(errors, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException ex) {
            String[] split = errors.split(";\\s*");
            List<String> fallback = new ArrayList<>();
            for (String item : split) {
                if (item != null && !item.isBlank()) {
                    fallback.add(item.trim());
                }
            }
            return fallback;
        }
    }

    private boolean exactSetMatch(List<String> selected, List<String> correct) {
        return new HashSet<>(normalizeOptions(selected)).equals(new HashSet<>(normalizeOptions(correct)));
    }
}
