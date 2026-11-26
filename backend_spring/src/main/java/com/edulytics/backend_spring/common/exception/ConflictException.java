package com.edulytics.backend_spring.common.exception;

public class ConflictException extends RuntimeException {
    public ConflictException(String detail) {
        super(detail);
    }
}
