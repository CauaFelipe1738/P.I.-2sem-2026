package com.edulytics.backend_spring.aulas;

import com.edulytics.backend_spring.academico.AcademicoService;
import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.auditoria.AuditoriaService;
import com.edulytics.backend_spring.aulas.dto.AulaDTOs.*;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.common.exception.ConflictException;
import com.edulytics.backend_spring.common.exception.DomainRuleException;
import com.edulytics.backend_spring.common.exception.ResourceNotFoundException;
import com.edulytics.backend_spring.disciplinas.Disciplina;
import com.edulytics.backend_spring.disciplinas.DisciplinaRepository;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurma;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurmaRepository;
import com.edulytics.backend_spring.frequencias.Frequencia;
import com.edulytics.backend_spring.frequencias.FrequenciaRepository;
import com.edulytics.backend_spring.professores.Professor;
import com.edulytics.backend_spring.professores.ProfessorRepository;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AulaService {

    private static final Set<String> STATUS_PRESENCA_VALIDOS = Set.of(
        "PRESENTE",
        "AUSENTE",
        "FALTA_JUSTIFICADA",
        "ATRASO"
    );

    private final AulaRepository aulaRepository;
    private final FrequenciaRepository frequenciaRepository;
    private final DisciplinaTurmaRepository disciplinaTurmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final TurmaRepository turmaRepository;
    private final ProfessorRepository professorRepository;
    private final AlunoRepository alunoRepository;
    private final AuditoriaService auditoriaService;
    private final ObjectMapper objectMapper;

    public AulaService(
        AulaRepository aulaRepository,
        FrequenciaRepository frequenciaRepository,
        DisciplinaTurmaRepository disciplinaTurmaRepository,
        DisciplinaRepository disciplinaRepository,
        TurmaRepository turmaRepository,
        ProfessorRepository professorRepository,
        AlunoRepository alunoRepository,
        AuditoriaService auditoriaService,
        ObjectMapper objectMapper
    ) {
        this.aulaRepository = aulaRepository;
        this.frequenciaRepository = frequenciaRepository;
        this.disciplinaTurmaRepository = disciplinaTurmaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.turmaRepository = turmaRepository;
        this.professorRepository = professorRepository;
        this.alunoRepository = alunoRepository;
        this.auditoriaService = auditoriaService;
        this.objectMapper = objectMapper;
    }

    public PageResponse<AulaDTO> listarAulas(
        Long disciplinaTurmaId,
        Long professorId,
        String status,
        String periodo,
        int page,
        int size
    ) {
        List<AulaDTO> list = aulaRepository.findAll().stream()
            .filter(a -> disciplinaTurmaId == null || Objects.equals(a.getDisciplinaTurmaId(), disciplinaTurmaId))
            .filter(a -> professorId == null || Objects.equals(a.getProfessorId(), professorId))
            .filter(a -> status == null || status.isBlank() || a.getStatus().name().equalsIgnoreCase(status))
            .filter(a -> periodo == null || periodo.isBlank() || a.getDataAula().toString().startsWith(periodo))
            .sorted(Comparator.comparing(Aula::getDataAula).reversed().thenComparing(Aula::getId, Comparator.reverseOrder()))
            .map(this::toDTO)
            .toList();
        return AcademicoService.paginateList(list, page, size);
    }

    @Transactional
    public AulaDTO criarAula(AulaRequest req, AuthenticatedUser user) {
        if (!disciplinaTurmaRepository.existsById(req.disciplinaTurmaId())) {
            throw new ResourceNotFoundException("Disciplina ofertada " + req.disciplinaTurmaId() + " não encontrada.");
        }
        Long profId = user.perfilId() != null ? user.perfilId() : 1L;
        Aula aula = new Aula(
            req.disciplinaTurmaId(),
            profId,
            req.dataAula(),
            req.horarioInicio(),
            req.horarioFim(),
            req.conteudo() != null ? req.conteudo() : ""
        );
        if (req.status() != null && !req.status().isBlank()) {
            Aula.Status st = parseAulaStatus(req.status());
            if (st == Aula.Status.REALIZADA) {
                aula.realizar(req.conteudo());
            } else if (st == Aula.Status.CANCELADA) {
                aula.cancelar();
            }
        }
        Aula salva = aulaRepository.save(aula);
        AulaDTO dto = toDTO(salva);
        auditoriaService.registrar("aula", "CREATE", null, dto);
        return dto;
    }

    @Transactional
    public AulaDTO atualizarAula(Long id, AulaUpdateRequest req) {
        Aula aula = aulaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Aula " + id + " não encontrada."));
        AulaDTO anterior = toDTO(aula);
        Aula.Status novoStatus = req.status() != null && !req.status().isBlank() ? parseAulaStatus(req.status()) : null;
        aula.atualizar(req.dataAula(), req.horarioInicio(), req.horarioFim(), req.conteudo(), novoStatus);
        Aula salva = aulaRepository.save(aula);
        AulaDTO dto = toDTO(salva);
        auditoriaService.registrar("aula", "UPDATE", anterior, dto);
        return dto;
    }

    @Transactional
    public AulaDTO realizarAula(Long id, String conteudo) {
        Aula aula = aulaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Aula " + id + " não encontrada."));
        AulaDTO anterior = toDTO(aula);
        aula.realizar(conteudo);
        Aula salva = aulaRepository.save(aula);
        AulaDTO dto = toDTO(salva);
        auditoriaService.registrar("aula", "REALIZAR", anterior, dto);
        return dto;
    }

    @Transactional
    public AulaDTO cancelarAula(Long id) {
        Aula aula = aulaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Aula " + id + " não encontrada."));
        AulaDTO anterior = toDTO(aula);
        aula.cancelar();
        Aula salva = aulaRepository.save(aula);
        AulaDTO dto = toDTO(salva);
        auditoriaService.registrar("aula", "CANCELAR", anterior, dto);
        return dto;
    }

    public List<FrequenciaItemDTO> listarFrequencias(Long aulaId, AuthenticatedUser user) {
        if (!aulaRepository.existsById(aulaId)) {
            throw new ResourceNotFoundException("Aula " + aulaId + " não encontrada.");
        }
        List<Frequencia> rows = frequenciaRepository.findByAulaId(aulaId);
        if (user != null && "Aluno".equalsIgnoreCase(user.cargo())) {
            rows = rows.stream().filter(f -> Objects.equals(f.getAlunoId(), user.perfilId())).toList();
        }
        return rows.stream().map(this::toFrequenciaDTO).toList();
    }

    @Transactional
    public List<FrequenciaItemDTO> salvarFrequenciasEmLote(Long aulaId, FrequenciaLoteRequest req) {
        if (!aulaRepository.existsById(aulaId)) {
            throw new ResourceNotFoundException("Aula " + aulaId + " não encontrada.");
        }
        List<FrequenciaItemRequest> itens = req != null && req.itens() != null ? req.itens() : List.of();
        if (itens.isEmpty()) {
            throw new DomainRuleException("Lista vazia", "Selecione ao menos um aluno para registrar a chamada.");
        }
        Set<Long> vistos = new HashSet<>();
        for (FrequenciaItemRequest item : itens) {
            if (!vistos.add(item.alunoId())) {
                throw new ConflictException("O aluno " + item.alunoId() + " apareceu mais de uma vez na chamada.");
            }
        }

        List<FrequenciaItemDTO> resultado = new ArrayList<>();
        for (FrequenciaItemRequest item : itens) {
            String status = validarStatusPresenca(item.statusPresenca());
            String checklistJson = serializeChecklist(item.checklistAula());
            Frequencia freq = frequenciaRepository.findByAulaIdAndAlunoId(aulaId, item.alunoId())
                .map(existing -> {
                    existing.aplicarStatus(status, item.justificativa(), checklistJson, item.observacao());
                    return existing;
                })
                .orElseGet(() -> new Frequencia(
                    aulaId,
                    item.alunoId(),
                    status,
                    item.justificativa(),
                    checklistJson,
                    item.observacao()
                ));
            Frequencia salva = frequenciaRepository.save(freq);
            resultado.add(toFrequenciaDTO(salva));
        }
        auditoriaService.registrar("frequencia", "UPSERT_LOTE", null, resultado);
        return resultado;
    }

    @Transactional
    public FrequenciaItemDTO atualizarFrequencia(Long id, FrequenciaUpdateRequest req) {
        Frequencia freq = frequenciaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Frequência " + id + " não encontrada."));
        FrequenciaItemDTO anterior = toFrequenciaDTO(freq);
        String status = req.statusPresenca() != null && !req.statusPresenca().isBlank()
            ? validarStatusPresenca(req.statusPresenca())
            : freq.getStatusPresenca();
        String checklistJson = req.checklistAula() != null ? serializeChecklist(req.checklistAula()) : freq.getChecklistAula();
        freq.aplicarStatus(
            status,
            req.justificativa() != null ? req.justificativa() : freq.getJustificativa(),
            checklistJson,
            req.observacao() != null ? req.observacao() : freq.getObservacao()
        );
        Frequencia salva = frequenciaRepository.save(freq);
        FrequenciaItemDTO dto = toFrequenciaDTO(salva);
        auditoriaService.registrar("frequencia", "UPDATE", anterior, dto);
        return dto;
    }

    public AulaDTO toDTO(Aula aula) {
        DisciplinaTurma dt = disciplinaTurmaRepository.findById(aula.getDisciplinaTurmaId()).orElse(null);
        Disciplina disc = dt != null ? disciplinaRepository.findById(dt.getDisciplinaId()).orElse(null) : null;
        Turma turma = dt != null ? turmaRepository.findById(dt.getTurmaId()).orElse(null) : null;
        Professor prof = professorRepository.findById(aula.getProfessorId()).orElse(null);
        return new AulaDTO(
            aula.getId(),
            aula.getDisciplinaTurmaId(),
            aula.getProfessorId(),
            aula.getDataAula(),
            aula.getHorarioInicio(),
            aula.getHorarioFim(),
            aula.getConteudo(),
            aula.getStatus().name(),
            disc != null ? disc.getNome() : "",
            turma != null ? turma.getNomeTurma() : "",
            turma != null ? turma.getId() : null,
            prof != null ? prof.getNomeCompleto() : ""
        );
    }

    public FrequenciaItemDTO toFrequenciaDTO(Frequencia freq) {
        String alunoNome = alunoRepository.findById(freq.getAlunoId())
            .map(Aluno::getNomeCompleto)
            .orElse("");
        return new FrequenciaItemDTO(
            freq.getId(),
            freq.getAulaId(),
            freq.getAlunoId(),
            alunoNome,
            freq.getStatusPresenca(),
            freq.isPresente(),
            freq.getJustificativa(),
            deserializeChecklist(freq.getChecklistAula()),
            freq.getObservacao()
        );
    }

    private String validarStatusPresenca(String status) {
        String norm = status != null && !status.isBlank() ? status.trim().toUpperCase(Locale.ROOT) : "PRESENTE";
        if (!STATUS_PRESENCA_VALIDOS.contains(norm)) {
            throw new DomainRuleException("Status inválido", "Status de presença inválido: " + status);
        }
        return norm;
    }

    private Aula.Status parseAulaStatus(String status) {
        try {
            return Aula.Status.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new DomainRuleException("Status inválido", "Status de aula inválido: " + status);
        }
    }

    private String serializeChecklist(List<String> items) {
        try {
            return objectMapper.writeValueAsString(items != null ? items : List.of());
        } catch (Exception ex) {
            return "[]";
        }
    }

    private List<String> deserializeChecklist(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }
}
