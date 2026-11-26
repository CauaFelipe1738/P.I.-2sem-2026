package com.edulytics.backend_spring.academico;

import com.edulytics.backend_spring.academico.dto.AcademicoDTOs.*;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AcademicoController {

    private final AcademicoService academicoService;

    public AcademicoController(AcademicoService academicoService) {
        this.academicoService = academicoService;
    }

    @GetMapping("/cursos")
    public ResponseEntity<PageResponse<CursoResumoDTO>> listarCursos(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Boolean somenteMeus,
        @RequestParam(required = false) String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(academicoService.listarCursos(user, status, q, somenteMeus, sort, page, size));
    }

    @GetMapping("/periodos")
    public ResponseEntity<List<PeriodoDTO>> listarPeriodos() {
        return ResponseEntity.ok(academicoService.listarPeriodos());
    }

    @GetMapping("/cursos/{cursoId}/turmas")
    public ResponseEntity<List<TurmaDTO>> listarTurmas(
        @PathVariable Long cursoId,
        @RequestParam(required = false) Long periodoId
    ) {
        return ResponseEntity.ok(academicoService.listarTurmasPorCurso(cursoId, periodoId));
    }

    @GetMapping("/turmas/{turmaId}/disciplinas")
    public ResponseEntity<List<DisciplinaTurmaDTO>> listarDisciplinas(@PathVariable Long turmaId) {
        return ResponseEntity.ok(academicoService.listarDisciplinasPorTurma(turmaId));
    }

    @GetMapping("/turmas/{turmaId}/alunos")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<List<AlunoTurmaDTO>> listarAlunosDaTurma(
        @PathVariable Long turmaId,
        @RequestParam(defaultValue = "ATIVA") String status
    ) {
        return ResponseEntity.ok(academicoService.listarAlunosPorTurma(turmaId, status));
    }

    @PatchMapping("/matriculas/{id}/status")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<MatriculaDTO> atualizarStatusMatricula(
        @PathVariable Long id,
        @RequestBody MatriculaStatusRequest body
    ) {
        return ResponseEntity.ok(academicoService.atualizarStatusMatricula(id, body.acao()));
    }
}
