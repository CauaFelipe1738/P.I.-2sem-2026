package com.edulytics.backend_spring.aulas;

import com.edulytics.backend_spring.aulas.dto.AulaDTOs.*;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AulaController {

    private final AulaService aulaService;

    public AulaController(AulaService aulaService) {
        this.aulaService = aulaService;
    }

    @GetMapping("/aulas")
    public ResponseEntity<PageResponse<AulaDTO>> listar(
        @RequestParam(required = false) Long disciplinaTurmaId,
        @RequestParam(required = false) Long professorId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String periodo,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(aulaService.listarAulas(disciplinaTurmaId, professorId, status, periodo, page, size));
    }

    @PostMapping("/aulas")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AulaDTO> criar(
        @Valid @RequestBody AulaRequest req,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(aulaService.criarAula(req, user));
    }

    @PutMapping("/aulas/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AulaDTO> atualizar(@PathVariable Long id, @RequestBody AulaUpdateRequest req) {
        return ResponseEntity.ok(aulaService.atualizarAula(id, req));
    }

    @PatchMapping("/aulas/{id}/realizar")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AulaDTO> realizar(
        @PathVariable Long id,
        @RequestBody(required = false) AulaRealizarRequest req
    ) {
        return ResponseEntity.ok(aulaService.realizarAula(id, req != null ? req.conteudo() : null));
    }

    @PatchMapping("/aulas/{id}/cancelar")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AulaDTO> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(aulaService.cancelarAula(id));
    }

    @GetMapping("/aulas/{id}/frequencias")
    public ResponseEntity<List<FrequenciaItemDTO>> listarFrequencias(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ResponseEntity.ok(aulaService.listarFrequencias(id, user));
    }

    @PostMapping("/aulas/{id}/frequencias")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<List<FrequenciaItemDTO>> salvarLote(
        @PathVariable Long id,
        @RequestBody FrequenciaLoteRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(aulaService.salvarFrequenciasEmLote(id, req));
    }

    @PutMapping("/frequencias/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<FrequenciaItemDTO> atualizarFrequencia(
        @PathVariable Long id,
        @RequestBody FrequenciaUpdateRequest req
    ) {
        return ResponseEntity.ok(aulaService.atualizarFrequencia(id, req));
    }
}
