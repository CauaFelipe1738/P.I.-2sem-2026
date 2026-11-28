package com.edulytics.backend_spring.avaliacoes;

import com.edulytics.backend_spring.avaliacoes.dto.AvaliacaoDTOs.*;
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
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    public AvaliacaoController(AvaliacaoService avaliacaoService) {
        this.avaliacaoService = avaliacaoService;
    }

    @GetMapping("/avaliacoes")
    public ResponseEntity<PageResponse<AvaliacaoDTO>> listar(
        @RequestParam(required = false) Long disciplinaTurmaId,
        @RequestParam(required = false) Long professorId,
        @RequestParam(required = false) Long periodoId,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(avaliacaoService.listar(disciplinaTurmaId, professorId, periodoId, status, page, size));
    }

    @PostMapping("/avaliacoes")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AvaliacaoDTO> criar(
        @Valid @RequestBody AvaliacaoRequest req,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacaoService.criar(req, user));
    }

    @PutMapping("/avaliacoes/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AvaliacaoDTO> atualizar(@PathVariable Long id, @RequestBody AvaliacaoUpdateRequest req) {
        return ResponseEntity.ok(avaliacaoService.atualizar(id, req));
    }

    @DeleteMapping("/avaliacoes/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        avaliacaoService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/avaliacoes/{id}/corrigir")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AvaliacaoDTO> corrigir(@PathVariable Long id) {
        return ResponseEntity.ok(avaliacaoService.corrigir(id));
    }

    @GetMapping("/avaliacoes/{id}/notas")
    public ResponseEntity<List<AlunoAvaliacaoDTO>> listarNotas(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ResponseEntity.ok(avaliacaoService.listarNotas(id, user));
    }

    @PutMapping("/avaliacoes/{id}/notas/{alunoId}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AlunoAvaliacaoDTO> lancarNota(
        @PathVariable Long id,
        @PathVariable Long alunoId,
        @Valid @RequestBody NotaRequest req
    ) {
        return ResponseEntity.ok(avaliacaoService.lancarNota(id, alunoId, req));
    }
}
