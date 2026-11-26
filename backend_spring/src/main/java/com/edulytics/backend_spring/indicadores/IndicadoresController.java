package com.edulytics.backend_spring.indicadores;

import com.edulytics.backend_spring.indicadores.dto.IndicadoresDTOs.*;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1")
public class IndicadoresController {

    private final IndicadoresService indicadoresService;

    public IndicadoresController(IndicadoresService indicadoresService) {
        this.indicadoresService = indicadoresService;
    }

    @GetMapping("/indicadores/desempenho")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<IndicadoresDesempenhoDTO> getIndicadores(
        @RequestParam(required = false) Long cursoId,
        @RequestParam(required = false) Long turmaId,
        @RequestParam(required = false) Long disciplinaTurmaId,
        @RequestParam(required = false) Long alunoId,
        @RequestParam(required = false) Long periodoId,
        @RequestParam(required = false) String periodo,
        @RequestParam(required = false) LocalDate dataInicio,
        @RequestParam(required = false) LocalDate dataFim
    ) {
        return ResponseEntity.ok(indicadoresService.calcularIndicadores(
            cursoId, turmaId, disciplinaTurmaId, alunoId, periodoId, periodo, dataInicio, dataFim
        ));
    }

    @GetMapping("/relatorios/academico")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<RelatorioAcademicoDTO> getRelatorio(
        @RequestParam(required = false) Long cursoId,
        @RequestParam(required = false) Long turmaId,
        @RequestParam(required = false) Long disciplinaTurmaId,
        @RequestParam(required = false) Long alunoId,
        @RequestParam(required = false) Long periodoId,
        @RequestParam(required = false) String periodo,
        @RequestParam(required = false) LocalDate dataInicio,
        @RequestParam(required = false) LocalDate dataFim
    ) {
        return ResponseEntity.ok(indicadoresService.gerarRelatorio(
            cursoId, turmaId, disciplinaTurmaId, alunoId, periodoId, periodo, dataInicio, dataFim
        ));
    }

    @GetMapping("/me/desempenho")
    @PreAuthorize("hasRole('ALUNO')")
    public ResponseEntity<MeuDesempenhoDTO> getMeuDesempenho(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam(required = false) Long disciplinaTurmaId
    ) {
        return ResponseEntity.ok(indicadoresService.obterMeuDesempenho(user, disciplinaTurmaId));
    }

    @GetMapping("/indicadores/analytics")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<AnalyticsAvancadoDTO> getAnalyticsAvancado(
        @RequestParam(required = false) Long cursoId,
        @RequestParam(required = false) Long turmaId,
        @RequestParam(required = false) Long periodoId
    ) {
        return ResponseEntity.ok(indicadoresService.calcularAnalyticsAvancado(cursoId, turmaId, periodoId));
    }
}
