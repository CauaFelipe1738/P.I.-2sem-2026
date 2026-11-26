package com.edulytics.backend_spring.common.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String detail) {
        super(detail);
    }
}
