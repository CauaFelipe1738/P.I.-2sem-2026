package com.edulytics.backend_spring.indicadores;

import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.alunos.dto.AlunoResponseDTO;
import com.edulytics.backend_spring.aulas.Aula;
import com.edulytics.backend_spring.aulas.AulaRepository;
import com.edulytics.backend_spring.avaliacoes.AlunoAvaliacao;
import com.edulytics.backend_spring.avaliacoes.AlunoAvaliacaoRepository;
import com.edulytics.backend_spring.avaliacoes.Avaliacao;
import com.edulytics.backend_spring.avaliacoes.AvaliacaoRepository;
import com.edulytics.backend_spring.comentarios.Comentario;
import com.edulytics.backend_spring.comentarios.ComentarioRepository;
import com.edulytics.backend_spring.comentarios.ComentarioService;
import com.edulytics.backend_spring.comentarios.dto.ComentarioDTOs.ComentarioDTO;
import com.edulytics.backend_spring.common.exception.DomainRuleException;
import com.edulytics.backend_spring.common.exception.ResourceNotFoundException;
import com.edulytics.backend_spring.cursos.Curso;
import com.edulytics.backend_spring.cursos.CursoRepository;
import com.edulytics.backend_spring.disciplinas.Disciplina;
import com.edulytics.backend_spring.disciplinas.DisciplinaRepository;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurma;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurmaRepository;
import com.edulytics.backend_spring.frequencias.Frequencia;
import com.edulytics.backend_spring.frequencias.FrequenciaRepository;
import com.edulytics.backend_spring.indicadores.dto.IndicadoresDTOs.*;
import com.edulytics.backend_spring.matriculas.Matricula;
import com.edulytics.backend_spring.matriculas.MatriculaRepository;
import com.edulytics.backend_spring.periodos.Periodo;
import com.edulytics.backend_spring.periodos.PeriodoRepository;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
public class IndicadoresService {

    public static final int CORTE_PRESENCA_PERCENTUAL = 75;

    private final DisciplinaTurmaRepository disciplinaTurmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final TurmaRepository turmaRepository;
    private final CursoRepository cursoRepository;
    private final PeriodoRepository periodoRepository;
    private final MatriculaRepository matriculaRepository;
    private final AulaRepository aulaRepository;
    private final FrequenciaRepository frequenciaRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final AlunoAvaliacaoRepository alunoAvaliacaoRepository;
    private final ComentarioRepository comentarioRepository;
    private final ComentarioService comentarioService;
    private final AlunoRepository alunoRepository;

    public IndicadoresService(
        DisciplinaTurmaRepository disciplinaTurmaRepository,
        DisciplinaRepository disciplinaRepository,
        TurmaRepository turmaRepository,
        CursoRepository cursoRepository,
        PeriodoRepository periodoRepository,
        MatriculaRepository matriculaRepository,
        AulaRepository aulaRepository,
        FrequenciaRepository frequenciaRepository,
        AvaliacaoRepository avaliacaoRepository,
        AlunoAvaliacaoRepository alunoAvaliacaoRepository,
        ComentarioRepository comentarioRepository,
        ComentarioService comentarioService,
        AlunoRepository alunoRepository
    ) {
        this.disciplinaTurmaRepository = disciplinaTurmaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.turmaRepository = turmaRepository;
        this.cursoRepository = cursoRepository;
        this.periodoRepository = periodoRepository;
        this.matriculaRepository = matriculaRepository;
        this.aulaRepository = aulaRepository;
        this.frequenciaRepository = frequenciaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.alunoAvaliacaoRepository = alunoAvaliacaoRepository;
        this.comentarioRepository = comentarioRepository;
        this.comentarioService = comentarioService;
        this.alunoRepository = alunoRepository;
    }

