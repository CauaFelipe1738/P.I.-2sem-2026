package com.edulytics.backend_spring.common.config;

import com.edulytics.backend_spring.alunos.Aluno;
import com.edulytics.backend_spring.alunos.AlunoRepository;
import com.edulytics.backend_spring.aulas.Aula;
import com.edulytics.backend_spring.aulas.AulaRepository;
import com.edulytics.backend_spring.avaliacoes.AlunoAvaliacao;
import com.edulytics.backend_spring.avaliacoes.AlunoAvaliacaoRepository;
import com.edulytics.backend_spring.avaliacoes.Avaliacao;
import com.edulytics.backend_spring.avaliacoes.AvaliacaoRepository;
import com.edulytics.backend_spring.comentarios.Comentario;
import com.edulytics.backend_spring.comentarios.ComentarioRepository;
import com.edulytics.backend_spring.cursos.Curso;
import com.edulytics.backend_spring.cursos.CursoRepository;
import com.edulytics.backend_spring.disciplinas.Disciplina;
import com.edulytics.backend_spring.disciplinas.DisciplinaRepository;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurma;
import com.edulytics.backend_spring.disciplinas.DisciplinaTurmaRepository;
import com.edulytics.backend_spring.frequencias.Frequencia;
import com.edulytics.backend_spring.frequencias.FrequenciaRepository;
import com.edulytics.backend_spring.matriculas.Matricula;
import com.edulytics.backend_spring.matriculas.MatriculaRepository;
import com.edulytics.backend_spring.periodos.Periodo;
import com.edulytics.backend_spring.periodos.PeriodoRepository;
import com.edulytics.backend_spring.planos.PlanoAcompanhamento;
import com.edulytics.backend_spring.planos.PlanoRepository;
import com.edulytics.backend_spring.professores.Professor;
import com.edulytics.backend_spring.professores.ProfessorDisciplinaTurma;
import com.edulytics.backend_spring.professores.ProfessorDisciplinaTurmaRepository;
import com.edulytics.backend_spring.professores.ProfessorRepository;
import com.edulytics.backend_spring.turmas.Turma;
import com.edulytics.backend_spring.turmas.TurmaRepository;
import com.edulytics.backend_spring.usuarios.Usuario;
import com.edulytics.backend_spring.usuarios.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
@Profile("!prod")
public class DevSeedConfig {

