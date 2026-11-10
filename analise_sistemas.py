"""Núcleo de análise de H(s)=N(s)/D(s): zeros, polos, ROC causal, estabilidade BIBO.
Coeficientes em ordem decrescente de potência de s."""
import re
import numpy as np

TOL = 1e-6  # tolerância relativa para eixo jω, multiplicidade e cancelamentos


class EntradaInvalida(ValueError):
    pass


def ler_coeficientes(texto, nome):
    """Converte '1, 2 3;4' em lista de floats. Rejeita vazio, texto e nan/inf."""
    partes = [p for p in re.split(r"[,\s;\[\]]+", (texto or "").strip()) if p]
    if not partes:
        raise EntradaInvalida(f"{nome}: campo vazio.")
    out = []
    for p in partes:
        try:
            v = float(p.replace(",", "."))
        except ValueError:
            raise EntradaInvalida(f"{nome}: '{p}' não é um número válido.") from None
        if not np.isfinite(v):
            raise EntradaInvalida(f"{nome}: valor não finito ('{p}').")
        out.append(v)
    return out


def _aparar(c):
    c = np.array(c, dtype=float)
    nz = np.nonzero(c)[0]
    return c[nz[0]:] if len(nz) else np.array([])


def _agrupar(raizes):
    """Agrupa raízes iguais (multiplicidade) pela tolerância relativa."""
    grupos = []
    for r in raizes:
        for g in grupos:
            if abs(g[0] - r) <= 1e-4 * max(1.0, abs(r)):
                g.append(r)
                break
        else:
            grupos.append([r])
    return grupos


def analisar(num, den, causal=True):
    n, d = _aparar(num), _aparar(den)
    if len(d) == 0:
        raise EntradaInvalida("Denominador nulo: divisão por zero.")
    if len(n) == 0:
        raise EntradaInvalida("Numerador nulo: H(s)=0, não há zeros a analisar.")
    if len(d) == 1:
        raise EntradaInvalida("Denominador constante: não há polos.")
    zeros = np.roots(n) if len(n) > 1 else np.array([], dtype=complex)
    polos = np.roots(d)
    # cancelamentos exatos polo-zero (mesma raiz) são removidos da análise
    pol_ef, zer_ef, cancel = list(polos), list(zeros), []
    for z in list(zeros):
        for p in pol_ef:
            if abs(z - p) <= TOL * max(1.0, abs(p)):
                pol_ef.remove(p); zer_ef.remove(z); cancel.append(complex(p)); break
    pol_ef = np.array(pol_ef, dtype=complex)
    grau_n, grau_d = len(n) - 1, len(d) - 1
    propria = grau_n <= grau_d
    sigma = float(pol_ef.real.max()) if len(pol_ef) else float("-inf")
    esc = max(1.0, float(np.abs(pol_ef).max())) if len(pol_ef) else 1.0
    eixo = [p for p in pol_ef if abs(p.real) <= TOL * esc]
    direita = [p for p in pol_ef if p.real > TOL * esc]
    res = dict(num=n.tolist(), den=d.tolist(), ordem_num=grau_n, ordem_den=grau_d,
               zeros=zeros, polos=polos, cancelados=cancel, sigma_max=sigma,
               causal=causal, propria=propria, roc=None, estabilidade="", explicacao="")
    if causal:
        res["roc"] = f"Re(s) > {sigma:.6g}"
    else:
        res["roc"] = "depende da escolha da ROC (anticausal: Re(s) < menor parte real; bilateral: faixa entre polos)"
    if not causal:
        res["estabilidade"] = "inconclusivo"
        res["explicacao"] = ("Sem a hipótese causal a ROC não é determinada pelos polos; "
                             "BIBO exige que a ROC contenha o eixo jω.")
    elif not propria:
        res["estabilidade"] = "inconclusivo"
        res["explicacao"] = ("H(s) imprópria (grau N > grau D): contém derivadores puros; "
                             "a classificação BIBO usual não se aplica com segurança.")
    elif direita:
        res["estabilidade"] = "instável"
        res["explicacao"] = "Há polo com Re(s) > 0: a ROC causal não contém o eixo jω."
    elif eixo:
        grupos = [g for g in _agrupar(eixo)]
        if any(len(g) > 1 for g in grupos):
            res["estabilidade"] = "instável"
            res["explicacao"] = "Polo repetido sobre o eixo jω: resposta cresce (ex.: t·sen ωt)."
        else:
            res["estabilidade"] = "marginalmente estável"
            res["explicacao"] = ("Polos simples sobre jω e demais no semiplano esquerdo: "
                                 "resposta limitada para a entrada nula, mas não BIBO estável "
                                 "(entrada limitada na frequência do polo gera saída ilimitada).")
    else:
        res["estabilidade"] = "estável"
        res["explicacao"] = "Todos os polos com Re(s) < 0: a ROC causal contém o eixo jω → BIBO estável."
    if abs(sigma) <= TOL * esc and not eixo:
        pass
    return res


