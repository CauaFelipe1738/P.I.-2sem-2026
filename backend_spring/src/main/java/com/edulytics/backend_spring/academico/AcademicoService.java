package com.edulytics.backend_spring.academico;

import com.edulytics.backend_spring.academico.dto.AcademicoDTOs.*;
import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.auditoria.AuditoriaService;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.common.exception.DomainRuleException;
import com.edulytics.backend_spring.common.exception.ResourceNotFoundException;
import com.edulytics.backend_spring.cursos.Curso;
import com.edulytics.backend_spring.cursos.CursoRepository;
import com.edulytics.backend_spring.disciplinas.Disciplina;
import com.edulytics.backend_spring.disciplinas.DisciplinaRepository;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurma;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurmaRepository;
import com.edulytics.backend_spring.matriculas.Matricula;
import com.edulytics.backend_spring.matriculas.MatriculaRepository;
import com.edulytics.backend_spring.periodos.Periodo;
import com.edulytics.backend_spring.periodos.PeriodoRepository;
import com.edulytics.backend_spring.professores.ProfessorDisciplinaTurmaRepository;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AcademicoService {

    private final CursoRepository cursoRepository;
    private final PeriodoRepository periodoRepository;
    private final TurmaRepository turmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final DisciplinaTurmaRepository disciplinaTurmaRepository;
    private final ProfessorDisciplinaTurmaRepository pdtRepository;
    private final MatriculaRepository matriculaRepository;
    private final AlunoRepository alunoRepository;
    private final AuditoriaService auditoriaService;

    public AcademicoService(
        CursoRepository cursoRepository,
        PeriodoRepository periodoRepository,
        TurmaRepository turmaRepository,
        DisciplinaRepository disciplinaRepository,
        DisciplinaTurmaRepository disciplinaTurmaRepository,
        ProfessorDisciplinaTurmaRepository pdtRepository,
        MatriculaRepository matriculaRepository,
        AlunoRepository alunoRepository,
        AuditoriaService auditoriaService
    ) {
        this.cursoRepository = cursoRepository;
        this.periodoRepository = periodoRepository;
        this.turmaRepository = turmaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.disciplinaTurmaRepository = disciplinaTurmaRepository;
        this.pdtRepository = pdtRepository;
        this.matriculaRepository = matriculaRepository;
        this.alunoRepository = alunoRepository;
        this.auditoriaService = auditoriaService;
    }

    public PageResponse<CursoResumoDTO> listarCursos(
        AuthenticatedUser user,
        String status,
        String q,
        Boolean somenteMeus,
        String sort,
        int page,
        int size
    ) {
        List<Curso> allCursos = cursoRepository.findAll();
        List<Turma> allTurmas = turmaRepository.findAll();
        List<Matricula> allMatriculas = matriculaRepository.findAll();

        Set<Long> meusCursos = null;
        if (Boolean.TRUE.equals(somenteMeus) && user != null && "Professor".equalsIgnoreCase(user.cargo())) {
            Set<Long> dtIds = new HashSet<>();
            pdtRepository.findByProfessorId(user.perfilId()).forEach(p -> dtIds.add(p.getDisciplinaTurmaId()));
            Set<Long> turmaIds = new HashSet<>();
            disciplinaTurmaRepository.findAllById(dtIds).forEach(dt -> turmaIds.add(dt.getTurmaId()));
            meusCursos = new HashSet<>();
            for (Turma t : allTurmas) {
                if (turmaIds.contains(t.getId())) {
                    meusCursos.add(t.getCursoId());
                }
            }
        }

        List<CursoResumoDTO> list = new ArrayList<>();
        for (Curso c : allCursos) {
            if (meusCursos != null && !meusCursos.contains(c.getId())) continue;
            if (status != null && !status.isBlank() && !"Todos".equalsIgnoreCase(status) && !c.getStatus().equalsIgnoreCase(status)) continue;
            if (q != null && !q.isBlank()) {
                String term = q.trim().toLowerCase(Locale.ROOT);
                String text = ((c.getNome() != null ? c.getNome() : "") + " " + (c.getDescricao() != null ? c.getDescricao() : ""))
                    .toLowerCase(Locale.ROOT);
                if (!text.contains(term)) continue;
            }
            Set<Long> turmaIdsCurso = new HashSet<>();
            for (Turma t : allTurmas) {
                if (Objects.equals(t.getCursoId(), c.getId())) {
                    turmaIdsCurso.add(t.getId());
                }
            }
            Set<Long> alunosUnicos = new HashSet<>();
            for (Matricula m : allMatriculas) {
                if (turmaIdsCurso.contains(m.getTurmaId()) && m.getStatus() == Matricula.Status.ATIVA) {
                    alunosUnicos.add(m.getAlunoId());
                }
            }
            list.add(new CursoResumoDTO(c.getId(), c.getNome(), c.getDescricao(), c.getCargaHoraria(), c.getStatus(), alunosUnicos.size()));
        }

        if ("nome_desc".equalsIgnoreCase(sort)) {
            list.sort(Comparator.comparing(CursoResumoDTO::nome, String.CASE_INSENSITIVE_ORDER).reversed());
        } else if ("alunos_desc".equalsIgnoreCase(sort)) {
            list.sort(Comparator.comparingLong(CursoResumoDTO::totalAlunos).reversed());
        } else {
            list.sort(Comparator.comparing(CursoResumoDTO::nome, String.CASE_INSENSITIVE_ORDER));
        }

        return paginateList(list, page, size);
    }

    public List<PeriodoDTO> listarPeriodos() {
        return periodoRepository.findAll().stream()
            .map(p -> new PeriodoDTO(p.getId(), p.getNomePeriodo(), p.getAnoLetivo(), p.getDataInicio(), p.getDataFim()))
            .toList();
    }

    public List<TurmaDTO> listarTurmasPorCurso(Long cursoId, Long periodoId) {
        if (!cursoRepository.existsById(cursoId)) {
            throw new ResourceNotFoundException("Curso " + cursoId + " não encontrado.");
        }
        return turmaRepository.findByCursoId(cursoId).stream()
            .filter(t -> periodoId == null || Objects.equals(t.getPeriodoId(), periodoId))
            .map(t -> new TurmaDTO(t.getId(), t.getCursoId(), t.getPeriodoId(), t.getNomeTurma(), t.getTurno(), t.getStatus()))
            .toList();
    }

    public List<DisciplinaTurmaDTO> listarDisciplinasPorTurma(Long turmaId) {
        Turma turma = turmaRepository.findById(turmaId)
            .orElseThrow(() -> new ResourceNotFoundException("Turma " + turmaId + " não encontrada."));
        List<DisciplinaTurma> dts = disciplinaTurmaRepository.findByTurmaId(turmaId);
        List<DisciplinaTurmaDTO> out = new ArrayList<>();
        for (DisciplinaTurma dt : dts) {
            Disciplina d = disciplinaRepository.findById(dt.getDisciplinaId()).orElse(null);
            if (d == null) continue;
            out.add(new DisciplinaTurmaDTO(
                dt.getId(),
                turma.getId(),
                turma.getNomeTurma(),
                turma.getCursoId(),
                new DisciplinaInfoDTO(d.getId(), d.getNome(), d.getDescricao(), d.getCargaHoraria())
            ));
        }
        return out;
    }

    public List<AlunoTurmaDTO> listarAlunosPorTurma(Long turmaId, String statusStr) {
        if (!turmaRepository.existsById(turmaId)) {
            throw new ResourceNotFoundException("Turma " + turmaId + " não encontrada.");
        }
        Matricula.Status status = parseMatriculaStatus(statusStr != null && !statusStr.isBlank() ? statusStr : "ATIVA");
        List<Matricula> mats = matriculaRepository.findByTurmaIdAndStatus(turmaId, status);
        List<AlunoTurmaDTO> out = new ArrayList<>();
        for (Matricula m : mats) {
            Aluno a = alunoRepository.findById(m.getAlunoId()).orElse(null);
            if (a == null) continue;
            out.add(new AlunoTurmaDTO(a.getId(), m.getId(), a.getNomeCompleto(), a.getMatricula(), m.getStatus().name()));
        }
        out.sort(Comparator.comparing(AlunoTurmaDTO::nomeCompleto, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    @Transactional
    public MatriculaDTO atualizarStatusMatricula(Long id, String acao) {
        Matricula matricula = matriculaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Matrícula " + id + " não encontrada."));
        String acaoNorm = acao != null ? acao.trim().toUpperCase(Locale.ROOT) : "";
        String anterior = matricula.getStatus().name();
        switch (acaoNorm) {
            case "CONCLUIR" -> matricula.concluir();
            case "CANCELAR" -> matricula.cancelar(LocalDate.now());
            case "TRANCAR" -> matricula.trancar();
            default -> throw new DomainRuleException("Ação inválida", "Informe CONCLUIR, CANCELAR ou TRANCAR.");
        }
        Matricula salva = matriculaRepository.save(matricula);
        MatriculaDTO dto = new MatriculaDTO(
            salva.getId(),
            salva.getAlunoId(),
            salva.getTurmaId(),
            salva.getStatus().name(),
            salva.getDataMatricula(),
            salva.getDataDesligamento()
        );
        auditoriaService.registrar("matricula", "UPDATE_STATUS", anterior, dto);
        return dto;
    }

    private Matricula.Status parseMatriculaStatus(String value) {
        try {
            return Matricula.Status.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new DomainRuleException("Status inválido", "Status de matrícula inválido: " + value);
        }
    }

    public static <T> PageResponse<T> paginateList(List<T> items, int page, int size) {
        int safeSize = Math.max(1, Math.min(100, size));
        int safePage = Math.max(0, page);
        int from = Math.min(safePage * safeSize, items.size());
        int to = Math.min(from + safeSize, items.size());
        int totalPages = (int) Math.ceil((double) items.size() / safeSize);
        return new PageResponse<>(items.subList(from, to), safePage, safeSize, items.size(), totalPages);
    }
}
