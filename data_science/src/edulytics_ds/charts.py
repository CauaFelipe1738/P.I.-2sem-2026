"""Geração de gráficos analíticos em modo headless (Matplotlib Agg)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def generate_charts(summary: dict[str, Any], charts_dir: str | Path) -> list[Path]:
    """Gera gráficos PNG de frequência por turma, correlação frequência × nota e distribuição de risco."""
    out_dir = Path(charts_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    generated: list[Path] = []

    # 1. Frequência média por turma com linha do corte oficial (75%)
    turmas = summary.get("resumo_por_turma", [])
    fig, ax = plt.subplots(figsize=(7, 4))
    nomes = [t["nome_turma"] for t in turmas]
    taxas = [t["taxa_frequencia_media"] or 0 for t in turmas]
    bars = ax.bar(nomes, taxas, color="#2875df", width=0.5)
    ax.axhline(
        summary.get("corte_presenca_percentual", 75),
        color="#d93848",
        linestyle="--",
        linewidth=1.5,
        label="Corte oficial (75%)",
    )
    ax.set_ylim(0, 110)
    ax.set_ylabel("Frequência (%)")
    ax.set_title("Taxa Média de Frequência por Turma")
    ax.legend(loc="upper right")
    for bar, val in zip(bars, taxas):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 2, f"{val}%", ha="center", fontsize=9)
    fig.tight_layout()
    freq_path = out_dir / "frequencia_por_turma.png"
    fig.savefig(freq_path, dpi=120)
    plt.close(fig)
    generated.append(freq_path)

    # 2. Dispersão Frequência (%) × Média Ponderada colorida por nível de risco
    alunos = summary.get("alunos_risco", [])
    fig, ax = plt.subplots(figsize=(7, 4))
    color_map = {"BAIXO": "#16a34a", "MEDIO": "#d97706", "ALTO": "#dc2626"}
    for nivel in ("BAIXO", "MEDIO", "ALTO"):
        pts = [
            a for a in alunos
            if a["nivel_risco"] == nivel
            and a["taxa_frequencia"] is not None
            and a["media_ponderada"] is not None
        ]
        if pts:
            ax.scatter(
                [p["taxa_frequencia"] for p in pts],
                [p["media_ponderada"] for p in pts],
                c=color_map[nivel],
                label=f"Risco {nivel}",
                s=75,
                alpha=0.85,
            )
    ax.axvline(75, color="#94a3b8", linestyle=":", linewidth=1.2)
    ax.set_xlim(30, 105)
    ax.set_ylim(0, 10.5)
    ax.set_xlabel("Frequência Individual (%)")
    ax.set_ylabel("Média Ponderada (0–10)")
    pearson = summary.get("correlacao_pearson_frequencia_nota")
    ax.set_title(f"Frequência × Média Ponderada (Pearson r = {pearson if pearson is not None else 'N/D'})")
    ax.legend(loc="lower right")
    fig.tight_layout()
    corr_path = out_dir / "correlacao_frequencia_nota.png"
    fig.savefig(corr_path, dpi=120)
    plt.close(fig)
    generated.append(corr_path)

    # 3. Distribuição de risco acadêmico
    dist = summary.get("distribuicao_risco", {})
    fig, ax = plt.subplots(figsize=(6, 4))
    niveis = ["BAIXO", "MEDIO", "ALTO"]
    valores = [dist.get(n, 0) for n in niveis]
    ax.bar(niveis, valores, color=["#16a34a", "#d97706", "#dc2626"], width=0.45)
    ax.set_ylabel("Quantidade de Estudantes")
    ax.set_title("Distribuição do Score de Risco Acadêmico")
    fig.tight_layout()
    risco_path = out_dir / "distribuicao_risco.png"
    fig.savefig(risco_path, dpi=120)
    plt.close(fig)
    generated.append(risco_path)

    return generated
