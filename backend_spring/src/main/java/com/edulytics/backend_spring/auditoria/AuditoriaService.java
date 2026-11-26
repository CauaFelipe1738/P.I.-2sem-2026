package com.edulytics.backend_spring.auditoria;

import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final ObjectMapper objectMapper;

    public AuditoriaService(AuditoriaRepository auditoriaRepository, ObjectMapper objectMapper) {
        this.auditoriaRepository = auditoriaRepository;
        this.objectMapper = objectMapper;
    }

    public void registrar(String tabela, String operacao, Object anterior, Object novo) {
        Long usuarioId = resolveUsuarioId();
        registrarComUsuario(usuarioId, tabela, operacao, anterior, novo);
    }

    public void registrarComUsuario(Long usuarioId, String tabela, String operacao, Object anterior, Object novo) {
        auditoriaRepository.save(new Auditoria(
            usuarioId,
            tabela,
            operacao,
            serializeTruncated(anterior),
            serializeTruncated(novo),
            null
        ));
    }

    private Long resolveUsuarioId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser user) {
            return user.usuarioId();
        }
        return null;
    }

    private String serializeTruncated(Object value) {
        if (value == null) return null;
        try {
            String json = objectMapper.writeValueAsString(value);
            return json.length() > 3950 ? json.substring(0, 3950) : json;
        } catch (JsonProcessingException ex) {
            String fallback = String.valueOf(value);
            return fallback.length() > 3950 ? fallback.substring(0, 3950) : fallback;
        }
    }
}
