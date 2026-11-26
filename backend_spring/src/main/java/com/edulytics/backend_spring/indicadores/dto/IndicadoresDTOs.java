package com.edulytics.backend_spring.indicadores.dto;

import com.edulytics.backend_spring.alunos.dto.AlunoResponseDTO;
import com.edulytics.backend_spring.comentarios.dto.ComentarioDTOs.ComentarioDTO;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class IndicadoresDTOs {
    private IndicadoresDTOs() {}

    public record AlertaAlunoDTO(
        Long alunoId,
        String alunoNome,
        Integer taxaFrequencia,
        int dificuldadesRegistradas
    ) {}

    public record IndicadoresDesempenhoDTO(
        Integer taxaFrequenciaMedia,
        Integer percentualAbaixoLimite,
        int limitePresencaPercentual,
        Double mediaNotasPonderada,
        int totalAulasRegistradas,
        int totalAlunosAvaliados,
        int totalComentarios,
        Map<String, Integer> comentariosPorTipo,
        List<AlertaAlunoDTO> alertas
    ) {}

    public record FrequenciaRelatorioDTO(
        Long id,
        Long aulaId,
        Long alunoId,
        String alunoNome,
        String statusPresenca,
        boolean presente,
        String justificativa,
        LocalDate dataAula,
        String conteudo,
        String disciplinaNome,
        String turmaNome
    ) {}

    public record NotaRelatorioDTO(
        Long id,
        Long avaliacaoId,
        Long alunoId,
        String alunoNome,
        String avaliacaoNome,
        String tipoAvaliacao,
        LocalDate dataAvaliacao,
        BigDecimal nota,
        BigDecimal valorTotal,
        BigDecimal peso,
        String observacao,
        String disciplinaNome,
        String turmaNome
    ) {}

    public record RelatorioAcademicoDTO(
        IndicadoresDesempenhoDTO indicadores,
        List<FrequenciaRelatorioDTO> frequencias,
        List<NotaRelatorioDTO> notas,
        List<ComentarioDTO> comentarios,
        Instant emitidoEm
    ) {}

    public record MatriculaResumoAlunoDTO(
        Long id,
        String status,
        String turmaNome,
        String cursoNome,
        String periodoNome
    ) {}

    public record MeuDesempenhoDTO(
        AlunoResponseDTO aluno,
        List<MatriculaResumoAlunoDTO> matriculas,
        Integer taxaFrequencia,
        Double mediaPonderada,
        long totalFaltas,
        long totalAtrasos,
        List<FrequenciaRelatorioDTO> frequencias,
        List<NotaRelatorioDTO> notas,
        List<ComentarioDTO> comentarios
    ) {}
}
