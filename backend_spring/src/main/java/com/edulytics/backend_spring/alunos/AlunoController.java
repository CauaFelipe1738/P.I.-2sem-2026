package com.edulytics.backend_spring.alunos;

import com.edulytics.backend_spring.alunos.dto.AlunoResponseDTO;
import com.edulytics.backend_spring.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alunos")
public class AlunoController {

    private final AlunoService alunoService;

    public AlunoController(AlunoService alunoService) {
        this.alunoService = alunoService;
    }

    @GetMapping
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<PageResponse<AlunoResponseDTO>> findAll(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Long turmaId,
        @RequestParam(required = false) Long cursoId,
        @PageableDefault(size = 20, sort = "nomeCompleto") Pageable pageable
    ) {
        return ResponseEntity.ok(alunoService.listarFiltrado(q, turmaId, cursoId, pageable));
    }
}
