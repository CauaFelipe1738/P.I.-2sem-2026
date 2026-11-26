# Ciência de Dados & Analytics — EDULYTICS

> Módulo Python responsável pela ingestão padronizada de datasets acadêmicos fictícios (`#48`), pipeline ETL de validação e limpeza (`#49`), cálculos estatísticos, score explicável de risco acadêmico e geração de gráficos (`#50`).

---

## 1. Estrutura do Módulo

```text
data_science/
├── requirements.txt
├── data/
│   └── raw/                  # Datasets CSV padronizados e fictícios (com coluna `origem`)
│       ├── turmas.csv
│       ├── alunos.csv
│       ├── aulas.csv
│       ├── frequencias.csv   # Contém registros sujos controlados para teste do ETL
│       ├── avaliacoes.csv
│       ├── notas.csv         # Contém registros sujos controlados para teste do ETL
│       └── comentarios.csv
├── src/edulytics_ds/
│   ├── etl.py                # Validação de schema, datas, FKs, intervalos e deduplicação
│   ├── analytics.py          # Frequência (75%), média ponderada, Pearson e score de risco
│   ├── charts.py             # Gráficos PNG headless via Matplotlib
│   └── pipeline.py           # CLI orquestradora (ETL -> Analytics -> Charts)
└── tests/
    └── test_pipeline.py      # Suíte pytest cobrindo ETL, matemática, risco e outputs
```

---

## 2. Regras Oficiais & Fórmulas Matemáticas

1. **Frequência e Corte de 75%**:
   - Contam como presença: `PRESENTE` e `ATRASO`.
   - Contam como ausência nos indicadores: `AUSENTE` e `FALTA_JUSTIFICADA`.
   - Taxa individual abaixo de **75%** sinaliza vulnerabilidade de frequência.
   - *Observação de escopo v1*: indicador de taxa de ocupação de salas foi removido definitivamente da v1 por inexistência da entidade `SALA`.
2. **Média Ponderada Normalizada (0–10)**:
   $$\text{Média} = \frac{\sum \left(\frac{\text{nota}_i}{\text{valor\_total}_i} \times 10 \times \text{peso}_i\right)}{\sum \text{peso}_i}$$
3. **Correlação Frequência × Nota (Pearson $r$)**:
   - Mede associação linear entre a taxa individual de presença (%) e a média ponderada individual (0–10); retorna `None` quando houver menos de 2 alunos ou desvio padrão nulo.
4. **Score Explicável de Risco Acadêmico (`0` a `100`)**:
   - Déficit de frequência frente ao corte de 75% (até `50` pts).
   - Déficit de notas abaixo de `7.0` / `6.0` (até `35` pts).
   - Ocorrências pedagógicas de `ATENCAO` ou `NEGATIVO` (até `15` pts).
   - Níveis: `ALTO` ($\ge 55$), `MEDIO` ($\ge 25$), `BAIXO` ($< 25$).

---

## 3. Execução Local / CI

```bash
pip install -r data_science/requirements.txt
PYTHONPATH=data_science/src pytest -v data_science/tests
PYTHONPATH=data_science/src python -m edulytics_ds.pipeline --output-dir data_science/data/output
```