    @Bean
    CommandLineRunner seedDevData(
        UsuarioRepository usuarioRepository,
        ProfessorRepository professorRepository,
        AlunoRepository alunoRepository,
        PeriodoRepository periodoRepository,
        CursoRepository cursoRepository,
        TurmaRepository turmaRepository,
        DisciplinaRepository disciplinaRepository,
        DisciplinaTurmaRepository disciplinaTurmaRepository,
        ProfessorDisciplinaTurmaRepository pdtRepository,
        MatriculaRepository matriculaRepository,
        AulaRepository aulaRepository,
        FrequenciaRepository frequenciaRepository,
        AvaliacaoRepository avaliacaoRepository,
        AlunoAvaliacaoRepository alunoAvaliacaoRepository,
        ComentarioRepository comentarioRepository,
        PlanoRepository planoRepository,
        PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (usuarioRepository.count() > 0) {
                return;
            }

            String hash = passwordEncoder.encode("123456");
            Instant agora = Instant.now();

            // 1. Professores
            Usuario uAna = usuarioRepository.save(new Usuario("ana@exemplo.com", hash, "Ana Martins", "Professor", 1L, true, agora));
            Professor profAna = professorRepository.save(new Professor(uAna.getId(), "Ana Martins", "Mestrado em Computação"));

            Usuario uBruno = usuarioRepository.save(new Usuario("bruno@exemplo.com", hash, "Bruno Almeida", "Professor", 2L, true, agora));
            Professor profBruno = professorRepository.save(new Professor(uBruno.getId(), "Bruno Almeida", "Desenvolvimento Web"));

            // 2. Alunos e usuário inativo
            Usuario uCarla = usuarioRepository.save(new Usuario("carla@exemplo.com", hash, "Carla Souza", "Aluno", 1L, true, agora));
            Aluno aCarla = alunoRepository.save(new Aluno(uCarla.getId(), "Carla Souza", LocalDate.of(2004, 5, 12), LocalDate.of(2026, 2, 2), "2026001"));

            Usuario uDiego = usuarioRepository.save(new Usuario("diego@exemplo.com", hash, "Diego Lima", "Aluno", 2L, true, agora));
            Aluno aDiego = alunoRepository.save(new Aluno(uDiego.getId(), "Diego Lima", LocalDate.of(2003, 9, 21), LocalDate.of(2026, 2, 2), "2026002"));

            Usuario uElisa = usuarioRepository.save(new Usuario("elisa@exemplo.com", hash, "Elisa Costa", "Aluno", 3L, true, agora));
            Aluno aElisa = alunoRepository.save(new Aluno(uElisa.getId(), "Elisa Costa", LocalDate.of(2004, 11, 3), LocalDate.of(2026, 2, 2), "2026003"));

            Usuario uFelipe = usuarioRepository.save(new Usuario("felipe@exemplo.com", hash, "Felipe Rocha", "Aluno", 4L, true, agora));
            Aluno aFelipe = alunoRepository.save(new Aluno(uFelipe.getId(), "Felipe Rocha", LocalDate.of(2002, 8, 18), LocalDate.of(2026, 2, 2), "2026004"));

            usuarioRepository.save(new Usuario("inativo@exemplo.com", hash, "Usuário Inativo", "Aluno", 99L, false, agora));

            // 3. Estrutura acadêmica
            Periodo p1 = periodoRepository.save(new Periodo("1º Semestre", 2026, LocalDate.of(2026, 2, 2), LocalDate.of(2026, 7, 10)));
            periodoRepository.save(new Periodo("2º Semestre", 2026, LocalDate.of(2026, 8, 3), LocalDate.of(2026, 12, 18)));

            Curso c1 = cursoRepository.save(new Curso("Tecnologia em Sistemas para Internet", "Desenvolvimento web full stack e nuvem.", 2000, "ATIVO"));
            Curso c2 = cursoRepository.save(new Curso("Análise e Desenvolvimento de Sistemas", "Projeto, testes e evolução de APIs REST.", 2400, "ATIVO"));

            Turma t1 = turmaRepository.save(new Turma(c1.getId(), p1.getId(), "TSI-1A", "NOTURNO", "ATIVA"));
            Turma t2 = turmaRepository.save(new Turma(c2.getId(), p1.getId(), "ADS-2B", "MATUTINO", "ATIVA"));

            Disciplina d1 = disciplinaRepository.save(new Disciplina("Desenvolvimento Web com React", "SPA, hooks, roteamento e REST.", 80));
            Disciplina d2 = disciplinaRepository.save(new Disciplina("Banco de Dados Relacional", "Modelagem ER, SQL e Flyway.", 80));

            DisciplinaTurma dt1 = disciplinaTurmaRepository.save(new DisciplinaTurma(d1.getId(), t1.getId()));
            DisciplinaTurma dt2 = disciplinaTurmaRepository.save(new DisciplinaTurma(d2.getId(), t2.getId()));

            pdtRepository.save(new ProfessorDisciplinaTurma(profAna.getId(), dt1.getId()));
            pdtRepository.save(new ProfessorDisciplinaTurma(profBruno.getId(), dt2.getId()));

            matriculaRepository.save(new Matricula(aCarla.getId(), t1.getId(), LocalDate.of(2026, 2, 2)));
            matriculaRepository.save(new Matricula(aDiego.getId(), t1.getId(), LocalDate.of(2026, 2, 2)));
            matriculaRepository.save(new Matricula(aElisa.getId(), t1.getId(), LocalDate.of(2026, 2, 2)));
            matriculaRepository.save(new Matricula(aFelipe.getId(), t2.getId(), LocalDate.of(2026, 2, 2)));

            // 4. Aulas e Frequências
            Aula aula1 = new Aula(dt1.getId(), profAna.getId(), LocalDate.of(2026, 5, 4), LocalTime.of(19, 0), LocalTime.of(20, 40), "Componentes e Props");
            aula1.realizar("Componentes e Props");
            aula1 = aulaRepository.save(aula1);

            frequenciaRepository.save(new Frequencia(aula1.getId(), aCarla.getId(), "PRESENTE", "", "[\"Participou da aula\"]", ""));
            frequenciaRepository.save(new Frequencia(aula1.getId(), aDiego.getId(), "ATRASO", "Trânsito", "[\"Participou da aula\"]", "Chegou 15 min após início"));
            frequenciaRepository.save(new Frequencia(aula1.getId(), aElisa.getId(), "FALTA_JUSTIFICADA", "Atestado médico", "[]", ""));

            // 5. Avaliações e Notas
            Avaliacao av1 = avaliacaoRepository.save(new Avaliacao(
                dt1.getId(), profAna.getId(), p1.getId(), "Prova 1 — Fundamentos React", "PROVA",
                "Avaliação escrita e prática.", LocalDate.of(2026, 5, 18), new BigDecimal("10.00"), new BigDecimal("2.00"), Avaliacao.Status.CORRIGIDA
            ));
            alunoAvaliacaoRepository.save(new AlunoAvaliacao(av1.getId(), aCarla.getId(), new BigDecimal("9.00"), "Ótimo domínio"));
            alunoAvaliacaoRepository.save(new AlunoAvaliacao(av1.getId(), aDiego.getId(), new BigDecimal("7.50"), "Bom desempenho"));
            alunoAvaliacaoRepository.save(new AlunoAvaliacao(av1.getId(), aElisa.getId(), new BigDecimal("5.50"), "Revisar hooks"));

            // 6. Comentários (LGPD) e Planos
            comentarioRepository.save(new Comentario(
                aCarla.getId(), profAna.getId(), dt1.getId(),
                "Excelente evolução na entrega", "DESEMPENHO", "POSITIVO",
                "Participou ativamente das revisões e entregou o protótipo.",
                "[\"Compreendeu o conteúdo\",\"Demonstrou evolução\"]",
                "Incentivar monitoria em grupo.", true, agora
            ));
            comentarioRepository.save(new Comentario(
                aCarla.getId(), profAna.getId(), dt1.getId(),
                "Anotação interna sigilosa", "SAUDE", "ATENCAO",
                "Relato privado ao docente (não visível ao aluno).",
                "[\"Necessitou de auxílio\"]",
                "Acompanhar em confidencialidade.", false, agora
            ));

            planoRepository.save(new PlanoAcompanhamento(
                aElisa.getId(), profAna.getId(), dt1.getId(),
                "Dificuldade em integração assíncrona", "Atingir média >= 7.0",
                "Exercícios guiados de fetch e hooks",
                LocalDate.of(2026, 5, 19), LocalDate.of(2026, 6, 15),
                "EM_ACOMPANHAMENTO", "Participou da primeira tutoria"
            ));
        };
    }
}
