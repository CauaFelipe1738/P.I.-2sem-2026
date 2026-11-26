package com.edulytics.backend_spring.domain;

import com.edulytics.backend_spring.aulas.Aula;
import com.edulytics.backend_spring.avaliacoes.Avaliacao;
import com.edulytics.backend_spring.common.exception.DomainRuleException;
import com.edulytics.backend_spring.matriculas.Matricula;
import com.edulytics.backend_spring.usuarios.Usuario;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class DomainRulesTest {

    @Test
    void usuarioRegistrarAcessoRespeitaMatrizUsu() {
        Instant criacao = Instant.parse("2026-02-01T10:00:00Z");
        Instant primeiroAcesso = Instant.parse("2026-03-01T12:00:00Z");
        Instant segundoAcesso = Instant.parse("2026-03-02T14:00:00Z");

        Usuario ativo = new Usuario("ana@exemplo.com", "hash", "Ana", "Professor", 1L, true, criacao);
        assertNull(ativo.getUltimoAcesso());

        // USU-001, USU-004, USU-005
        ativo.registrarAcesso(primeiroAcesso);
        assertEquals(primeiroAcesso, ativo.getUltimoAcesso());
        assertEquals(criacao, ativo.getDataCriacao());
        assertTrue(ativo.isAtivo());

        // USU-002
        ativo.registrarAcesso(segundoAcesso);
        assertEquals(segundoAcesso, ativo.getUltimoAcesso());

        // USU-003
        Usuario inativo = new Usuario("inativo@exemplo.com", "hash", "Inativo", "Aluno", 2L, false, criacao);
        assertThrows(DomainRuleException.class, () -> inativo.registrarAcesso(primeiroAcesso));
    }

    @Test
    void matriculaRespeitaTransicoesMatrizAlu() {
        LocalDate entrada = LocalDate.of(2026, 2, 2);
        LocalDate desligamento = LocalDate.of(2026, 6, 15);

        // ALU-001, ALU-009
        Matricula mConcluir = new Matricula(1L, 1L, entrada);
        mConcluir.concluir();
        assertEquals(Matricula.Status.CONCLUIDA, mConcluir.getStatus());
        assertEquals(1L, mConcluir.getAlunoId());
        assertEquals(entrada, mConcluir.getDataMatricula());
        // ALU-005
        assertThrows(DomainRuleException.class, () -> mConcluir.cancelar(desligamento));

        // ALU-002, ALU-010
        Matricula mCancelar = new Matricula(2L, 1L, entrada);
        mCancelar.cancelar(desligamento);
        assertEquals(Matricula.Status.CANCELADA, mCancelar.getStatus());
        assertEquals(desligamento, mCancelar.getDataDesligamento());
        // ALU-004, ALU-006
        assertThrows(DomainRuleException.class, mCancelar::concluir);
        assertThrows(DomainRuleException.class, mCancelar::trancar);

        // ALU-003, ALU-007, ALU-008
        Matricula mTrancar = new Matricula(3L, 1L, entrada);
        mTrancar.trancar();
        assertEquals(Matricula.Status.TRANCADA, mTrancar.getStatus());
        assertThrows(DomainRuleException.class, mTrancar::concluir);
        assertDoesNotThrow(() -> mTrancar.cancelar(desligamento));
        assertEquals(Matricula.Status.CANCELADA, mTrancar.getStatus());
    }

    @Test
    void aulaRespeitaRegrasMatrizAul() {
        LocalDate data = LocalDate.of(2026, 5, 20);
        LocalTime inicio = LocalTime.of(19, 0);
        LocalTime fim = LocalTime.of(20, 40);

        // AUL-008
        assertThrows(DomainRuleException.class, () -> new Aula(1L, 1L, data, fim, inicio, "Inválida"));

        // AUL-007
        Aula semConteudo = new Aula(1L, 1L, data, inicio, fim, "   ");
        assertThrows(DomainRuleException.class, () -> semConteudo.realizar(null));

        // AUL-001, AUL-004, AUL-005
        Aula aula = new Aula(1L, 1L, data, inicio, fim, "JPA");
        aula.realizar("JPA e Spring Security");
        assertEquals(Aula.Status.REALIZADA, aula.getStatus());
        assertEquals(data, aula.getDataAula());
        assertEquals(inicio, aula.getHorarioInicio());
        assertEquals(fim, aula.getHorarioFim());
        assertThrows(DomainRuleException.class, aula::cancelar);

        // AUL-002, AUL-003, AUL-006
        Aula cancelada = new Aula(1L, 1L, data, inicio, fim, "Conteúdo preservado");
        cancelada.cancelar();
        assertEquals(Aula.Status.CANCELADA, cancelada.getStatus());
        assertEquals("Conteúdo preservado", cancelada.getConteudo());
        assertThrows(DomainRuleException.class, () -> cancelada.realizar("Tentativa"));
    }

    @Test
    void avaliacaoRespeitaRegrasMatrizAva() {
        LocalDate data = LocalDate.of(2026, 6, 10);

        // AVA-005, AVA-006, AVA-009
        assertThrows(DomainRuleException.class, () -> new Avaliacao(1L, " ", data, BigDecimal.TEN, BigDecimal.ONE));
        assertThrows(DomainRuleException.class, () -> new Avaliacao(1L, "Prova", data, new BigDecimal("-1.00"), BigDecimal.ONE));
        assertThrows(DomainRuleException.class, () -> new Avaliacao(1L, "Prova", data, BigDecimal.TEN, new BigDecimal("-0.50")));

        // AVA-001, AVA-002, AVA-004, AVA-007, AVA-008, AVA-010
        Avaliacao av = new Avaliacao(1L, "Prova 1", data, new BigDecimal("10.00"), new BigDecimal("2.00"));
        assertDoesNotThrow(() -> av.validarNota(new BigDecimal("9.50")));
        assertThrows(DomainRuleException.class, () -> av.validarNota(new BigDecimal("10.50")));
        assertThrows(DomainRuleException.class, () -> av.validarNota(new BigDecimal("-0.10")));

        av.corrigir();
        assertEquals(Avaliacao.Status.CORRIGIDA, av.getStatus());
        assertEquals("Prova 1", av.getNomeAvaliacao());
        assertEquals(new BigDecimal("10.00"), av.getValorTotal());
        assertThrows(DomainRuleException.class, av::corrigir);

        // AVA-003
        Avaliacao cancelada = new Avaliacao(1L, "Trabalho", data, BigDecimal.TEN, BigDecimal.ONE);
        cancelada.cancelar();
        assertThrows(DomainRuleException.class, cancelada::corrigir);
    }
}
