"""CLI orquestradora: ETL -> Analytics -> Gráficos."""

from __future__ import annotations

import argparse
from pathlib import Path

from .analytics import run_analytics
from .charts import generate_charts
from .etl import run_etl


def run_full_pipeline(
    raw_dir: str | Path,
    base_work_dir: str | Path,
) -> dict[str, object]:
    work = Path(base_work_dir)
    processed_dir = work / "processed"
    rejected_dir = work / "rejected"
    output_dir = work / "output"
    charts_dir = output_dir / "charts"

    etl_report = run_etl(raw_dir, processed_dir, rejected_dir, output_dir)
    analytics_summary = run_analytics(processed_dir, output_dir)
    chart_paths = generate_charts(analytics_summary, charts_dir)

    return {
        "etl_report": etl_report,
        "analytics_summary": analytics_summary,
        "charts": [str(p) for p in chart_paths],
    }


def main() -> None:
    ds_root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description="Executa pipeline completo de Ciência de Dados EDULYTICS.")
    parser.add_argument("--raw-dir", default=str(ds_root / "data" / "raw"))
    parser.add_argument("--output-dir", default=str(ds_root / "data" / "run"))
    args = parser.parse_args()

    result = run_full_pipeline(args.raw_dir, args.output_dir)
    print(f"ETL concluiu: {result['etl_report']['total_validos']} válidos, {result['etl_report']['total_rejeitados']} rejeitados.")
    print(f"Correlação Pearson r = {result['analytics_summary']['correlacao_pearson_frequencia_nota']}")
    print(f"Gráficos gerados: {len(result['charts'])}")


if __name__ == "__main__":
    main()
