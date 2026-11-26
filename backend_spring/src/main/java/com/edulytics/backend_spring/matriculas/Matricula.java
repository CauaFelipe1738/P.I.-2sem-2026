package com.edulytics.backend_spring.matriculas;

import com.edulytics.backend_spring.common.exception.DomainRuleException;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "matricula")
public class Matricula {

    public enum Status {
        ATIVA,
        TRANCADA,
        CONCLUIDA,
        CANCELADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aluno_id", nullable = false)
    private Long alunoId;

    @Column(name = "turma_id", nullable = false)
    private Long turmaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ATIVA;

    @Column(name = "data_matricula", nullable = false)
    private LocalDate dataMatricula;

    @Column(name = "data_desligamento")
    private LocalDate dataDesligamento;

    protected Matricula() {
    }

    public Matricula(Long alunoId, Long turmaId, LocalDate dataMatricula) {
        this.alunoId = alunoId;
        this.turmaId = turmaId;
        this.dataMatricula = dataMatricula != null ? dataMatricula : LocalDate.now();
        this.status = Status.ATIVA;
    }

    public void concluir() {
        if (this.status == Status.CANCELADA || this.status == Status.TRANCADA) {
            throw new DomainRuleException("Transição inválida", "Matrícula " + this.status + " não pode ser concluída.");
        }
        this.status = Status.CONCLUIDA;
    }

    public void cancelar(LocalDate dataDesligamento) {
        if (this.status == Status.CONCLUIDA) {
            throw new DomainRuleException("Transição inválida", "Matrícula concluída não pode ser cancelada.");
        }
        this.status = Status.CANCELADA;
        this.dataDesligamento = dataDesligamento != null ? dataDesligamento : LocalDate.now();
    }

    public void trancar() {
        if (this.status == Status.CANCELADA || this.status == Status.CONCLUIDA) {
            throw new DomainRuleException("Transição inválida", "Matrícula " + this.status + " não pode ser trancada.");
        }
        this.status = Status.TRANCADA;
    }

    public Long getId() {
        return id;
    }

    public Long getAlunoId() {
        return alunoId;
    }

    public Long getTurmaId() {
        return turmaId;
    }

    public Status getStatus() {
        return status;
    }

    public LocalDate getDataMatricula() {
        return dataMatricula;
    }

    public LocalDate getDataDesligamento() {
        return dataDesligamento;
    }
}
