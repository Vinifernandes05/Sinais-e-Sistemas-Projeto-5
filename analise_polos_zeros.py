#!/usr/bin/env python3
"""Parte II do Projeto 5 (Sinais e Sistemas): análise de H(s) = N(s)/D(s).

Recebe os coeficientes de N(s) e D(s) (ordem decrescente de potências de s) ou,
por padrão, deriva-os das equações do modelo:
  Modelo A: equação literalmente impressa (Eq. 3 com A_p p_t)
  Modelo B: forma compatível com os coeficientes oficiais (Eq. 3 com p_t)

Uso:
  python3 analise_polos_zeros.py                 # Modelo B
  python3 analise_polos_zeros.py --modelo A      # Modelo A
  python3 analise_polos_zeros.py --num 62.5 0 --den 0.0048 0.14792 18.80258 227.117075 15033.645 2250

Saídas (pasta do script): resultados_modelo_<X>.json e imagens/plano_s_modelo_<X>.png
Hipótese adotada: realização física causal. Com ela, a ROC é Re(s) > maior parte real dos polos.
"""
import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

PASTA = Path(__file__).resolve().parent
PARAMETROS = dict(C_th=10.0, H_r=1.5, L_f=0.5, R_f=12.0, C_f=8.0e-4, M_p=1.2,
                  B_p=8.0, K_p=1500.0, A_p=0.05, K_term=250.0, K_e=5.0)


def funcao_transferencia(modelo, p=PARAMETROS):
    """N(s) e D(s) por álgebra de polinômios, a partir das equações."""
    P = np.poly1d
    Cth, Hr, Lf, Rf, Cf = p["C_th"], p["H_r"], p["L_f"], p["R_f"], p["C_f"]
    Mp, Bp, Kp, Ap, Kt, Ke = p["M_p"], p["B_p"], p["K_p"], p["A_p"], p["K_term"], p["K_e"]
    if modelo == "A":    # D_A(s) = A_p + C_f s (L_f s + R_f); numerador K_e A_p^2 K_term s
        Dg, num = P([Cf * Lf, Cf * Rf, Ap]), P([Ke * Ap**2 * Kt, 0.0])
    else:                # D_B(s) = 1 + C_f s (L_f s + R_f); numerador K_e A_p K_term s
        Dg, num = P([Cf * Lf, Cf * Rf, 1.0]), P([Ke * Ap * Kt, 0.0])
    N_mec = P([Mp, Bp, Kp]) * Dg + P([Ap**2 * Lf, Ap**2 * Rf, 0.0])
    return num, P([Cth, Hr]) * N_mec


def coeficientes_literais_B(p=PARAMETROS):
    """c5..c0 e d1 pelas expressões literais do Modelo B (conferência independente)."""
    Cth, Hr, Lf, Rf, Cf = p["C_th"], p["H_r"], p["L_f"], p["R_f"], p["C_f"]
    Mp, Bp, Kp, Ap, Kt, Ke = p["M_p"], p["B_p"], p["K_p"], p["A_p"], p["K_term"], p["K_e"]
    c = [Mp * Lf * Cf * Cth,
         Mp * Lf * Cf * Hr + (Mp * Rf * Cf + Bp * Lf * Cf) * Cth,
         (Mp * Rf * Cf + Bp * Lf * Cf) * Hr + (Mp + Kp * Lf * Cf + Bp * Rf * Cf + Ap**2 * Lf) * Cth,
         (Mp + Kp * Lf * Cf + Bp * Rf * Cf + Ap**2 * Lf) * Hr + (Bp + Kp * Rf * Cf + Ap**2 * Rf) * Cth,
         (Bp + Kp * Rf * Cf + Ap**2 * Rf) * Hr + Kp * Cth,
         Kp * Hr]
    return np.array(c), Ke * Ap * Kt


def residuo_relativo(D, r):
    """|D(r)| relativo à soma dos termos |c_k||r|^k: mede a precisão da raiz r."""
    k = np.arange(D.order, -1, -1)
    return abs(D(r)) / np.sum(np.abs(D.coeffs) * np.abs(r) ** k)