def grafico(res):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    p, z = res["polos"], res["zeros"]
    pts = np.concatenate([p, z]) if len(z) else p
    xr = max(1.0, float(np.abs(pts.real).max())) * 1.3
    yr = max(1.0, float(np.abs(pts.imag).max())) * 1.3
    xmin, xmax = -xr, xr
    fig, ax = plt.subplots(figsize=(7.5, 5), dpi=110)
    ax.axvspan(xmin, 0, color="#2563eb", alpha=0.06)
    ax.axvspan(0, xmax, color="#dc2626", alpha=0.06)
    ax.text(xmin * .97, yr * .92, "semiplano esquerdo", fontsize=8, color="#1d4ed8")
    ax.text(xmax * .35, yr * .92, "semiplano direito", fontsize=8, color="#b91c1c")
    if res["causal"]:
        s = res["sigma_max"]
        ax.axvspan(s, xmax, color="#22d3ee", alpha=0.25, hatch="//", label=f"ROC causal: Re(s) > {s:.4g}")
        ax.axvline(s, color="#0891b2", ls="--", lw=1.2)
    ax.axhline(0, color="k", lw=.8); ax.axvline(0, color="k", lw=.8)
    ax.plot(p.real, p.imag, "x", ms=11, mew=2.2, color="#db2777", label="polos (X)")
    if len(z):
        ax.plot(z.real, z.imag, "o", ms=9, mfc="none", mew=2, color="#d97706", label="zeros (O)")
    for q in p:
        ax.annotate(f"{q.real:.3g}{q.imag:+.3g}j", (q.real, q.imag), fontsize=7,
                    xytext=(4, 6), textcoords="offset points")
    ax.set_xlim(xmin, xmax); ax.set_ylim(-yr, yr)
    ax.set_xlabel("Re(s)"); ax.set_ylabel("Im(s)"); ax.set_title("Plano s")
    ax.grid(alpha=.3); ax.legend(loc="lower left", fontsize=8)
    fig.tight_layout()
    return fig


def relatorio(res):
    f = lambda c: f"{c.real:.6g}" if abs(c.imag) < 1e-9 else f"{c.real:.6g}{c.imag:+.6g}j"
    L = ["RELATÓRIO DE ANÁLISE", f"N(s): {res['num']}  (ordem {res['ordem_num']})",
         f"D(s): {res['den']}  (ordem {res['ordem_den']})",
         "Zeros: " + (", ".join(f(z) for z in res["zeros"]) or "nenhum"),
         "Polos: " + ", ".join(f(p) for p in sorted(res["polos"], key=lambda c: -c.real)),
         f"Causalidade: {'causal (hipótese selecionada)' if res['causal'] else 'não assumida'}",
         f"ROC: {res['roc']}", f"Estabilidade: {res['estabilidade']}", res["explicacao"]]
    if res["cancelados"]:
        L.append("Cancelamentos polo-zero: " + ", ".join(f(c) for c in res["cancelados"]))
    return "\n".join(L)
