package com.edulytics.backend_spring.comentarios;

import com.edulytics.backend_spring.comentarios.dto.ComentarioDTOs.*;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;

    public ComentarioController(ComentarioService comentarioService) {
        this.comentarioService = comentarioService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ComentarioDTO>> listar(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Long alunoId,
        @RequestParam(required = false) Long professorId,
        @RequestParam(required = false) Long disciplinaTurmaId,
        @RequestParam(required = false) String tipo,
        @RequestParam(required = false) String classificacao,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(comentarioService.listar(user, alunoId, professorId, disciplinaTurmaId, tipo, classificacao, page, size));
    }

    @PostMapping
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<ComentarioDTO> criar(
        @Valid @RequestBody ComentarioRequest req,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comentarioService.criar(req, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<ComentarioDTO> atualizar(@PathVariable Long id, @RequestBody ComentarioUpdateRequest req) {
        return ResponseEntity.ok(comentarioService.atualizar(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        comentarioService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
