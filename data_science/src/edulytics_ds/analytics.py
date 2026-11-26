"""Cálculos de indicadores acadêmicos, correlação estatística e score explicável de risco (#50)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

CORTE_PRESENCA_PERCENTUAL = 75
PRESENCA_CONTABILIZADA = {"PRESENTE", "ATRASO"}
CLASSIFICACOES_ALERTA = {"ATENCAO", "NEGATIVO"}


def is_presenca_contabilizada(status_presenca: str) -> bool:
    return str(status_presenca).strip().upper() in PRESENCA_CONTABILIZADA


def calcular_taxa_frequencia(statuses: list[str]) -> int | None:
    if not statuses:
        return None
    presentes = sum(1 for st in statuses if is_presenca_contabilizada(st))
    return int(round((presentes * 100.0) / len(statuses)))


def calcular_media_ponderada(notas_e_pesos: list[tuple[float, float, float]]) -> float | None:
    """Normaliza notas na escala 0-10 a partir de tuplas (nota, valor_total, peso)."""
    soma_ponderada = 0.0
    soma_pesos = 0.0
    for nota, valor_total, peso in notas_e_pesos:
        if valor_total <= 0 or peso <= 0:
            continue
        normalizada = (nota / valor_total) * 10.0
        soma_ponderada += normalizada * peso
        soma_pesos += peso
    if soma_pesos <= 0.0:
        return None
    return round(soma_ponderada / soma_pesos, 1)


def calcular_correlacao_pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) < 2 or len(xs) != len(ys):
        return None
    arr_x = np.asarray(xs, dtype=float)
    arr_y = np.asarray(ys, dtype=float)
    if np.std(arr_x) == 0.0 or np.std(arr_y) == 0.0:
        return None
    r = float(np.corrcoef(arr_x, arr_y)[0, 1])
    if np.isnan(r):
        return None
    return round(r, 2)


def calcular_risco_estudante(
    taxa_frequencia: int | None,
    media_ponderada: float | None,
    ocorrencias_atencao: int,
) -> dict[str, Any]:
    """Calcula score explicável de risco (0-100) e nível (BAIXO, MEDIO, ALTO)."""
    fatores: list[str] = []
    freq_pts = 0
    nota_pts = 0

    if taxa_frequencia is not None and taxa_frequencia < CORTE_PRESENCA_PERCENTUAL:
        deficit = CORTE_PRESENCA_PERCENTUAL - taxa_frequencia
        freq_pts = min(50, int(round(deficit * 1.5)) + (10 if taxa_frequencia < 65 else 0))
        fatores.append(f"Frequência em {taxa_frequencia}% (abaixo do corte de {CORTE_PRESENCA_PERCENTUAL}%)")

    if media_ponderada is not None and media_ponderada < 7.0:
        nota_pts = min(35, int(round((7.0 - media_ponderada) * 10.0)) + (5 if media_ponderada < 6.0 else 0))
        rotulo = "crítica (< 6.0)" if media_ponderada < 6.0 else "abaixo de 7.0"
        fatores.append(f"Média ponderada {rotulo}: {media_ponderada}")

    obs_pts = min(15, int(round(max(0, ocorrencias_atencao) * 7.5)))
    if ocorrencias_atencao > 0:
        fatores.append(f"{ocorrencias_atencao} registro(s) pedagógico(s) de atenção/negativo")

    score = min(100, freq_pts + nota_pts + obs_pts)
    if score >= 55:
        nivel = "ALTO"
    elif score >= 25:
        nivel = "MEDIO"
    else:
        nivel = "BAIXO"

    return {
        "risk_score": score,
        "nivel_risco": nivel,
        "fatores": fatores,
    }


def run_analytics(processed_dir: str | Path, output_dir: str | Path | None = None) -> dict[str, Any]:
    """Calcula métricas globais, por turma, por período, correlação de Pearson e ranking de risco."""
    proc_path = Path(processed_dir)
    turmas = pd.read_csv(proc_path / "turmas.csv")
    alunos = pd.read_csv(proc_path / "alunos.csv")
    aulas = pd.read_csv(proc_path / "aulas.csv")
    frequencias = pd.read_csv(proc_path / "frequencias.csv")
    avaliacoes = pd.read_csv(proc_path / "avaliacoes.csv")
    notas = pd.read_csv(proc_path / "notas.csv")
    comentarios = pd.read_csv(proc_path / "comentarios.csv")

    freq_aula = frequencias.merge(aulas[["aula_id", "turma_id"]], on="aula_id", how="left")
    notas_av = notas.merge(
        avaliacoes[["avaliacao_id", "turma_id", "periodo_nome", "valor_total", "peso"]],
        on="avaliacao_id",
        how="left",
    )

    # Perfil individual por estudante (para % abaixo de 75%, Pearson e score de risco)
    alunos_risco: list[dict[str, Any]] = []
    pearson_x: list[float] = []
    pearson_y: list[float] = []
    turma_nome_map = {int(r["turma_id"]): str(r["nome_turma"]) for _, r in turmas.iterrows()}

    for _, aluno_row in alunos.iterrows():
        aid = int(aluno_row["aluno_id"])
        tid = int(aluno_row["turma_id"])

        st_aluno = freq_aula[freq_aula["aluno_id"] == aid]["status_presenca"].tolist()
        taxa_aluno = calcular_taxa_frequencia(st_aluno)

        notas_aluno_df = notas_av[notas_av["aluno_id"] == aid]
        tuplas_nota = [
            (float(r["nota"]), float(r["valor_total"]), float(r["peso"]))
            for _, r in notas_aluno_df.iterrows()
        ]
        media_aluno = calcular_media_ponderada(tuplas_nota)

        if taxa_aluno is not None and media_aluno is not None:
            pearson_x.append(float(taxa_aluno))
            pearson_y.append(float(media_aluno))

        occ_atencao = int(
            comentarios[
                (comentarios["aluno_id"] == aid)
                & (comentarios["classificacao"].astype(str).str.upper().isin(CLASSIFICACOES_ALERTA))
            ].shape[0]
        )

        risco = calcular_risco_estudante(taxa_aluno, media_aluno, occ_atencao)
        alunos_risco.append(
            {
                "aluno_id": aid,
                "aluno_nome": str(aluno_row["nome_completo"]),
                "turma_id": tid,
                "turma_nome": turma_nome_map.get(tid, ""),
                "taxa_frequencia": taxa_aluno,
                "media_ponderada": media_aluno,
                "ocorrencias_atencao": occ_atencao,
                **risco,
            }
        )

    alunos_risco.sort(key=lambda item: (-item["risk_score"], item["aluno_nome"]))

    # Indicadores por turma
    resumo_turmas: list[dict[str, Any]] = []
    for _, turma_row in turmas.iterrows():
        tid = int(turma_row["turma_id"])
        statuses_turma = freq_aula[freq_aula["turma_id"] == tid]["status_presenca"].tolist()
        notas_turma_df = notas_av[notas_av["turma_id"] == tid]
        tuplas_turma = [
            (float(r["nota"]), float(r["valor_total"]), float(r["peso"]))
            for _, r in notas_turma_df.iterrows()
        ]
        alunos_turma = [a for a in alunos_risco if a["turma_id"] == tid and a["taxa_frequencia"] is not None]
        abaixo = sum(1 for a in alunos_turma if a["taxa_frequencia"] < CORTE_PRESENCA_PERCENTUAL)
        pct_abaixo = int(round((abaixo * 100.0) / len(alunos_turma))) if alunos_turma else None

        resumo_turmas.append(
            {
                "turma_id": tid,
                "nome_turma": str(turma_row["nome_turma"]),
                "curso_nome": str(turma_row["curso_nome"]),
                "total_alunos": len([a for a in alunos_risco if a["turma_id"] == tid]),
                "taxa_frequencia_media": calcular_taxa_frequencia(statuses_turma),
                "percentual_abaixo_75": pct_abaixo,
                "media_ponderada_notas": calcular_media_ponderada(tuplas_turma),
            }
        )

    # Indicadores por período
    resumo_periodos: list[dict[str, Any]] = []
    for periodo_nome, grp in notas_av.groupby("periodo_nome"):
        tuplas_p = [
            (float(r["nota"]), float(r["valor_total"]), float(r["peso"]))
            for _, r in grp.iterrows()
        ]
        resumo_periodos.append(
            {
                "periodo_nome": str(periodo_nome),
                "media_ponderada_notas": calcular_media_ponderada(tuplas_p),
                "total_avaliacoes_lancadas": int(len(grp)),
            }
        )

    com_freq = [a for a in alunos_risco if a["taxa_frequencia"] is not None]
    abaixo_global = sum(1 for a in com_freq if a["taxa_frequencia"] < CORTE_PRESENCA_PERCENTUAL)
    distribuicao_risco = {
        "BAIXO": sum(1 for a in alunos_risco if a["nivel_risco"] == "BAIXO"),
        "MEDIO": sum(1 for a in alunos_risco if a["nivel_risco"] == "MEDIO"),
        "ALTO": sum(1 for a in alunos_risco if a["nivel_risco"] == "ALTO"),
    }

    tuplas_globais = [
        (float(r["nota"]), float(r["valor_total"]), float(r["peso"]))
        for _, r in notas_av.iterrows()
    ]

    summary: dict[str, Any] = {
        "corte_presenca_percentual": CORTE_PRESENCA_PERCENTUAL,
        "taxa_frequencia_media_global": calcular_taxa_frequencia(freq_aula["status_presenca"].tolist()),
        "percentual_abaixo_75_global": int(round((abaixo_global * 100.0) / len(com_freq))) if com_freq else None,
        "media_ponderada_global": calcular_media_ponderada(tuplas_globais),
        "correlacao_pearson_frequencia_nota": calcular_correlacao_pearson(pearson_x, pearson_y),
        "distribuicao_risco": distribuicao_risco,
        "resumo_por_turma": resumo_turmas,
        "resumo_por_periodo": resumo_periodos,
        "alunos_risco": alunos_risco,
    }

    if output_dir is not None:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        (out_path / "analytics_summary.json").write_text(
            json.dumps(summary, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    return summary