    public IndicadoresDesempenhoDTO calcularIndicadores(
        Long cursoId,
        Long turmaId,
        Long disciplinaTurmaId,
        Long alunoId,
        Long periodoId,
        String periodo,
        LocalDate dataInicio,
        LocalDate dataFim
    ) {
        Set<Long> dtIds = filterContextIds(cursoId, turmaId, disciplinaTurmaId);
        List<Aula> aulas = aulaRepository.findAll().stream()
            .filter(a -> dtIds.contains(a.getDisciplinaTurmaId()))
            .filter(a -> dataInicio == null || !a.getDataAula().isBefore(dataInicio))
            .filter(a -> dataFim == null || !a.getDataAula().isAfter(dataFim))
            .filter(a -> periodo == null || periodo.isBlank() || a.getDataAula().toString().startsWith(periodo))
            .toList();

        Set<Long> aulaIds = new HashSet<>();
        for (Aula a : aulas) aulaIds.add(a.getId());

        List<Frequencia> freqs = frequenciaRepository.findAll().stream()
            .filter(f -> aulaIds.contains(f.getAulaId()))
            .filter(f -> alunoId == null || Objects.equals(f.getAlunoId(), alunoId))
            .toList();

        List<Avaliacao> avaliacoes = avaliacaoRepository.findAll().stream()
            .filter(av -> dtIds.contains(av.getDisciplinaTurmaId()))
            .filter(av -> periodoId == null || Objects.equals(av.getPeriodoId(), periodoId))
            .toList();

        Map<Long, Avaliacao> avMap = new HashMap<>();
        for (Avaliacao av : avaliacoes) avMap.put(av.getId(), av);

        List<AlunoAvaliacao> notasRaw = alunoAvaliacaoRepository.findAll().stream()
            .filter(aa -> avMap.containsKey(aa.getAvaliacaoId()))
            .filter(aa -> alunoId == null || Objects.equals(aa.getAlunoId(), alunoId))
            .toList();

        List<Comentario> comentarios = comentarioRepository.findAll().stream()
            .filter(c -> c.getDisciplinaTurmaId() == null || dtIds.contains(c.getDisciplinaTurmaId()))
            .filter(c -> alunoId == null || Objects.equals(c.getAlunoId(), alunoId))
            .filter(c -> periodo == null || periodo.isBlank() || c.getDataComentario().toString().startsWith(periodo))
            .toList();

        Map<Long, List<Frequencia>> freqsPorAluno = new LinkedHashMap<>();
        for (Frequencia f : freqs) {
            freqsPorAluno.computeIfAbsent(f.getAlunoId(), k -> new ArrayList<>()).add(f);
        }

        List<AlertaAlunoDTO> alertas = new ArrayList<>();
        int abaixoCorte = 0;

        for (Map.Entry<Long, List<Frequencia>> entry : freqsPorAluno.entrySet()) {
            Long aid = entry.getKey();
            Integer taxa = calcularTaxaFrequencia(entry.getValue());
            int dificuldades = (int) comentarios.stream()
                .filter(c -> Objects.equals(c.getAlunoId(), aid))
                .filter(c -> "ATENCAO".equalsIgnoreCase(c.getClassificacao()) || "NEGATIVO".equalsIgnoreCase(c.getClassificacao()))
                .count();
            if (taxa != null && taxa < CORTE_PRESENCA_PERCENTUAL) {
                abaixoCorte += 1;
            }
            if ((taxa != null && taxa < CORTE_PRESENCA_PERCENTUAL) || dificuldades > 0) {
                String nome = alunoRepository.findById(aid).map(Aluno::getNomeCompleto).orElse("Aluno #" + aid);
                alertas.add(new AlertaAlunoDTO(aid, nome, taxa, dificuldades));
            }
        }

        Map<String, Integer> porCategoria = new LinkedHashMap<>();
        for (Comentario c : comentarios) {
            porCategoria.merge(c.getTipo(), 1, Integer::sum);
        }

        Integer percentualAbaixo = freqsPorAluno.isEmpty()
            ? null
            : (int) Math.round((abaixoCorte * 100.0) / freqsPorAluno.size());

        int totalAlunosAvaliados = (int) notasRaw.stream().map(AlunoAvaliacao::getAlunoId).distinct().count();

        return new IndicadoresDesempenhoDTO(
            calcularTaxaFrequencia(freqs),
            percentualAbaixo,
            CORTE_PRESENCA_PERCENTUAL,
            calcularMediaPonderada(notasRaw, avMap),
            aulas.size(),
            totalAlunosAvaliados,
            comentarios.size(),
            porCategoria,
            alertas
        );
    }

