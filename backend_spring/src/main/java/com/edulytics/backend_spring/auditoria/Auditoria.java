package com.edulytics.backend_spring.auditoria;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "auditoria")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "tabela_modificada", nullable = false, length = 100)
    private String tabelaModificada;

    @Column(nullable = false, length = 30)
    private String operacao;

    @Column(name = "dados_anteriores", length = 4000)
    private String dadosAnteriores;

    @Column(name = "dados_novos", length = 4000)
    private String dadosNovos;

    @Column(name = "data_hora", nullable = false)
    private Instant dataHora;

    @Column(name = "endereco_ip", length = 45)
    private String enderecoIp;

    protected Auditoria() {
    }

    public Auditoria(
        Long idUsuario,
        String tabelaModificada,
        String operacao,
        String dadosAnteriores,
        String dadosNovos,
        String enderecoIp
    ) {
        this.idUsuario = idUsuario;
        this.tabelaModificada = tabelaModificada;
        this.operacao = operacao;
        this.dadosAnteriores = dadosAnteriores;
        this.dadosNovos = dadosNovos;
        this.dataHora = Instant.now();
        this.enderecoIp = enderecoIp;
    }

    public Long getId() {
        return id;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public String getTabelaModificada() {
        return tabelaModificada;
    }

    public String getOperacao() {
        return operacao;
    }

    public String getDadosAnteriores() {
        return dadosAnteriores;
    }

    public String getDadosNovos() {
        return dadosNovos;
    }

    public Instant getDataHora() {
        return dataHora;
    }

    public String getEnderecoIp() {
        return enderecoIp;
    }
}
