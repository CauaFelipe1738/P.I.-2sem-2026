package com.edulytics.backend_spring.comentarios;

import com.edulytics.backend_spring.academico.AcademicoService;
import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.auditoria.AuditoriaService;
import com.edulytics.backend_spring.comentarios.dto.ComentarioDTOs.*;
import com.edulytics.backend_spring.common.dto.PageResponse;
import com.edulytics.backend_spring.common.exception.ResourceNotFoundException;
import com.edulytics.backend_spring.disciplinas.Disciplina;
import com.edulytics.backend_spring.disciplinas.DisciplinaRepository;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurma;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurmaRepository;
import com.edulytics.backend_spring.professores.Professor;
import com.edulytics.backend_spring.professores.ProfessorRepository;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;
    private final DisciplinaTurmaRepository disciplinaTurmaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final TurmaRepository turmaRepository;
    private final AuditoriaService auditoriaService;
    private final ObjectMapper objectMapper;

    public ComentarioService(
        ComentarioRepository comentarioRepository,
        AlunoRepository alunoRepository,
        ProfessorRepository professorRepository,
        DisciplinaTurmaRepository disciplinaTurmaRepository,
        DisciplinaRepository disciplinaRepository,
        TurmaRepository turmaRepository,
        AuditoriaService auditoriaService,
        ObjectMapper objectMapper
    ) {
        this.comentarioRepository = comentarioRepository;
        this.alunoRepository = alunoRepository;
        this.professorRepository = professorRepository;
        this.disciplinaTurmaRepository = disciplinaTurmaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.turmaRepository = turmaRepository;
        this.auditoriaService = auditoriaService;
        this.objectMapper = objectMapper;
    }

    public PageResponse<ComentarioDTO> listar(
        AuthenticatedUser user,
        Long alunoId,
        Long professorId,
        Long disciplinaTurmaId,
        String tipo,
        String classificacao,
        int page,
        int size
    ) {
        boolean isAluno = user != null && "Aluno".equalsIgnoreCase(user.cargo());
        List<ComentarioDTO> list = comentarioRepository.findAll().stream()
            .filter(c -> !isAluno || (Objects.equals(c.getAlunoId(), user.perfilId()) && c.isVisivelAluno()))
            .filter(c -> alunoId == null || Objects.equals(c.getAlunoId(), alunoId))
            .filter(c -> professorId == null || Objects.equals(c.getProfessorId(), professorId))
            .filter(c -> disciplinaTurmaId == null || Objects.equals(c.getDisciplinaTurmaId(), disciplinaTurmaId))
            .filter(c -> tipo == null || tipo.isBlank() || c.getTipo().equalsIgnoreCase(tipo))
            .filter(c -> classificacao == null || classificacao.isBlank() || c.getClassificacao().equalsIgnoreCase(classificacao))
            .sorted(Comparator.comparing(Comentario::getDataComentario).reversed())
            .map(this::toDTO)
            .toList();
        return AcademicoService.paginateList(list, page, size);
    }

    @Transactional
    public ComentarioDTO criar(ComentarioRequest req, AuthenticatedUser user) {
        if (!alunoRepository.existsById(req.alunoId())) {
            throw new ResourceNotFoundException("Aluno " + req.alunoId() + " não encontrado.");
        }
        Long profId = user.perfilId() != null ? user.perfilId() : 1L;
        Comentario com = new Comentario(
            req.alunoId(),
            profId,
            req.disciplinaTurmaId(),
            req.titulo(),
            req.tipo(),
            req.classificacao(),
            req.descricao(),
            serializeList(req.checklistItens()),
            req.acaoAcompanhamento(),
            req.visivelAluno(),
            Instant.now()
        );
        Comentario salvo = comentarioRepository.save(com);
        ComentarioDTO dto = toDTO(salvo);
        auditoriaService.registrar("comentario", "CREATE", null, dto);
        return dto;
    }

    @Transactional
    public ComentarioDTO atualizar(Long id, ComentarioUpdateRequest req) {
        Comentario com = comentarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comentário " + id + " não encontrado."));
        ComentarioDTO anterior = toDTO(com);
        com.atualizar(
            req.titulo(),
            req.tipo(),
            req.classificacao(),
            req.descricao(),
            req.checklistItens() != null ? serializeList(req.checklistItens()) : null,
            req.acaoAcompanhamento(),
            req.visivelAluno()
        );
        Comentario salvo = comentarioRepository.save(com);
        ComentarioDTO dto = toDTO(salvo);
        auditoriaService.registrar("comentario", "UPDATE", anterior, dto);
        return dto;
    }

    @Transactional
    public void excluir(Long id) {
        Comentario comentario = comentarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comentário " + id + " não encontrado."));
        ComentarioDTO anterior = toDTO(comentario);
        comentarioRepository.delete(comentario);
        auditoriaService.registrar("comentario", "DELETE", anterior, null);
    }

    public ComentarioDTO toDTO(Comentario c) {
        String alunoNome = alunoRepository.findById(c.getAlunoId()).map(Aluno::getNomeCompleto).orElse("");
        String profNome = professorRepository.findById(c.getProfessorId()).map(Professor::getNomeCompleto).orElse("");
        DisciplinaTurma dt = c.getDisciplinaTurmaId() != null
            ? disciplinaTurmaRepository.findById(c.getDisciplinaTurmaId()).orElse(null)
            : null;
        Disciplina disc = dt != null ? disciplinaRepository.findById(dt.getDisciplinaId()).orElse(null) : null;
        Turma turma = dt != null ? turmaRepository.findById(dt.getTurmaId()).orElse(null) : null;
        return new ComentarioDTO(
            c.getId(),
            c.getAlunoId(),
            c.getProfessorId(),
            c.getDisciplinaTurmaId(),
            c.getTitulo(),
            c.getTipo(),
            c.getClassificacao(),
            c.getDescricao(),
            deserializeList(c.getChecklistItens()),
            c.getAcaoAcompanhamento(),
            c.isVisivelAluno(),
            c.getDataComentario(),
            alunoNome,
            profNome,
            disc != null ? disc.getNome() : "Geral",
            turma != null ? turma.getNomeTurma() : ""
        );
    }

    private String serializeList(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list != null ? list : List.of());
        } catch (Exception ex) {
            return "[]";
        }
    }

    private List<String> deserializeList(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }
}
