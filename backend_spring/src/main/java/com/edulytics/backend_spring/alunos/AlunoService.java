package com.edulytics.backend_spring.alunos;

import com.edulytics.backend_spring.academico.AcademicoService;
import com.edulytics.backend_spring.alunos.dto.AlunoResponseDTO;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.matriculas.Matricula;
import com.edulytics.backend_spring.matriculas.MatriculaRepository;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final MatriculaRepository matriculaRepository;
    private final TurmaRepository turmaRepository;

    public AlunoService(
        AlunoRepository alunoRepository,
        MatriculaRepository matriculaRepository,
        TurmaRepository turmaRepository
    ) {
        this.alunoRepository = alunoRepository;
        this.matriculaRepository = matriculaRepository;
        this.turmaRepository = turmaRepository;
    }

    public PageResponse<AlunoResponseDTO> listarFiltrado(
        String q,
        Long turmaId,
        Long cursoId,
        Pageable pageable
    ) {
        List<Turma> todasTurmas = turmaRepository.findAll();
        Map<Long, Long> turmaParaCurso = new HashMap<>();
        for (Turma t : todasTurmas) {
            turmaParaCurso.put(t.getId(), t.getCursoId());
        }

        List<Matricula> todasMatriculas = matriculaRepository.findAll();
        String term = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";

        List<AlunoResponseDTO> filtrados = new ArrayList<>();
        for (Aluno a : alunoRepository.findAll()) {
            if (!term.isEmpty()) {
                String text = ((a.getNomeCompleto() != null ? a.getNomeCompleto() : "") + " " +
                    (a.getMatricula() != null ? a.getMatricula() : "")).toLowerCase(Locale.ROOT);
                if (!text.contains(term)) continue;
            }

            List<Long> turmaIds = new ArrayList<>();
            Set<Long> cursoIds = new LinkedHashSet<>();
            for (Matricula m : todasMatriculas) {
                if (Objects.equals(m.getAlunoId(), a.getId()) && m.getStatus() == Matricula.Status.ATIVA) {
                    turmaIds.add(m.getTurmaId());
                    Long cId = turmaParaCurso.get(m.getTurmaId());
                    if (cId != null) cursoIds.add(cId);
                }
            }

            if (turmaId != null && !turmaIds.contains(turmaId)) continue;
            if (cursoId != null && !cursoIds.contains(cursoId)) continue;

            filtrados.add(AlunoResponseDTO.from(a, turmaIds, new ArrayList<>(cursoIds)));
        }

        filtrados.sort(Comparator.comparing(AlunoResponseDTO::nomeCompleto, String.CASE_INSENSITIVE_ORDER));
        return AcademicoService.paginateList(filtrados, pageable.getPageNumber(), pageable.getPageSize());
    }
}