    public RelatorioAcademicoDTO gerarRelatorio(
        Long cursoId,
        Long turmaId,
        Long disciplinaTurmaId,
        Long alunoId,
        Long periodoId,
        String periodo,
        LocalDate dataInicio,
        LocalDate dataFim
    ) {
        IndicadoresDesempenhoDTO indicadores = calcularIndicadores(
            cursoId, turmaId, disciplinaTurmaId, alunoId, periodoId, periodo, dataInicio, dataFim
        );
        Set<Long> dtIds = filterContextIds(cursoId, turmaId, disciplinaTurmaId);

        Map<Long, Aula> aulaMap = new HashMap<>();
        for (Aula a : aulaRepository.findAll()) {
            if (dtIds.contains(a.getDisciplinaTurmaId())
                && (periodo == null || periodo.isBlank() || a.getDataAula().toString().startsWith(periodo))) {
                aulaMap.put(a.getId(), a);
            }
        }

        List<FrequenciaRelatorioDTO> freqs = frequenciaRepository.findAll().stream()
            .filter(f -> aulaMap.containsKey(f.getAulaId()))
            .filter(f -> alunoId == null || Objects.equals(f.getAlunoId(), alunoId))
            .map(f -> toFreqRelatorio(f, aulaMap.get(f.getAulaId())))
            .toList();

        Map<Long, Avaliacao> avMap = new HashMap<>();
        for (Avaliacao av : avaliacaoRepository.findAll()) {
            if (dtIds.contains(av.getDisciplinaTurmaId())) {
                avMap.put(av.getId(), av);
            }
        }

        List<NotaRelatorioDTO> notas = alunoAvaliacaoRepository.findAll().stream()
            .filter(aa -> avMap.containsKey(aa.getAvaliacaoId()))
            .filter(aa -> alunoId == null || Objects.equals(aa.getAlunoId(), alunoId))
            .map(aa -> toNotaRelatorio(aa, avMap.get(aa.getAvaliacaoId())))
            .toList();

        List<ComentarioDTO> comentarios = comentarioRepository.findAll().stream()
            .filter(c -> c.getDisciplinaTurmaId() == null || dtIds.contains(c.getDisciplinaTurmaId()))
            .filter(c -> alunoId == null || Objects.equals(c.getAlunoId(), alunoId))
            .filter(c -> periodo == null || periodo.isBlank() || c.getDataComentario().toString().startsWith(periodo))
            .map(comentarioService::toDTO)
            .toList();

        return new RelatorioAcademicoDTO(indicadores, freqs, notas, comentarios, Instant.now());
    }

