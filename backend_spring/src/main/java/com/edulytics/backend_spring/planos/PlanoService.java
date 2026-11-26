package com.edulytics.backend_spring.planos;

import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.auditoria.AuditoriaService;
import com.edulytics.backend_spring.common.exception.ResourceNotFoundException;
import com.edulytics.backend_spring.planos.dto.PlanoDTOs.*;
import com.edulytics.backend_spring.security.AuthenticatedUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
public class PlanoService {

    private final PlanoRepository planoRepository;
    private final AlunoRepository alunoRepository;
    private final AuditoriaService auditoriaService;

    public PlanoService(
        PlanoRepository planoRepository,
        AlunoRepository alunoRepository,
        AuditoriaService auditoriaService
    ) {
        this.planoRepository = planoRepository;
        this.alunoRepository = alunoRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<PlanoDTO> listar(Long alunoId, Long disciplinaTurmaId) {
        return planoRepository.findAll().stream()
            .filter(p -> alunoId == null || Objects.equals(p.getAlunoId(), alunoId))
            .filter(p -> disciplinaTurmaId == null || Objects.equals(p.getDisciplinaTurmaId(), disciplinaTurmaId))
            .map(this::toDTO)
            .toList();
    }

    @Transactional
    public PlanoDTO criar(PlanoRequest req, AuthenticatedUser user) {
        if (!alunoRepository.existsById(req.alunoId())) {
            throw new ResourceNotFoundException("Aluno " + req.alunoId() + " não encontrado.");
        }
        Long profId = user.perfilId() != null ? user.perfilId() : 1L;
        PlanoAcompanhamento plano = new PlanoAcompanhamento(
            req.alunoId(),
            profId,
            req.disciplinaTurmaId(),
            req.dificuldade(),
            req.objetivo(),
            req.acaoProposta(),
            req.dataInicio(),
            req.prazo(),
            req.status(),
            req.resultado()
        );
        PlanoAcompanhamento salvo = planoRepository.save(plano);
        PlanoDTO dto = toDTO(salvo);
        auditoriaService.registrar("plano_acompanhamento", "CREATE", null, dto);
        return dto;
    }

    @Transactional
    public PlanoDTO atualizar(Long id, PlanoUpdateRequest req) {
        PlanoAcompanhamento plano = planoRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Plano " + id + " não encontrado."));
        PlanoDTO anterior = toDTO(plano);
        plano.atualizar(
            req.dificuldade(),
            req.objetivo(),
            req.acaoProposta(),
            req.dataInicio(),
            req.prazo(),
            req.status(),
            req.resultado()
        );
        PlanoAcompanhamento salvo = planoRepository.save(plano);
        PlanoDTO dto = toDTO(salvo);
        auditoriaService.registrar("plano_acompanhamento", "UPDATE", anterior, dto);
        return dto;
    }

    private PlanoDTO toDTO(PlanoAcompanhamento p) {
        String alunoNome = alunoRepository.findById(p.getAlunoId()).map(Aluno::getNomeCompleto).orElse("");
        return new PlanoDTO(
            p.getId(),
            p.getAlunoId(),
            p.getProfessorId(),
            p.getDisciplinaTurmaId(),
            p.getDificuldade(),
            p.getObjetivo(),
            p.getAcaoProposta(),
            p.getDataInicio(),
            p.getPrazo(),
            p.getStatus(),
            p.getResultado(),
            alunoNome
        );
    }
}
