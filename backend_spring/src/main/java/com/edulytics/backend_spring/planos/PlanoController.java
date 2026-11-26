package com.edulytics.backend_spring.planos;

import com.edulytics.backend_spring.planos.dto.PlanoDTOs.*;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/planos-acompanhamento")
@PreAuthorize("hasRole('PROFESSOR')")
public class PlanoController {

    private final PlanoService planoService;

    public PlanoController(PlanoService planoService) {
        this.planoService = planoService;
    }

    @GetMapping
    public ResponseEntity<List<PlanoDTO>> listar(
        @RequestParam(required = false) Long alunoId,
        @RequestParam(required = false) Long disciplinaTurmaId
    ) {
        return ResponseEntity.ok(planoService.listar(alunoId, disciplinaTurmaId));
    }

    @PostMapping
    public ResponseEntity<PlanoDTO> criar(
        @Valid @RequestBody PlanoRequest req,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planoService.criar(req, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanoDTO> atualizar(@PathVariable Long id, @RequestBody PlanoUpdateRequest req) {
        return ResponseEntity.ok(planoService.atualizar(id, req));
    }
}
