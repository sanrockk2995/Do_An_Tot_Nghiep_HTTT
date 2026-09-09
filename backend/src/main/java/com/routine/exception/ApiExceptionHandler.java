package com.routine.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Bắt lỗi tập trung cho toàn bộ REST API, trả JSON thống nhất.
 */
@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

    private Map<String, Object> body(HttpStatus status, String message) {
        Map<String, Object> map = new HashMap<>();
        map.put("timestamp", Instant.now().toString());
        map.put("status", status.value());
        map.put("error", status.getReasonPhrase());
        map.put("message", message);
        return map;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBad(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleCredentials(BadCredentialsException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Email hoặc mật khẩu không chính xác";
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(body(HttpStatus.UNAUTHORIZED, message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> res = body(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ");
        res.put("fieldErrors", fieldErrors);
        return ResponseEntity.badRequest().body(res);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(body(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện chức năng này"));
    }

    /** Lỗi bị từ chối do IP/điều kiện nghiệp vụ — trả đúng message cho FE hiển thị. */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(body(HttpStatus.FORBIDDEN, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "Tham số không hợp lệ: " + ex.getName()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Lỗi không xử lý được", ex);
        return ResponseEntity.internalServerError()
                .body(body(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau"));
    }
}
