package com.routine.exception;

/**
 * Lỗi dữ liệu đầu vào / nghiệp vụ không hợp lệ (HTTP 400).
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
