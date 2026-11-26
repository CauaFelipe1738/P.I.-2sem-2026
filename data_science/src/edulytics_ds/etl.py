"""Pipeline ETL de ingestão, validação e limpeza dos datasets acadêmicos (#48, #49)."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import pandas as pd

VALID_STATUS_PRESENCA = {"PRESENTE", "AUSENTE", "FALTA_JUSTIFICADA", "ATRASO"}
ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _parse_iso_date(value: Any) -> bool:
    text = str(value).strip()
    if not ISO_DATE_RE.match(text):
        return False
    parsed = pd.to_datetime(text, format="%Y-%m-%d", errors="coerce")
    return not pd.isna(parsed)


def _clean_frequencias(
    df_raw: pd.DataFrame,
    valid_aula_ids: set[int],
    valid_aluno_ids: set[int],
) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    valid_rows: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    seen_pairs: set[tuple[int, int]] = set()

    for _, row in df_raw.iterrows():
        rec = row.to_dict()
        reasons: list[str] = []

        try:
            aula_id = int(rec["aula_id"])
            aluno_id = int(rec["aluno_id"])
        except (KeyError, TypeError, ValueError):
            rec["tabela"] = "frequencias"
            rec["motivo_rejeicao"] = "ID_INVALIDO"
            rejected.append(rec)
            continue

        if aula_id not in valid_aula_ids:
            reasons.append("FK_AULA_INEXISTENTE")
        if aluno_id not in valid_aluno_ids:
            reasons.append("FK_ALUNO_INEXISTENTE")

        status = str(rec.get("status_presenca", "")).strip().upper()
        if status not in VALID_STATUS_PRESENCA:
            reasons.append("STATUS_PRESENCA_INVALIDO")

        if not _parse_iso_date(rec.get("data_registro", "")):
            reasons.append("DATA_REGISTRO_INVALIDA")

        if not reasons and (aula_id, aluno_id) in seen_pairs:
            reasons.append("DUPLICIDADE_AULA_ALUNO")

        if reasons:
            rec["tabela"] = "frequencias"
            rec["motivo_rejeicao"] = "|".join(reasons)
            rejected.append(rec)
            continue

        seen_pairs.add((aula_id, aluno_id))
        rec["aula_id"] = aula_id
        rec["aluno_id"] = aluno_id
        rec["status_presenca"] = status
        rec["justificativa"] = "" if pd.isna(rec.get("justificativa")) else str(rec.get("justificativa"))
        valid_rows.append(rec)

    return pd.DataFrame(valid_rows, columns=df_raw.columns), rejected


def _clean_notas(
    df_raw: pd.DataFrame,
    avaliacoes_map: dict[int, float],
    valid_aluno_ids: set[int],
) -> tuple[pd.DataFrame, list[dict[str, Any]]]:
    valid_rows: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    seen_pairs: set[tuple[int, int]] = set()

    for _, row in df_raw.iterrows():
        rec = row.to_dict()
        reasons: list[str] = []

        try:
            avaliacao_id = int(rec["avaliacao_id"])
            aluno_id = int(rec["aluno_id"])
            nota = float(rec["nota"])
        except (KeyError, TypeError, ValueError):
            rec["tabela"] = "notas"
            rec["motivo_rejeicao"] = "VALOR_NUMERICO_INVALIDO"
            rejected.append(rec)
            continue

        if avaliacao_id not in avaliacoes_map:
            reasons.append("FK_AVALIACAO_INEXISTENTE")
        if aluno_id not in valid_aluno_ids:
            reasons.append("FK_ALUNO_INEXISTENTE")

        valor_total = avaliacoes_map.get(avaliacao_id)
        if nota < 0:
            reasons.append("NOTA_NEGATIVA")
        elif valor_total is not None and nota > valor_total:
            reasons.append("NOTA_ACIMA_VALOR_TOTAL")

        if not _parse_iso_date(rec.get("data_registro", "")):
            reasons.append("DATA_REGISTRO_INVALIDA")

        if not reasons and (avaliacao_id, aluno_id) in seen_pairs:
            reasons.append("DUPLICIDADE_AVALIACAO_ALUNO")

        if reasons:
            rec["tabela"] = "notas"
            rec["motivo_rejeicao"] = "|".join(reasons)
            rejected.append(rec)
            continue

        seen_pairs.add((avaliacao_id, aluno_id))
        rec["avaliacao_id"] = avaliacao_id
        rec["aluno_id"] = aluno_id
        rec["nota"] = nota
        valid_rows.append(rec)

    return pd.DataFrame(valid_rows, columns=df_raw.columns), rejected


def run_etl(
    raw_dir: str | Path,
    processed_dir: str | Path,
    rejected_dir: str | Path,
    output_dir: str | Path,
) -> dict[str, Any]:
    """Executa carregamento, validação referencial/domínio, deduplicação e geração de relatório ETL."""
    raw_path = Path(raw_dir)
    proc_path = Path(processed_dir)
    rej_path = Path(rejected_dir)
    out_path = Path(output_dir)
    for directory in (proc_path, rej_path, out_path):
        directory.mkdir(parents=True, exist_ok=True)

    turmas = pd.read_csv(raw_path / "turmas.csv")
    alunos = pd.read_csv(raw_path / "alunos.csv")
    aulas = pd.read_csv(raw_path / "aulas.csv")
    frequencias_raw = pd.read_csv(raw_path / "frequencias.csv")
    avaliacoes = pd.read_csv(raw_path / "avaliacoes.csv")
    notas_raw = pd.read_csv(raw_path / "notas.csv")
    comentarios = pd.read_csv(raw_path / "comentarios.csv")

    valid_turma_ids = set(turmas["turma_id"].astype(int))
    alunos = alunos[alunos["turma_id"].astype(int).isin(valid_turma_ids)].copy()
    valid_aluno_ids = set(alunos["aluno_id"].astype(int))

    aulas = aulas[aulas["turma_id"].astype(int).isin(valid_turma_ids)].copy()
    aulas = aulas[aulas["data_aula"].apply(_parse_iso_date)].copy()
    valid_aula_ids = set(aulas["aula_id"].astype(int))

    avaliacoes = avaliacoes[
        avaliacoes["turma_id"].astype(int).isin(valid_turma_ids)
        & (avaliacoes["valor_total"].astype(float) > 0)
        & (avaliacoes["peso"].astype(float) > 0)
        & avaliacoes["data_avaliacao"].apply(_parse_iso_date)
    ].copy()
    avaliacoes_map = {
        int(r["avaliacao_id"]): float(r["valor_total"])
        for _, r in avaliacoes.iterrows()
    }

    frequencias_clean, rej_freq = _clean_frequencias(frequencias_raw, valid_aula_ids, valid_aluno_ids)
    notas_clean, rej_notas = _clean_notas(notas_raw, avaliacoes_map, valid_aluno_ids)
    comentarios_clean = comentarios[
        comentarios["aluno_id"].astype(int).isin(valid_aluno_ids)
        & comentarios["turma_id"].astype(int).isin(valid_turma_ids)
        & comentarios["data_comentario"].apply(_parse_iso_date)
    ].copy()

    turmas.to_csv(proc_path / "turmas.csv", index=False)
    alunos.to_csv(proc_path / "alunos.csv", index=False)
    aulas.to_csv(proc_path / "aulas.csv", index=False)
    frequencias_clean.to_csv(proc_path / "frequencias.csv", index=False)
    avaliacoes.to_csv(proc_path / "avaliacoes.csv", index=False)
    notas_clean.to_csv(proc_path / "notas.csv", index=False)
    comentarios_clean.to_csv(proc_path / "comentarios.csv", index=False)

    rejeitados = rej_freq + rej_notas
    pd.DataFrame(rejeitados).to_csv(rej_path / "rejeitados.csv", index=False)

    motivos = Counter(item["motivo_rejeicao"] for item in rejeitados)
    report = {
        "frequencias": {
            "lidos": int(len(frequencias_raw)),
            "validos": int(len(frequencias_clean)),
            "rejeitados": int(len(rej_freq)),
        },
        "notas": {
            "lidos": int(len(notas_raw)),
            "validos": int(len(notas_clean)),
            "rejeitados": int(len(rej_notas)),
        },
        "total_lidos": int(len(frequencias_raw) + len(notas_raw)),
        "total_validos": int(len(frequencias_clean) + len(notas_clean)),
        "total_rejeitados": int(len(rejeitados)),
        "motivos": dict(motivos),
    }
    (out_path / "etl_report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return report
