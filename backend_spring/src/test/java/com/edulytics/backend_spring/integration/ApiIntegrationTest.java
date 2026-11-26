package com.edulytics.backend_spring.integration;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Test
    void actuatorHealthRespondeUpSemAutenticacao() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void autenticacaoJwtERbacProtegemRotasAlunos() throws Exception {
        // Login inválido -> 401
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana@exemplo.com\",\"senha\":\"errada\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));

        // Login inativo -> 422
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"inativo@exemplo.com\",\"senha\":\"123456\"}"))
            .andExpect(status().isUnprocessableEntity());

        // Login Professor -> 200 com JWT
        MvcResult profLogin = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ana@exemplo.com\",\"senha\":\"123456\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.usuario.cargo").value("Professor"))
            .andReturn();

        JsonNode profJson = objectMapper.readTree(profLogin.getResponse().getContentAsString());
        String profToken = profJson.get("accessToken").asText();

        // /auth/me autenticado
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("ana@exemplo.com"));

        // Professor acessa /api/v1/alunos paginado
        mockMvc.perform(get("/api/v1/alunos")
                .header("Authorization", "Bearer " + profToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(3))
            .andExpect(jsonPath("$.content[0].nomeCompleto").exists());

        // Login Aluno -> 403 ao tentar acessar /api/v1/alunos
        MvcResult alunoLogin = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"carla@exemplo.com\",\"senha\":\"123456\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.usuario.cargo").value("Aluno"))
            .andReturn();

        String alunoToken = objectMapper.readTree(alunoLogin.getResponse().getContentAsString())
            .get("accessToken")
            .asText();

        mockMvc.perform(get("/api/v1/alunos")
                .header("Authorization", "Bearer " + alunoToken))
            .andExpect(status().isForbidden());

        // Sem token -> 401
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized());
    }
}
