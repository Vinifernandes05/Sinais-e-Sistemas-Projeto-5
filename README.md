# Projeto 5 — Sinais e Sistemas

**Tema:** Sistema de Refrigeração Criogênica por Pulso de Tubo para sensores de satélites quânticos  
**Professor:** Artur Passos Dias Lima  
**Equipe:** Vinicius Fernandes, Marcos Menezes, Rafael Guerra, Rian Dutra, Leonardo Magalhães

## Resumo

Modelagem da tensão no compressor $v_c(t)$ até a temperatura na extremidade fria $T_f(t)$ de um refrigerador criogênico de pulso de tubo. O sistema é composto por três subsistemas em cascata — compressor linear eletrodinâmico, coluna de gás hélio e regenerador térmico poroso — totalizando 5 estados e, portanto, uma EDO de 5ª ordem.

O objetivo é obter a função de transferência $H(s)=T_f(s)/V_c(s)$ e analisar seus polos, zeros, região de convergência (RDC/ROC) e estabilidade BIBO.

## Modelo e resultados principais

Duas formulações são comparadas, divergindo apenas na forma da equação de inércia fluida (Eq. 3):

- **Modelo A** (com $A_p p_t$) — adotado e validado na apresentação final:

$$H_A(s)=\frac{3{,}125\,s}{0{,}0048s^5+0{,}14792s^4+7{,}40258s^3+149{,}407075s^2+772{,}245s+112{,}5}$$

- **Modelo B** (com $p_t$, homogêneo) — comparativo:

$$H_B(s)=\frac{62{,}5\,s}{0{,}0048s^5+0{,}14792s^4+18{,}80258s^3+227{,}117075s^2+15033{,}645s+2250}$$

Ambos possuem zero em $s=0$, RDC causal $Re(s)>-0{,}15$ e são **BIBO estáveis**: a escolha altera coeficientes e modos (polos), não a estabilidade. No Modelo A os polos da coluna de gás são reais ($-7{,}61$ e $-16{,}39$); no Modelo B, formam um par complexo ($-11{,}97\pm j48{,}58$).

## Estrutura do projeto

| Arquivo | Descrição |
|---|---|
| `projeto5_apresentacao_modelo_A_validado.html` | Apresentação final (19 slides, com analisador de polos/zeros em JavaScript) |
| `gerar_apresentacao.py` | Gera a apresentação a partir de um template, incorporando figuras e tabelas |
| `test_analise.py` | Testes automatizados dos módulos de análise |
| `requirements.txt` | Dependências Python |
| `imagens/` | Figuras usadas na apresentação |

## Como usar

1. Abra `projeto5_apresentacao_modelo_A_validado.html` no navegador. Navegue com ←/→, espaço ou PageUp/PageDown; use `F` para tela cheia. O analisador embutido permite digitar numerador/denominador e visualizar polos, zeros e RDC.
2. Para executar os scripts, instale as dependências:

```bash
pip install -r requirements.txt
python test_analise.py
python gerar_apresentacao.py
```

> Observação: `gerar_apresentacao.py` e `test_analise.py` dependem de arquivos auxiliares (template HTML, JSONs de resultados e módulos `analise_sistemas.py` / `analise_polos_zeros.py`) que não acompanham esta pasta. A apresentação HTML já está pronta para uso independente deles.

## Dependências

`numpy`, `scipy`, `matplotlib`, `streamlit` (versões mínimas em `requirements.txt`).
