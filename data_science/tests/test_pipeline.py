from pathlib import Path

import pandas as pd
import pytest

from edulytics_ds.analytics import (
    calcular_correlacao_pearson,
    calcular_media_ponderada,
    calcular_risco_estudante,
    calcular_taxa_frequencia,
    is_presenca_contabilizada,
)
from edulytics_ds.etl import run_etl
from edulytics_ds.pipeline import run_full_pipeline

RAW_DIR = Path(__file__).resolve().parents[1] / "data" / "raw"


def test_etl_limpa_duplicidades_e_rejeita_registros_invalidos(tmp_path: Path) -> None:
    processed_dir = tmp_path / "processed"
    rejected_dir = tmp_path / "rejected"
    output_dir = tmp_path / "output"

    report = run_etl(RAW_DIR, processed_dir, rejected_dir, output_dir)

    assert report["frequencias"]["lidos"] == 28
    assert report["frequencias"]["validos"] == 24
    assert report["frequencias"]["rejeitados"] == 4

    assert report["notas"]["lidos"] == 16
    assert report["notas"]["validos"] == 12
    assert report["notas"]["rejeitados"] == 4

    assert report["motivos"]["DUPLICIDADE_AULA_ALUNO"] == 1
    assert report["motivos"]["STATUS_PRESENCA_INVALIDO"] == 1
    assert report["motivos"]["FK_ALUNO_INEXISTENTE"] == 1
    assert report["motivos"]["DATA_REGISTRO_INVALIDA"] == 1
    assert report["motivos"]["NOTA_NEGATIVA"] == 1
    assert report["motivos"]["NOTA_ACIMA_VALOR_TOTAL"] == 1
    assert report["motivos"]["DUPLICIDADE_AVALIACAO_ALUNO"] == 1
    assert report["motivos"]["FK_AVALIACAO_INEXISTENTE"] == 1

    rejeitados_df = pd.read_csv(rejected_dir / "rejeitados.csv")
    assert len(rejeitados_df) == 8
    assert (output_dir / "etl_report.json").exists()


def test_formulas_oficiais_corte_75_atraso_e_pearson() -> None:
    # ATRASO conta como presença; FALTA_JUSTIFICADA e AUSENTE contam como ausência
    assert is_presenca_contabilizada("PRESENTE") is True
    assert is_presenca_contabilizada("ATRASO") is True
    assert is_presenca_contabilizada("FALTA_JUSTIFICADA") is False
    assert is_presenca_contabilizada("AUSENTE") is False

    assert calcular_taxa_frequencia(["PRESENTE", "ATRASO", "FALTA_JUSTIFICADA", "AUSENTE"]) == 50
    assert calcular_taxa_frequencia([]) is None

    # Normalização 0-10 ponderada
    media = calcular_media_ponderada([(8.0, 10.0, 2.0), (15.0, 20.0, 3.0)])
    # 8.0*2 + 7.5*3 = 38.5 / 5 = 7.7
    assert media == pytest.approx(7.7)

    # Pearson positivo e tratamento de variância zero
    assert calcular_correlacao_pearson([50, 75, 100], [4.0, 6.5, 9.0]) == pytest.approx(1.0)
    assert calcular_correlacao_pearson([75, 75, 75], [5.0, 7.0, 9.0]) is None
    assert calcular_correlacao_pearson([100], [9.0]) is None


def test_classificacao_score_risco_explicavel() -> None:
    baixo = calcular_risco_estudante(95, 8.8, 0)
    assert baixo["nivel_risco"] == "BAIXO"
    assert baixo["risk_score"] == 0
    assert baixo["fatores"] == []

    medio = calcular_risco_estudante(75, 5.5, 1)
    assert medio["nivel_risco"] == "MEDIO"
    assert 25 <= medio["risk_score"] < 55

    alto = calcular_risco_estudante(50, 4.7, 2)
    assert alto["nivel_risco"] == "ALTO"
    assert alto["risk_score"] >= 55
    assert len(alto["fatores"]) == 3


def test_pipeline_completo_gera_resumo_e_graficos(tmp_path: Path) -> None:
    result = run_full_pipeline(RAW_DIR, tmp_path)
    summary = result["analytics_summary"]

    assert summary["corte_presenca_percentual"] == 75
    assert summary["correlacao_pearson_frequencia_nota"] > 0.8
    assert summary["distribuicao_risco"]["ALTO"] >= 2
    assert summary["distribuicao_risco"]["MEDIO"] >= 1
    assert summary["distribuicao_risco"]["BAIXO"] >= 2
    assert len(summary["resumo_por_turma"]) == 2
    assert len(summary["resumo_por_periodo"]) >= 1

    assert (tmp_path / "output" / "analytics_summary.json").exists()
    for chart in result["charts"]:
        p = Path(chart)
        assert p.exists()
        assert p.stat().st_size > 1000
