package com.edulytics.backend_spring.avaliacoes;

import com.edulytics.backend_spring.common.exception.DomainRuleException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "avaliacao")
public class Avaliacao {

    public enum Status {
        ABERTA,
        CORRIGIDA,
        CANCELADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "disciplina_turma_id", nullable = false)
    private Long disciplinaTurmaId;

    @Column(name = "nome_avaliacao", nullable = false, length = 150)
    private String nomeAvaliacao;

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
        this.nomeAvaliacao = nomeAvaliacao.trim();
        this.dataAvaliacao = dataAvaliacao;
        this.valorTotal = valorTotal;
        this.peso = peso;
        this.status = Status.ABERTA;
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

    public String getNomeAvaliacao() {
        return nomeAvaliacao;
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
