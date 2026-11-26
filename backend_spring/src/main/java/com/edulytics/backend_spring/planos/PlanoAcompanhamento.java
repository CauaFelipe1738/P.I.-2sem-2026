package com.edulytics.backend_spring.planos;

import com.edulytics.backend_spring.common.exception.DomainRuleException;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "plano_acompanhamento")
public class PlanoAcompanhamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(name = "professor_id", nullable = false)
    private Long professorId;

    @Column(name = "disciplina_turma_id")
    private Long disciplinaTurmaId;

    @Column(nullable = false, length = 500)
    private String dificuldade;

    @Column(nullable = false, length = 500)
    private String objetivo;

    @Column(name = "acao_proposta", nullable = false, length = 1000)
    private String acaoProposta;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(nullable = false)
    private LocalDate prazo;

    @Column(nullable = false, length = 30)
    private String status = "PENDENTE";

    @Column(length = 1000)
    private String resultado;

    protected PlanoAcompanhamento() {
    }

    public PlanoAcompanhamento(
        Long alunoId,
        Long professorId,
        Long disciplinaTurmaId,
        String dificuldade,
        String objetivo,
        String acaoProposta,
        LocalDate dataInicio,
        LocalDate prazo,
        String status,
        String resultado
    ) {
        validarDatas(dataInicio, prazo);
        this.alunoId = alunoId;
        this.professorId = professorId;
        this.disciplinaTurmaId = disciplinaTurmaId;
        this.dificuldade = dificuldade;
        this.objetivo = objetivo;
        this.acaoProposta = acaoProposta;
        this.dataInicio = dataInicio;
        this.prazo = prazo;
        this.status = status != null && !status.isBlank() ? status.trim().toUpperCase() : "PENDENTE";
        this.resultado = resultado != null ? resultado : "";
    }

    public void atualizar(
        String dificuldade,
        String objetivo,
        String acaoProposta,
        LocalDate dataInicio,
        LocalDate prazo,
        String status,
        String resultado
    ) {
        LocalDate ini = dataInicio != null ? dataInicio : this.dataInicio;
        LocalDate prz = prazo != null ? prazo : this.prazo;
        validarDatas(ini, prz);
        if (dificuldade != null) this.dificuldade = dificuldade;
        if (objetivo != null) this.objetivo = objetivo;
        if (acaoProposta != null) this.acaoProposta = acaoProposta;
        this.dataInicio = ini;
        this.prazo = prz;
        if (status != null && !status.isBlank()) this.status = status.trim().toUpperCase();
        if (resultado != null) this.resultado = resultado;
    }

    private static void validarDatas(LocalDate inicio, LocalDate prazo) {
        if (inicio != null && prazo != null && prazo.isBefore(inicio)) {
            throw new DomainRuleException("Prazo inválido", "O prazo deve ser igual ou posterior à data de início.");
        }
    }

    public Long getId() {
        return id;
    }

    public Long getAlunoId() {
        return alunoId;
    }

    public Long getProfessorId() {
        return professorId;
    }

    public Long getDisciplinaTurmaId() {
        return disciplinaTurmaId;
    }

    public String getDificuldade() {
        return dificuldade;
    }

    public String getObjetivo() {
        return objetivo;
    }

    public String getAcaoProposta() {
        return acaoProposta;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public LocalDate getPrazo() {
        return prazo;
    }

    public String getStatus() {
        return status;
    }

    public String getResultado() {
        return resultado;
    }
}
