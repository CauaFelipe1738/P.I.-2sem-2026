package com.edulytics.backend_spring.auditoria;

import com.edulytics.backend_spring.academico.AcademicoService;
import com.edulytics.backend_spring.common.dto.PageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
@PreAuthorize("hasRole('PROFESSOR')")
public class AuditoriaController {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaController(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @GetMapping
    public ResponseEntity<PageResponse<Auditoria>> listar(
        @RequestParam(required = false) String tabela,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        List<Auditoria> itens = (tabela != null && !tabela.isBlank())
            ? auditoriaRepository.findByTabelaModificadaOrderByDataHoraDesc(tabela.trim())
            : auditoriaRepository.findAll().stream()
                .sorted(Comparator.comparing(Auditoria::getDataHora).reversed())
                .toList();
        return ResponseEntity.ok(AcademicoService.paginateList(itens, page, size));
    }
}
