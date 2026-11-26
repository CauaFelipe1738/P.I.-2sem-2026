package com.edulytics.backend_spring.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        ProblemDetail pd = build(
            HttpStatus.BAD_REQUEST,
            "https://edulytics.api/errors/validation",
            "Dados inválidos",
            "Um ou mais campos falharam na validação.",
            req
        );
        pd.setProperty("errors", errors);
        return pd;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return build(
            HttpStatus.BAD_REQUEST,
            "https://edulytics.api/errors/malformed-json",
            "Corpo inválido",
            "Não foi possível interpretar o JSON enviado.",
            req
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex, HttpServletRequest req) {
        return build(
            HttpStatus.UNAUTHORIZED,
            "https://edulytics.api/errors/unauthorized",
            "Não autenticado",
            "Credenciais inválidas ou token ausente.",
            req
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(
            HttpStatus.FORBIDDEN,
            "https://edulytics.api/errors/forbidden",
            "Acesso negado",
            "Você não possui permissão para acessar este recurso.",
            req
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return build(
            HttpStatus.NOT_FOUND,
            "https://edulytics.api/errors/not-found",
            "Recurso não encontrado",
            ex.getMessage(),
            req
        );
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex, HttpServletRequest req) {
        return build(
            HttpStatus.CONFLICT,
            "https://edulytics.api/errors/conflict",
            "Conflito de registro",
            ex.getMessage(),
            req
        );
    }

    @ExceptionHandler(DomainRuleException.class)
    public ProblemDetail handleDomainRule(DomainRuleException ex, HttpServletRequest req) {
        return build(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "https://edulytics.api/errors/domain-rule",
            ex.getTitle(),
            ex.getMessage(),
            req
        );
    }

    private ProblemDetail build(HttpStatus status, String type, String title, String detail, HttpServletRequest req) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setType(URI.create(type));
        pd.setTitle(title);
        pd.setInstance(URI.create(req.getRequestURI()));
        pd.setProperty("timestamp", Instant.now().toString());
        return pd;
    }
}
