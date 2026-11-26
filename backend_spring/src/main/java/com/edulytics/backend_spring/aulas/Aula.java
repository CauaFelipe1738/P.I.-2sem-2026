package com.edulytics.backend_spring.aulas;

import com.edulytics.backend_spring.common.exception.DomainRuleException;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "aula")
public class Aula {

    public enum Status {
        PLANEJADA,
        REALIZADA,
        CANCELADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disciplina_turma_id", nullable = false)
    private Long disciplinaTurmaId;

    @Column(name = "professor_id", nullable = false)
    private Long professorId;

    @Column(name = "data_aula", nullable = false)
    private LocalDate dataAula;

    @Column(name = "horario_inicio", nullable = false)
    private LocalTime horarioInicio;

    @Column(name = "horario_fim", nullable = false)
    private LocalTime horarioFim;

    @Column(length = 1000)
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PLANEJADA;

    protected Aula() {
    }

    public Aula(
        Long disciplinaTurmaId,
        Long professorId,
        LocalDate dataAula,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        String conteudo
    ) {
        if (horarioInicio != null && horarioFim != null && !horarioFim.isAfter(horarioInicio)) {
            throw new DomainRuleException("Horário inválido", "O horário final deve ser posterior ao horário inicial.");
        }
        this.disciplinaTurmaId = disciplinaTurmaId;
        this.professorId = professorId;
        this.dataAula = dataAula;
        this.horarioInicio = horarioInicio;
        this.horarioFim = horarioFim;
        this.conteudo = conteudo;
        this.status = Status.PLANEJADA;
    }

    public void atualizar(
        LocalDate dataAula,
        LocalTime horarioInicio,
        LocalTime horarioFim,
        String conteudo,
        Status novoStatus
    ) {
        LocalTime ini = horarioInicio != null ? horarioInicio : this.horarioInicio;
        LocalTime fim = horarioFim != null ? horarioFim : this.horarioFim;
        if (ini != null && fim != null && !fim.isAfter(ini)) {
            throw new DomainRuleException("Horário inválido", "O horário final deve ser posterior ao horário inicial.");
        }
        if (dataAula != null) this.dataAula = dataAula;
        this.horarioInicio = ini;
        this.horarioFim = fim;
        if (conteudo != null) this.conteudo = conteudo;
        if (novoStatus != null) this.status = novoStatus;
    }

    public void realizar(String novoConteudo) {
        if (this.status == Status.CANCELADA) {
            throw new DomainRuleException("Transição inválida", "Aula cancelada não pode ser realizada.");
        }
        String efetivo = novoConteudo != null ? novoConteudo.trim() : (this.conteudo != null ? this.conteudo.trim() : "");
        if (efetivo.isEmpty()) {
            throw new DomainRuleException("Conteúdo obrigatório", "Informe o conteúdo ministrado ao realizar a aula.");
        }
        this.conteudo = efetivo;
        this.status = Status.REALIZADA;
    }

    public void cancelar() {
        if (this.status == Status.REALIZADA) {
            throw new DomainRuleException("Transição inválida", "Aula já realizada não pode ser cancelada.");
        }
        this.status = Status.CANCELADA;
    }

    public Long getId() {
        return id;
    }

    public Long getDisciplinaTurmaId() {
        return disciplinaTurmaId;
    }

    public Long getProfessorId() {
        return professorId;
    }

    public LocalDate getDataAula() {
        return dataAula;
    }

    public LocalTime getHorarioInicio() {
        return horarioInicio;
    }

    public LocalTime getHorarioFim() {
        return horarioFim;
    }

    public String getConteudo() {
        return conteudo;
    }

    public Status getStatus() {
        return status;
    }
}
