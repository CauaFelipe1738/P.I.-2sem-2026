package com.edulytics.backend_spring.integration;

import com.edulytics.backend_spring.auditoria.AuditoriaRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    private String login(String email, String senha) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"" + senha + "\"}"))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken")
            .asText();
    }

    @Test
    void actuatorHealthRespondeUpSemAutenticacao() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void autenticacaoJwtERbacProtegemRotasAlunos() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana@exemplo.com\",\"senha\":\"errada\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"inativo@exemplo.com\",\"senha\":\"123456\"}"))
            .andExpect(status().isUnprocessableEntity());

        String profToken = login("ana@exemplo.com", "123456");

        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("ana@exemplo.com"));

        mockMvc.perform(get("/api/v1/alunos")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(4))
            .andExpect(jsonPath("$.content[0].nomeCompleto").exists());

        String alunoToken = login("carla@exemplo.com", "123456");

        mockMvc.perform(get("/api/v1/alunos")
                .header("Authorization", "Bearer " + alunoToken))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/indicadores/desempenho")
                .header("Authorization", "Bearer " + alunoToken))
            .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void fluxoCompletoAcademicoFrequenciaAvaliacaoLgpdEAuditoria() throws Exception {
        String profToken = login("ana@exemplo.com", "123456");
        String alunoToken = login("carla@exemplo.com", "123456");

        // Catálogo acadêmico
        MvcResult cursosRes = mockMvc.perform(get("/api/v1/cursos?somenteMeus=true")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].nome").exists())
            .andReturn();
        long cursoId = objectMapper.readTree(cursosRes.getResponse().getContentAsString())
            .get("content").get(0).get("id").asLong();

        MvcResult turmasRes = mockMvc.perform(get("/api/v1/cursos/" + cursoId + "/turmas")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andReturn();
        long turmaId = objectMapper.readTree(turmasRes.getResponse().getContentAsString()).get(0).get("id").asLong();

        MvcResult discRes = mockMvc.perform(get("/api/v1/turmas/" + turmaId + "/disciplinas")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andReturn();
        long dtId = objectMapper.readTree(discRes.getResponse().getContentAsString())
            .get(0).get("disciplinaTurmaId").asLong();

        mockMvc.perform(get("/api/v1/turmas/" + turmaId + "/alunos")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].alunoId").exists());

        // Aulas + Frequência (422 horário, 201 aula, 409 duplicado, 201 lote, 200 update)
        mockMvc.perform(post("/api/v1/aulas")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"disciplinaTurmaId\":" + dtId + ",\"dataAula\":\"2026-06-12\",\"horarioInicio\":\"21:00\",\"horarioFim\":\"19:00\"}"))
            .andExpect(status().isUnprocessableEntity());

        MvcResult aulaRes = mockMvc.perform(post("/api/v1/aulas")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"disciplinaTurmaId\":" + dtId + ",\"dataAula\":\"2026-06-12\",\"horarioInicio\":\"19:00\",\"horarioFim\":\"20:40\",\"conteudo\":\"Flyway e JPA\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        long aulaId = objectMapper.readTree(aulaRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/v1/aulas/" + aulaId + "/realizar")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"conteudo\":\"Flyway V1/V2 validado\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REALIZADA"));

        mockMvc.perform(post("/api/v1/aulas/" + aulaId + "/frequencias")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"itens\":[{\"alunoId\":1,\"statusPresenca\":\"PRESENTE\"},{\"alunoId\":1,\"statusPresenca\":\"ATRASO\"}]}"))
            .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/aulas/" + aulaId + "/frequencias")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"itens\":[{\"alunoId\":1,\"statusPresenca\":\"PRESENTE\",\"checklistAula\":[\"Participou da aula\"]},{\"alunoId\":2,\"statusPresenca\":\"ATRASO\"}]}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$[1].presente").value(true));

        // Avaliação + Nota (422 nota > valorTotal, 200 nota válida, 200 corrigir)
        MvcResult avRes = mockMvc.perform(post("/api/v1/avaliacoes")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"disciplinaTurmaId\":" + dtId + ",\"periodoId\":1,\"nomeAvaliacao\":\"Prova MockMvc\",\"tipoAvaliacao\":\"PROVA\",\"dataAvaliacao\":\"2026-06-20\",\"valorTotal\":10,\"peso\":2}"))
            .andExpect(status().isCreated())
            .andReturn();
        long avId = objectMapper.readTree(avRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(put("/api/v1/avaliacoes/" + avId + "/notas/1")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nota\":11.0}"))
            .andExpect(status().isUnprocessableEntity());

        mockMvc.perform(put("/api/v1/avaliacoes/" + avId + "/notas/1")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nota\":9.5,\"observacao\":\"Excelente\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nota").value(9.5));

        mockMvc.perform(patch("/api/v1/avaliacoes/" + avId + "/corrigir")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CORRIGIDA"));

        // Comentário LGPD (visivelAluno=false não pode aparecer em /me/desempenho) e Plano (422 prazo)
        mockMvc.perform(post("/api/v1/comentarios")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"alunoId\":1,\"disciplinaTurmaId\":" + dtId + ",\"titulo\":\"Privado MockMvc\",\"tipo\":\"SAUDE\",\"classificacao\":\"NEUTRO\",\"descricao\":\"Sigilo docente\",\"visivelAluno\":false}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.visivelAluno").value(false));

        mockMvc.perform(post("/api/v1/planos-acompanhamento")
                .header("Authorization", "Bearer " + profToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"alunoId\":1,\"dificuldade\":\"X\",\"objetivo\":\"Y\",\"acaoProposta\":\"Z\",\"dataInicio\":\"2026-06-10\",\"prazo\":\"2026-06-01\"}"))
            .andExpect(status().isUnprocessableEntity());

        // Indicadores (corte 75%) e Relatório
        mockMvc.perform(get("/api/v1/indicadores/desempenho?cursoId=" + cursoId)
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.limitePresencaPercentual").value(75))
            .andExpect(jsonPath("$.mediaNotasPonderada").isNumber());

        mockMvc.perform(get("/api/v1/relatorios/academico?cursoId=" + cursoId)
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.emitidoEm").exists())
            .andExpect(jsonPath("$.indicadores.limitePresencaPercentual").value(75));

        // Painel do Aluno (/me/desempenho) respeita visivelAluno=true
        MvcResult meRes = mockMvc.perform(get("/api/v1/me/desempenho")
                .header("Authorization", "Bearer " + alunoToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aluno.nomeCompleto").value("Carla Souza"))
            .andReturn();

        JsonNode comentariosAluno = objectMapper.readTree(meRes.getResponse().getContentAsString()).get("comentarios");
        for (JsonNode c : comentariosAluno) {
            assertFalse("Privado MockMvc".equals(c.get("titulo").asText()));
        }

        assertFalse(auditoriaRepository.findAll().isEmpty());
    }
}