def analisar(num, den, nome):
    """Zeros, polos, estabilidade BIBO e ROC, sob a hipótese de causalidade."""
    zeros = np.roots(num.coeffs) if num.order > 0 else np.array([])
    polos = np.roots(den.coeffs)
    sigma = float(polos.real.max())
    if sigma < -1e-9:
        estab = "BIBO estável (todos os polos com Re(s) < 0; a ROC contém o eixo jω)"
    elif abs(sigma) <= 1e-9:
        estab = "marginalmente estável (polo sobre o eixo jω)"
    else:
        estab = "instável (polo no semiplano direito)"
    return {
        "modelo": nome,
        "numerador": [float(x) for x in num.coeffs],
        "denominador": [float(x) for x in den.coeffs],
        "zeros": [[float(z.real), float(z.imag)] for z in zeros],
        "polos": [[float(q.real), float(q.imag)] for q in polos],
        "sigma_max": sigma,
        "estabilidade": estab,
        "causalidade": "causal (hipótese de realização física); H(s) estritamente própria",
        "roc": f"Re(s) > {sigma:.6g}",
        "residuo_relativo_max": float(max(residuo_relativo(den, q) for q in polos)),
    }


def grafico(res, arquivo, titulo):
    z = np.array([complex(a, b) for a, b in res["zeros"]])
    q = np.array([complex(a, b) for a, b in res["polos"]])
    sg = res["sigma_max"]
    ymax = max(10.0, 1.2 * float(np.abs(q.imag).max()))
    xmin = 1.25 * min(float(q.real.min()), -1.0)
    fig, ax = plt.subplots(figsize=(8, 5.2), dpi=150)
    ax.axvspan(sg, 4, color="#22d3ee", alpha=0.18, label=f"ROC: Re(s) > {sg:.2f}")
    ax.axvline(sg, color="#22d3ee", ls="--", lw=1.2)
    ax.axvline(0, color="#64748b", lw=0.9, label="eixo jω (Re = 0)")
    ax.axhline(0, color="#64748b", lw=0.9)
    ax.plot(q.real, q.imag, "x", ms=11, mew=2.2, color="#f472b6", label="polos (X)")
    if len(z):
        ax.plot(z.real, z.imag, "o", ms=9, mfc="none", mew=2, color="#fbbf24", label="zeros (O)")
    ax.set_xlim(xmin, 4)
    ax.set_ylim(-ymax, ymax)
    ax.set_xlabel("Re(s)")
    ax.set_ylabel("Im(s)")
    ax.set_title(titulo)
    ax.grid(alpha=0.25)
    ax.legend(loc="upper left", fontsize=8)
    fig.tight_layout()
    fig.savefig(arquivo)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description="Parte II: zeros, polos, causalidade, estabilidade e ROC")
    ap.add_argument("--modelo", choices=["A", "B"], default="B")
    ap.add_argument("--num", nargs="+", type=float)
    ap.add_argument("--den", nargs="+", type=float)
    a = ap.parse_args()
    if a.num and a.den:
        num, den, nome = np.poly1d(a.num), np.poly1d(a.den), "usuario"
    else:
        num, den = funcao_transferencia(a.modelo)
        nome = a.modelo
    res = analisar(num, den, nome)
    if nome == "B":
        cl, d1 = coeficientes_literais_B()
        res["conferencia_literal"] = {
            "erro_relativo_max_denominador": float(np.max(np.abs(den.coeffs - cl) / np.abs(cl))),
            "erro_relativo_d1": float(abs(num.coeffs[0] - d1) / abs(d1))}
    (PASTA / "imagens").mkdir(exist_ok=True)
    (PASTA / f"resultados_modelo_{nome}.json").write_text(
        json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    grafico(res, PASTA / "imagens" / f"plano_s_modelo_{nome}.png",
            f"Plano s — Modelo {nome}: polos (X), zeros (O) e ROC")
    print(f"Modelo {nome}")
    print("  N(s) =", np.array2string(num.coeffs, precision=8))
    print("  D(s) =", np.array2string(den.coeffs, precision=8))
    print("  zeros:", [f"{z[0]:.6g}{z[1]:+.6g}j" for z in res["zeros"]])
    print("  polos:", [f"{q[0]:.6g}{q[1]:+.6g}j" for q in res["polos"]])
    print("  ROC:", res["roc"], "|", res["estabilidade"])
    print(f"  resíduo relativo máximo: {res['residuo_relativo_max']:.2e}")
    if "conferencia_literal" in res:
        print("  conferência com expressões literais:", res["conferencia_literal"])


if __name__ == "__main__":
    main()
