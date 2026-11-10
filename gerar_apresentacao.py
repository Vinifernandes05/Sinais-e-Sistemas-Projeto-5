#!/usr/bin/env python3
"""Gera projeto5_apresentacao_final.html.

Lê projeto5_template.html, incorpora as figuras de imagens/ (base64) e preenche as tabelas
com os resultados da Parte II (resultados_modelo_A.json e resultados_modelo_B.json),
produzidos por analise_polos_zeros.py. Nenhum número das tabelas é digitado à mão.

Uso, na pasta deste script:
  python3 analise_polos_zeros.py --modelo A
  python3 analise_polos_zeros.py --modelo B
  python3 gerar_apresentacao.py
"""
import base64
import json
from pathlib import Path

PASTA = Path(__file__).resolve().parent
FIGURAS = {
    "{{COMPRESSOR}}": "imagens/compressor.png",
    "{{COLUNA_HELIO}}": "imagens/coluna_helio.png",
    "{{REGENERADOR}}": "imagens/regenerador.png",
    "{{PLANO_S}}": "imagens/plano_s_modelo_B.png",
}
NOMES_C = ["c<sub>5</sub>", "c<sub>4</sub>", "c<sub>3</sub>", "c<sub>2</sub>", "c<sub>1</sub>", "c<sub>0</sub>"]


def num(x):
    """Número no padrão brasileiro, sem zeros desnecessários."""
    texto = f"{x:.6f}".rstrip("0").rstrip(".")
    if texto in ("", "-0"):
        texto = "0"
    return texto.replace(".", ",")


def imagem(caminho):
    dados = base64.b64encode((PASTA / caminho).read_bytes()).decode("ascii")
    return f"data:image/png;base64,{dados}"


def origem(parte_real, parte_imag):
    """Origem física aproximada de cada polo (ver apêndice)."""
    if abs(parte_imag) < 1e-9 and abs(parte_real + 0.15) < 1e-6:
        return "térmica: −<span class='f'><span>H<sub>r</sub></span><span>C<sub>th</sub></span></span>"
    if abs(parte_imag) >= 1e-9 and parte_real > -5:
        return "compressor (massa-mola-amortecedor)"
    if abs(parte_imag) >= 1e-9:
        return "coluna de gás (ressonância acústica)"
    return "—"


def tabela_coeficientes(B):
    linhas = [f"<tr><td>{n}</td><td>{num(v)}</td></tr>" for n, v in zip(NOMES_C, B["denominador"])]
    linhas.append(f"<tr><td>d<sub>1</sub></td><td>{num(B['numerador'][0])}</td></tr>")
    return ('<table class="tab"><tr><th>Coeficiente</th><th>Valor (Modelo B)</th></tr>'
            + "".join(linhas) + "</table>")


def tabela_polos(B):
    linhas = [f"<tr><td>z<sub>1</sub> (zero)</td><td>{num(B['zeros'][0][0])}</td>"
              f"<td>0</td><td>numerador d<sub>1</sub>s</td></tr>"]
    for i, (re_, im_) in enumerate(sorted(B["polos"], key=lambda q: -q[0]), 1):
        parte_im = "0" if abs(im_) < 1e-9 else ("+" if im_ > 0 else "−") + num(abs(im_))
        linhas.append(f"<tr><td>p<sub>{i}</sub></td><td>{num(re_)}</td><td>{parte_im}</td>"
                      f"<td>{origem(re_, im_)}</td></tr>")
    return ('<table class="tab"><tr><th>Raiz</th><th>Parte real</th><th>Parte imaginária</th>'
            '<th>Origem física (aproximada)</th></tr>' + "".join(linhas) + "</table>")


def tabela_ab(A, B):
    linhas = [f"<tr><td>{n}</td><td>{num(a)}</td><td>{num(b)}</td></tr>"
              for n, a, b in zip(NOMES_C, A["denominador"], B["denominador"])]
    linhas.append(f"<tr><td>d<sub>1</sub></td><td>{num(A['numerador'][0])}</td>"
                  f"<td>{num(B['numerador'][0])}</td></tr>")
    return ('<table class="tab"><tr><th>Coeficiente</th><th>Modelo A (impresso)</th>'
            '<th>Modelo B (proposto)</th></tr>' + "".join(linhas) + "</table>")


def main():
    A = json.loads((PASTA / "resultados_modelo_A.json").read_text(encoding="utf-8"))
    B = json.loads((PASTA / "resultados_modelo_B.json").read_text(encoding="utf-8"))
    html = (PASTA / "projeto5_template.html").read_text(encoding="utf-8")
    for marcador, caminho in FIGURAS.items():
        assert marcador in html, f"marcador ausente: {marcador}"
        html = html.replace(marcador, imagem(caminho))
    tabelas = {"{{TABELA_COEF}}": tabela_coeficientes(B),
               "{{TABELA_POLOS}}": tabela_polos(B),
               "{{TABELA_AB}}": tabela_ab(A, B)}
    for marcador, conteudo in tabelas.items():
        assert marcador in html, f"marcador ausente: {marcador}"
        html = html.replace(marcador, conteudo)
    assert "{{" not in html, "há marcadores não preenchidos"
    saida = PASTA / "projeto5_apresentacao_final.html"
    saida.write_text(html, encoding="utf-8")
    print(f"OK: {saida.name} gerado ({saida.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
