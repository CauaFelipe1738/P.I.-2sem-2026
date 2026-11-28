ALTER TABLE frequencia DROP CONSTRAINT fk_frequencia_aula;
ALTER TABLE frequencia
    ADD CONSTRAINT fk_frequencia_aula
    FOREIGN KEY (aula_id) REFERENCES aula(id) ON DELETE CASCADE;

ALTER TABLE aluno_avaliacao DROP CONSTRAINT fk_aa_avaliacao;
ALTER TABLE aluno_avaliacao
    ADD CONSTRAINT fk_aa_avaliacao
    FOREIGN KEY (avaliacao_id) REFERENCES avaliacao(id) ON DELETE CASCADE;
