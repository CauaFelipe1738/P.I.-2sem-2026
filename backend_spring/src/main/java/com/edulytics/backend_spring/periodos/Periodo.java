package com.edulytics.backend_spring.periodos;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "periodo")
public class Periodo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_periodo", nullable = false, length = 80)
    private String nomePeriodo;

    @Column(name = "ano_letivo", nullable = false)
    private Integer anoLetivo;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    protected Periodo() {
    }

    public Periodo(String nomePeriodo, Integer anoLetivo, LocalDate dataInicio, LocalDate dataFim) {
        this.nomePeriodo = nomePeriodo;
        this.anoLetivo = anoLetivo;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
    }

    public Long getId() {
        return id;
    }

    public String getNomePeriodo() {
        return nomePeriodo;
    }

    public Integer getAnoLetivo() {
        return anoLetivo;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public LocalDate getDataFim() {
        return dataFim;
    }
}
