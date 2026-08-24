package com.routine.exception;

/** Lỗi nghiệp vụ: hành động bị từ chối (HTTP 403) kèm thông điệp tiếng Việt. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