    public MeuDesempenhoDTO obterMeuDesempenho(AuthenticatedUser user) {
        if (user == null || !"Aluno".equalsIgnoreCase(user.cargo())) {
            throw new DomainRuleException("Acesso restrito", "Esta rota é exclusiva para o perfil Aluno.");
        }
        Long alunoId = user.perfilId();
        Aluno aluno = alunoRepository.findById(alunoId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil de aluno " + alunoId + " não encontrado."));

        List<MatriculaResumoAlunoDTO> matriculas = matriculaRepository.findByAlunoId(alunoId).stream()
            .map(m -> {
                Turma turma = turmaRepository.findById(m.getTurmaId()).orElse(null);
                Curso curso = turma != null ? cursoRepository.findById(turma.getCursoId()).orElse(null) : null;
                Periodo periodo = turma != null ? periodoRepository.findById(turma.getPeriodoId()).orElse(null) : null;
                return new MatriculaResumoAlunoDTO(
                    m.getId(),
                    m.getStatus().name(),
                    turma != null ? turma.getNomeTurma() : "",
                    curso != null ? curso.getNome() : "",
                    periodo != null ? periodo.getNomePeriodo() : ""
                );
            })
            .toList();

        List<Frequencia> rawFreqs = frequenciaRepository.findByAlunoId(alunoId);
        List<FrequenciaRelatorioDTO> freqs = rawFreqs.stream()
            .map(f -> toFreqRelatorio(f, aulaRepository.findById(f.getAulaId()).orElse(null)))
            .toList();

        List<AlunoAvaliacao> rawNotas = alunoAvaliacaoRepository.findByAlunoId(alunoId);
        Map<Long, Avaliacao> avMap = new HashMap<>();
        avaliacaoRepository.findAll().forEach(av -> avMap.put(av.getId(), av));
        List<NotaRelatorioDTO> notas = rawNotas.stream()
            .map(n -> toNotaRelatorio(n, avMap.get(n.getAvaliacaoId())))
            .toList();

        List<ComentarioDTO> comentariosVisiveis = comentarioRepository.findByAlunoIdAndVisivelAlunoTrue(alunoId).stream()
            .map(comentarioService::toDTO)
            .toList();

        long faltas = rawFreqs.stream().filter(f -> !f.isPresente()).count();
        long atrasos = rawFreqs.stream().filter(f -> "ATRASO".equalsIgnoreCase(f.getStatusPresenca())).count();

        return new MeuDesempenhoDTO(
            AlunoResponseDTO.from(aluno),
            matriculas,
            calcularTaxaFrequencia(rawFreqs),
            calcularMediaPonderada(rawNotas, avMap),
            faltas,
            atrasos,
            freqs,
            notas,
            comentariosVisiveis
        );
    }

    private Set<Long> filterContextIds(Long cursoId, Long turmaId, Long disciplinaTurmaId) {
        List<DisciplinaTurma> dts = disciplinaTurmaRepository.findAll();
        if (cursoId != null) {
            Set<Long> turmasCurso = new HashSet<>();
            turmaRepository.findByCursoId(cursoId).forEach(t -> turmasCurso.add(t.getId()));
            dts = dts.stream().filter(dt -> turmasCurso.contains(dt.getTurmaId())).toList();
        }
        if (turmaId != null) {
            dts = dts.stream().filter(dt -> Objects.equals(dt.getTurmaId(), turmaId)).toList();
        }
        if (disciplinaTurmaId != null) {
            dts = dts.stream().filter(dt -> Objects.equals(dt.getId(), disciplinaTurmaId)).toList();
        }
        Set<Long> ids = new HashSet<>();
        dts.forEach(dt -> ids.add(dt.getId()));
        return ids;
    }

    private Integer calcularTaxaFrequencia(List<Frequencia> regs) {
        if (regs == null || regs.isEmpty()) return null;
        long presentes = regs.stream().filter(Frequencia::isPresente).count();
        return (int) Math.round((presentes * 100.0) / regs.size());
    }

    private Double calcularMediaPonderada(List<AlunoAvaliacao> notas, Map<Long, Avaliacao> avMap) {
        double somaPonderada = 0.0;
        double somaPesos = 0.0;
        for (AlunoAvaliacao n : notas) {
            if (n.getNota() == null) continue;
            Avaliacao av = avMap.get(n.getAvaliacaoId());
            if (av == null || av.getValorTotal() == null || av.getValorTotal().compareTo(BigDecimal.ZERO) <= 0) continue;
            double peso = av.getPeso() != null && av.getPeso().doubleValue() > 0 ? av.getPeso().doubleValue() : 1.0;
            double normalizada = (n.getNota().doubleValue() / av.getValorTotal().doubleValue()) * 10.0;
            somaPonderada += normalizada * peso;
            somaPesos += peso;
        }
        if (somaPesos <= 0.0) return null;
        return Math.round((somaPonderada / somaPesos) * 10.0) / 10.0;
    }

    private FrequenciaRelatorioDTO toFreqRelatorio(Frequencia f, Aula aula) {
        String alunoNome = alunoRepository.findById(f.getAlunoId()).map(Aluno::getNomeCompleto).orElse("");
        DisciplinaTurma dt = aula != null ? disciplinaTurmaRepository.findById(aula.getDisciplinaTurmaId()).orElse(null) : null;
        Disciplina disc = dt != null ? disciplinaRepository.findById(dt.getDisciplinaId()).orElse(null) : null;
        Turma turma = dt != null ? turmaRepository.findById(dt.getTurmaId()).orElse(null) : null;
        return new FrequenciaRelatorioDTO(
            f.getId(),
            f.getAulaId(),
            f.getAlunoId(),
            alunoNome,
            f.getStatusPresenca(),
            f.isPresente(),
            f.getJustificativa(),
            aula != null ? aula.getDataAula() : null,
            aula != null ? aula.getConteudo() : "",
            disc != null ? disc.getNome() : "",
            turma != null ? turma.getNomeTurma() : ""
        );
    }

    private NotaRelatorioDTO toNotaRelatorio(AlunoAvaliacao n, Avaliacao av) {
        String alunoNome = alunoRepository.findById(n.getAlunoId()).map(Aluno::getNomeCompleto).orElse("");
        DisciplinaTurma dt = av != null ? disciplinaTurmaRepository.findById(av.getDisciplinaTurmaId()).orElse(null) : null;
        Disciplina disc = dt != null ? disciplinaRepository.findById(dt.getDisciplinaId()).orElse(null) : null;
        Turma turma = dt != null ? turmaRepository.findById(dt.getTurmaId()).orElse(null) : null;
        return new NotaRelatorioDTO(
            n.getId(),
            n.getAvaliacaoId(),
            n.getAlunoId(),
            alunoNome,
            av != null ? av.getNomeAvaliacao() : "",
            av != null ? av.getTipoAvaliacao() : "",
            av != null ? av.getDataAvaliacao() : null,
            n.getNota(),
            av != null ? av.getValorTotal() : BigDecimal.TEN,
            av != null ? av.getPeso() : BigDecimal.ONE,
            n.getObservacao(),
            disc != null ? disc.getNome() : "",
            turma != null ? turma.getNomeTurma() : ""
        );
    }
}
