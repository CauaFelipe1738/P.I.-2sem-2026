package com.edulytics.backend_spring.common.exception;

public class DomainRuleException extends RuntimeException {
    private final String title;

    public DomainRuleException(String detail) {
        this("Regra de negócio violada", detail);
    }

    public DomainRuleException(String title, String detail) {
        super(detail);
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
