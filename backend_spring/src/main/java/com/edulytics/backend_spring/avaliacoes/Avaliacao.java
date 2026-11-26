package com.edulytics.backend_spring.avaliacoes;

import com.edulytics.backend_spring.common.exception.DomainRuleException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "avaliacao")
public class Avaliacao {

    public enum Status {
        PLANEJADA,
        ABERTA,
        APLICADA,
        CORRIGIDA,
        CANCELADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disciplina_turma_id", nullable = false)
    private Long disciplinaTurmaId;

    @Column(name = "professor_id", nullable = false)
    private Long professorId = 1L;

    @Column(name = "periodo_id", nullable = false)
    private Long periodoId = 1L;

    @Column(name = "nome_avaliacao", nullable = false, length = 150)
    private String nomeAvaliacao;

    @Column(name = "tipo_avaliacao", nullable = false, length = 30)
    private String tipoAvaliacao = "PROVA";

    @Column(length = 1000)
    private String descricao;

    @Column(name = "data_avaliacao", nullable = false)
    private LocalDate dataAvaliacao;

    @Column(name = "valor_total", nullable = false, precision = 5, scale = 2)
    private BigDecimal valorTotal;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal peso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ABERTA;

    protected Avaliacao() {
    }

    public Avaliacao(
        Long disciplinaTurmaId,
        String nomeAvaliacao,
        LocalDate dataAvaliacao,
        BigDecimal valorTotal,
        BigDecimal peso
    ) {
        this(disciplinaTurmaId, 1L, 1L, nomeAvaliacao, "PROVA", "", dataAvaliacao, valorTotal, peso, Status.ABERTA);
    }

    public Avaliacao(
        Long disciplinaTurmaId,
        Long professorId,
        Long periodoId,
        String nomeAvaliacao,
        String tipoAvaliacao,
        String descricao,
        LocalDate dataAvaliacao,
        BigDecimal valorTotal,
        BigDecimal peso,
        Status status
    ) {
        if (nomeAvaliacao == null || nomeAvaliacao.trim().isEmpty()) {
            throw new DomainRuleException("Nome obrigatório", "A avaliação deve possuir um nome.");
        }
        if (valorTotal == null || valorTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new DomainRuleException("Valor total inválido", "O valor total da avaliação deve ser positivo.");
        }
        if (peso == null || peso.compareTo(BigDecimal.ZERO) <= 0) {
            throw new DomainRuleException("Peso inválido", "O peso da avaliação deve ser positivo.");
        }
        this.disciplinaTurmaId = disciplinaTurmaId;
        this.professorId = professorId != null ? professorId : 1L;
        this.periodoId = periodoId != null ? periodoId : 1L;
        this.nomeAvaliacao = nomeAvaliacao.trim();
        this.tipoAvaliacao = tipoAvaliacao != null && !tipoAvaliacao.isBlank() ? tipoAvaliacao.trim().toUpperCase() : "PROVA";
        this.descricao = descricao != null ? descricao : "";
        this.dataAvaliacao = dataAvaliacao;
        this.valorTotal = valorTotal;
        this.peso = peso;
        this.status = status != null ? status : Status.ABERTA;
    }

    public void atualizar(
        String nomeAvaliacao,
        String tipoAvaliacao,
        String descricao,
        LocalDate dataAvaliacao,
        BigDecimal valorTotal,
        BigDecimal peso,
        Status novoStatus
    ) {
        BigDecimal vt = valorTotal != null ? valorTotal : this.valorTotal;
        BigDecimal ps = peso != null ? peso : this.peso;
        if (vt.compareTo(BigDecimal.ZERO) <= 0 || ps.compareTo(BigDecimal.ZERO) <= 0) {
            throw new DomainRuleException("Valores inválidos", "Valor total e peso devem ser maiores que zero.");
        }
        if (nomeAvaliacao != null && !nomeAvaliacao.trim().isEmpty()) {
            this.nomeAvaliacao = nomeAvaliacao.trim();
        }
        if (tipoAvaliacao != null && !tipoAvaliacao.isBlank()) {
            this.tipoAvaliacao = tipoAvaliacao.trim().toUpperCase();
        }
        if (descricao != null) this.descricao = descricao;
        if (dataAvaliacao != null) this.dataAvaliacao = dataAvaliacao;
        this.valorTotal = vt;
        this.peso = ps;
        if (novoStatus != null) this.status = novoStatus;
    }

    public void corrigir() {
        if (this.status == Status.CANCELADA) {
            throw new DomainRuleException("Transição inválida", "Avaliação cancelada não pode ser corrigida.");
        }
        if (this.status == Status.CORRIGIDA) {
            throw new DomainRuleException("Avaliação já corrigida", "A avaliação já foi encerrada como corrigida.");
        }
        this.status = Status.CORRIGIDA;
    }

    public void cancelar() {
        if (this.status == Status.CORRIGIDA) {
            throw new DomainRuleException("Transição inválida", "Avaliação corrigida não pode ser cancelada.");
        }
        this.status = Status.CANCELADA;
    }

    public void validarNota(BigDecimal nota) {
        if (nota == null || nota.compareTo(BigDecimal.ZERO) < 0 || nota.compareTo(this.valorTotal) > 0) {
            throw new DomainRuleException(
                "Nota fora do intervalo",
                "A nota deve estar entre 0 e " + this.valorTotal + "."
            );
        }
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

    public Long getPeriodoId() {
        return periodoId;
    }

    public String getNomeAvaliacao() {
        return nomeAvaliacao;
    }

    public String getTipoAvaliacao() {
        return tipoAvaliacao;
    }

    public String getDescricao() {
        return descricao;
    }

    public LocalDate getDataAvaliacao() {
        return dataAvaliacao;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public BigDecimal getPeso() {
        return peso;
    }

    public Status getStatus() {
        return status;
    }
}
