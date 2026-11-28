package com.edulytics.backend_spring.avaliacoes;

import com.edulytics.backend_spring.academico.AcademicoService;
import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.auditoria.AuditoriaService;
import com.edulytics.backend_spring.avaliacoes.dto.AvaliacaoDTOs.*;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.common.exception.DomainRuleException;
import com.edulytics.backend_spring.common.exception.ResourceNotFoundException;
import com.edulytics.backend_spring.disciplinas.Disciplina;
import com.edulytics.backend_spring.disciplinas.DisciplinaRepository;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurma;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurmaRepository;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final AlunoAvaliacaoRepository alunoAvaliacaoRepository;
    private final DisciplinaTurmaRepository disciplinaTurmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final TurmaRepository turmaRepository;
    private final AlunoRepository alunoRepository;
    private final AuditoriaService auditoriaService;

    public AvaliacaoService(
        AvaliacaoRepository avaliacaoRepository,
        AlunoAvaliacaoRepository alunoAvaliacaoRepository,
        DisciplinaTurmaRepository disciplinaTurmaRepository,
        DisciplinaRepository disciplinaRepository,
        TurmaRepository turmaRepository,
        AlunoRepository alunoRepository,
        AuditoriaService auditoriaService
    ) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.alunoAvaliacaoRepository = alunoAvaliacaoRepository;
        this.disciplinaTurmaRepository = disciplinaTurmaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.turmaRepository = turmaRepository;
        this.alunoRepository = alunoRepository;
        this.auditoriaService = auditoriaService;
    }

    public PageResponse<AvaliacaoDTO> listar(
        Long disciplinaTurmaId,
        Long professorId,
        Long periodoId,
        String status,
        int page,
        int size
    ) {
        List<AvaliacaoDTO> list = avaliacaoRepository.findAll().stream()
            .filter(a -> disciplinaTurmaId == null || Objects.equals(a.getDisciplinaTurmaId(), disciplinaTurmaId))
            .filter(a -> professorId == null || Objects.equals(a.getProfessorId(), professorId))
            .filter(a -> periodoId == null || Objects.equals(a.getPeriodoId(), periodoId))
            .filter(a -> status == null || status.isBlank() || a.getStatus().name().equalsIgnoreCase(status))
            .map(this::toDTO)
            .toList();
        return AcademicoService.paginateList(list, page, size);
    }

    @Transactional
    public AvaliacaoDTO criar(AvaliacaoRequest req, AuthenticatedUser user) {
        if (!disciplinaTurmaRepository.existsById(req.disciplinaTurmaId())) {
            throw new ResourceNotFoundException("Disciplina ofertada " + req.disciplinaTurmaId() + " não encontrada.");
        }
        Long profId = user.perfilId() != null ? user.perfilId() : 1L;
        Long periodoId = req.periodoId() != null ? req.periodoId() : 1L;
        Avaliacao.Status status = req.status() != null && !req.status().isBlank()
            ? parseStatus(req.status())
            : Avaliacao.Status.PLANEJADA;
        Avaliacao av = new Avaliacao(
            req.disciplinaTurmaId(),
            profId,
            periodoId,
            req.nomeAvaliacao(),
            req.tipoAvaliacao(),
            req.descricao(),
            req.dataAvaliacao(),
            req.valorTotal(),
            req.peso(),
            status
        );
        Avaliacao salva = avaliacaoRepository.save(av);
        AvaliacaoDTO dto = toDTO(salva);
        auditoriaService.registrar("avaliacao", "CREATE", null, dto);
        return dto;
    }

    @Transactional
    public AvaliacaoDTO atualizar(Long id, AvaliacaoUpdateRequest req) {
        Avaliacao av = avaliacaoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Avaliação " + id + " não encontrada."));
        AvaliacaoDTO anterior = toDTO(av);
        Avaliacao.Status st = req.status() != null && !req.status().isBlank() ? parseStatus(req.status()) : null;
        av.atualizar(req.nomeAvaliacao(), req.tipoAvaliacao(), req.descricao(), req.dataAvaliacao(), req.valorTotal(), req.peso(), st);
        Avaliacao salva = avaliacaoRepository.save(av);
        AvaliacaoDTO dto = toDTO(salva);
        auditoriaService.registrar("avaliacao", "UPDATE", anterior, dto);
        return dto;
    }

    @Transactional
    public void excluir(Long id) {
        Avaliacao avaliacao = avaliacaoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Avaliação " + id + " não encontrada."));
        AvaliacaoDTO anterior = toDTO(avaliacao);
        avaliacaoRepository.delete(avaliacao);
        auditoriaService.registrar("avaliacao", "DELETE", anterior, null);
    }

    @Transactional
    public AvaliacaoDTO corrigir(Long id) {
        Avaliacao av = avaliacaoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Avaliação " + id + " não encontrada."));
        AvaliacaoDTO anterior = toDTO(av);
        av.corrigir();
        Avaliacao salva = avaliacaoRepository.save(av);
        AvaliacaoDTO dto = toDTO(salva);
        auditoriaService.registrar("avaliacao", "CORRIGIR", anterior, dto);
        return dto;
    }

    public List<AlunoAvaliacaoDTO> listarNotas(Long avaliacaoId, AuthenticatedUser user) {
        Avaliacao av = avaliacaoRepository.findById(avaliacaoId)
            .orElseThrow(() -> new ResourceNotFoundException("Avaliação " + avaliacaoId + " não encontrada."));
        List<AlunoAvaliacao> rows = alunoAvaliacaoRepository.findByAvaliacaoId(avaliacaoId);
        if (user != null && "Aluno".equalsIgnoreCase(user.cargo())) {
            rows = rows.stream().filter(n -> Objects.equals(n.getAlunoId(), user.perfilId())).toList();
        }
        return rows.stream().map(n -> toNotaDTO(n, av)).toList();
    }

    @Transactional
    public AlunoAvaliacaoDTO lancarNota(Long avaliacaoId, Long alunoId, NotaRequest req) {
        Avaliacao av = avaliacaoRepository.findById(avaliacaoId)
            .orElseThrow(() -> new ResourceNotFoundException("Avaliação " + avaliacaoId + " não encontrada."));
        if (!alunoRepository.existsById(alunoId)) {
            throw new ResourceNotFoundException("Aluno " + alunoId + " não encontrado.");
        }
        av.validarNota(req.nota());
        AlunoAvaliacao reg = alunoAvaliacaoRepository.findByAvaliacaoIdAndAlunoId(avaliacaoId, alunoId)
            .map(existing -> {
                existing.atualizarNota(req.nota(), req.observacao());
                return existing;
            })
            .orElseGet(() -> new AlunoAvaliacao(avaliacaoId, alunoId, req.nota(), req.observacao()));
        AlunoAvaliacao salvo = alunoAvaliacaoRepository.save(reg);
        AlunoAvaliacaoDTO dto = toNotaDTO(salvo, av);
        auditoriaService.registrar("aluno_avaliacao", "UPSERT", null, dto);
        return dto;
    }

    private AvaliacaoDTO toDTO(Avaliacao av) {
        DisciplinaTurma dt = disciplinaTurmaRepository.findById(av.getDisciplinaTurmaId()).orElse(null);
        Disciplina disc = dt != null ? disciplinaRepository.findById(dt.getDisciplinaId()).orElse(null) : null;
        Turma turma = dt != null ? turmaRepository.findById(dt.getTurmaId()).orElse(null) : null;
        return new AvaliacaoDTO(
            av.getId(),
            av.getDisciplinaTurmaId(),
            av.getProfessorId(),
            av.getPeriodoId(),
            av.getNomeAvaliacao(),
            av.getTipoAvaliacao(),
            av.getDescricao(),
            av.getDataAvaliacao(),
            av.getValorTotal(),
            av.getPeso(),
            av.getStatus().name(),
            disc != null ? disc.getNome() : "",
            turma != null ? turma.getNomeTurma() : "",
            turma != null ? turma.getId() : null
        );
    }

    private AlunoAvaliacaoDTO toNotaDTO(AlunoAvaliacao reg, Avaliacao av) {
        String alunoNome = alunoRepository.findById(reg.getAlunoId())
            .map(Aluno::getNomeCompleto)
            .orElse("");
        return new AlunoAvaliacaoDTO(
            reg.getId(),
            reg.getAvaliacaoId(),
            reg.getAlunoId(),
            alunoNome,
            reg.getNota(),
            reg.getObservacao(),
            av.getValorTotal()
        );
    }

    private Avaliacao.Status parseStatus(String value) {
        try {
            return Avaliacao.Status.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new DomainRuleException("Status inválido", "Status de avaliação inválido: " + value);
        }
    }
}
