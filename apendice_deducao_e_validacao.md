# Apêndice — Dedução e validação do Projeto 5

## 0. Escopo e fontes

- Escopo: somente o Projeto 5 (Sistema de Refrigeração Criogênica por Pulso de Tubo).
- O PDF `proposta_do_projeto_transformada_de_laplace.pdf` **não estava anexado nesta conversa**. Valores, equações e coeficientes oficiais foram usados como transcritos no enunciado. Os critérios da página 11 foram usados como informados no prompt, sem conferência no documento.
- Verificações: álgebra de polinômios (NumPy), expansão simbólica (SymPy) e raízes com resíduo relativo.

## 1. Hipóteses adotadas

1. Linearização em torno de um estado de operação; pequenas variações de pressão e volume.
2. Processo adiabático na compressibilidade do gás: $C_f = \dfrac{V_0}{\gamma P_0}$.
3. Parâmetros constantes no tempo.
4. Força elétrica proporcional à tensão: $F_e = K_e v_c$ (modelo do enunciado).
5. Térmico linearizado, sem temperatura ambiente, como na equação do enunciado.
6. Condições iniciais nulas (Laplace unilateral) e entrada causal a partir de $t=0$.

## 2. Dedução das cinco equações

**Eq. 1 (pistão, 2ª Lei de Newton).** $\sum F = M_p a$, com sentido positivo na força elétrica:
$F_e - F_p - F_b - F_k = F_i$, onde $F_e = K_e v_c$, $F_p = A_p p_t$, $F_b = B_p v_p$, $F_k = K_p x_p$ e $F_i = M_p \dfrac{dv_p}{dt}$. Reorganizando:
$$M_p\frac{dv_p}{dt}+B_pv_p+K_px_p=K_ev_c-A_pp_t$$

**Eq. 2 (cinemática).** $v_p=\dfrac{dx_p}{dt}$, logo $\dfrac{dv_p}{dt}=\dfrac{d^2x_p}{dt^2}$. Substituindo na Eq. 1, a dinâmica do pistão passa a ser uma EDO de 2ª ordem em $x_p$.

**Eq. 3 (coluna de gás, inércia fluida).** Massa do gás no tubo: $m=\rho A_t\ell$, com $A_t$ a área transversal do tubo. Balanço de quantidade de movimento:
$$A_tp_t-A_tR_fv_f=\rho A_t\ell\cdot\frac{1}{A_t}\frac{dv_f}{dt}\;\Rightarrow\;p_t-R_fv_f=\frac{\rho\ell}{A_t}\frac{dv_f}{dt}$$
Com $L_f=\dfrac{\rho\ell}{A_t}$ (kg/m⁴, como na tabela):
$$\boxed{L_f\frac{dv_f}{dt}+R_fv_f=p_t}\qquad\text{(Modelo B)}$$
A equação impressa tem $A_pp_t$ no lado direito (Modelo A). Essa é a divergência tratada no apêndice (seção 3).

**Eq. 4 (compressibilidade).** Lei adiabática $PV^\gamma=\text{cte}$ linearizada: $\dfrac{dV}{V}=-\dfrac{1}{\gamma}\dfrac{dp}{P}$, logo $C_f=\dfrac{V_0}{\gamma P_0}$ (m⁵/N). Balanço de volume: vazão que entra menos vazão que sai é igual à taxa de armazenamento. Entra $A_pv_p$ (volume varrido pelo pistão) e sai $v_f$:
$$C_f\frac{dp_t}{dt}=A_pv_p-v_f$$

**Eq. 5 (regenerador, balanço de energia).** $C_{th}\dfrac{dT_f}{dt}=\Phi_{entra}-\Phi_{sai}-\Phi_{perda}$. O fluxo acústico transporta entalpia $\rho c_pTv_f$, que é o termo $K_{term}v_f$ com $K_{term}=\rho c_pT_m$. A perda linearizada é $\Phi_{perda}=H_rT_f$:
$$C_{th}\frac{dT_f}{dt}+H_rT_f=K_{term}v_f$$

## 3. Verificação dimensional

| Equação | Lado esquerdo | Lado direito | Homogênea? |
|---|---|---|---|
| Eq. 1 | N | N | sim |
| Eq. 2 | m/s | m/s | sim |
| Eq. 3 impressa (Modelo A): $L_f\dot v_f+R_fv_f=A_pp_t$ | Pa | N | **não** |
| Eq. 3 proposta (Modelo B): $L_f\dot v_f+R_fv_f=p_t$ | Pa | Pa | sim |
| Eq. 4 | m³/s | m³/s | sim |
| Eq. 5 com $K_{term}$ em K/(m³/s) (valor do enunciado) | W | K | **não** |
| Eq. 5 com $K_{term}$ em J/m³ = W/(m³/s) | W | W | sim |

Conclusão: o Modelo B é o único, entre os dois, que é dimensionalmente homogêneo. A unidade de $K_{term}$ do enunciado também precisa de confirmação. Os valores numéricos foram mantidos como fornecidos.

## 4. Eliminação das variáveis (Modelo B, operador $D=d/dt$)

Com $G(D)=C_{th}D+H_r$, $Q(D)=M_pD^2+B_pD+K_p$ e $D_B(D)=1+C_fD(L_fD+R_f)$:

1. Eq. 5: $v_f=\dfrac{G(D)\,T_f}{K_{term}}$.
2. Derivada: $Dv_f=\dfrac{D\,G(D)\,T_f}{K_{term}}$.
3. Eq. 3B: $p_t=(L_fD+R_f)v_f=\dfrac{(L_fD+R_f)G(D)\,T_f}{K_{term}}$.
4. Derivada da pressão: $Dp_t=(L_fD+R_f)\,Dv_f$.
5. Eq. 4 com a Eq. 3B: $A_pv_p=C_fDp_t+v_f=D_B(D)\,v_f$.
6. Derivando a Eq. 1 (com $Dx_p=v_p$), $x_p$ desaparece: $Q(D)\,v_p=K_eDv_c-A_pDp_t$.
7. Substituindo $v_p$ e $p_t$ e multiplicando por $A_p$: $N_B(D)\,v_f=A_pK_eDv_c$, com $N_B(D)=Q(D)D_B(D)+A_p^2D(L_fD+R_f)$.
8. Substituindo $v_f$ do passo 1: $G(D)\,N_B(D)\,T_f=d_1\,Dv_c$, com $d_1=K_eA_pK_{term}$.

Esse resultado é a EDO de quinta ordem, $\sum_{k=0}^{5}c_kD^kT_f=d_1Dv_c$.

## 5. Modelo A (equação impressa), para comparação

Com $D_A(s)=A_p+C_fs(L_fs+R_f)$ e $N_A(s)=(M_ps^2+B_ps+K_p)D_A(s)+A_p^2s(L_fs+R_f)$:
$$H_A(s)=\frac{K_eA_p^2K_{term}\,s}{(C_{th}s+H_r)\,N_A(s)}$$
Os coeficientes são calculados pelo mesmo programa (`--modelo A`).

## 6. Coeficientes

Expansão de $N_B(s)=n_4s^4+n_3s^3+n_2s^2+n_1s+n_0$, com $n_4=M_pC_fL_f$, $n_3=M_pC_fR_f+B_pC_fL_f$, $n_2=M_p+B_pC_fR_f+K_pC_fL_f+A_p^2L_f$, $n_1=B_p+K_pC_fR_f+A_p^2R_f$ e $n_0=K_p$. Então $c_k=C_{th}n_{k-1}+H_rn_k$.

| Coeficiente | Expressão literal (Modelo B) | Valor calculado | Enunciado | Modelo A |
|---|---|---:|---:|---:|
| $c_5$ | $M_pL_fC_fC_{th}$ | 0,0048 | 0,0048 | 0,0048 |
| $c_4$ | $M_pL_fC_fH_r+(M_pR_fC_f+B_pL_fC_f)C_{th}$ | 0,14792 | 0,14792 | 0,14792 |
| $c_3$ | $(M_pR_fC_f+B_pL_fC_f)H_r+(M_p+K_pL_fC_f+B_pR_fC_f+A_p^2L_f)C_{th}$ | 18,80258 | 18,80258 | 7,40258 |
| $c_2$ | $(M_p+K_pL_fC_f+B_pR_fC_f+A_p^2L_f)H_r+(B_p+K_pR_fC_f+A_p^2R_f)C_{th}$ | 227,117075 | 227,117075 | 149,407075 |
| $c_1$ | $(B_p+K_pR_fC_f+A_p^2R_f)H_r+K_pC_{th}$ | 15033,645 | 15033,645 | 772,245 |
| $c_0$ | $K_pH_r$ | 2250 | 2250 | 112,5 |
| $d_1$ | $K_eA_pK_{term}$ | 62,5 | 62,5 | 3,125 |

Verificações: erro relativo máximo do denominador em relação às expressões literais: $1{,}3\times10^{-16}$. Expansão simbólica (SymPy): **igual** às expressões literais do Modelo B.

## 7. Transformada de Laplace e $H(s)$

Com condições iniciais nulas, $\mathcal{L}\{f^{(n)}\}=s^nF(s)$. A EDO vira $(c_5s^5+\dots+c_0)T_f(s)=d_1sV_c(s)$, e
$$H(s)=\frac{T_f(s)}{V_c(s)}=\frac{d_1s}{c_5s^5+c_4s^4+c_3s^3+c_2s^2+c_1s+c_0}$$
Numérico (Modelo B): $H(s)=\dfrac{62{,}5\,s}{0{,}0048s^5+0{,}14792s^4+18{,}80258s^3+227{,}117075s^2+15033{,}645s+2250}$.

## 8. Parte II: zeros, polos, causalidade, estabilidade e ROC (Modelo B)

Resultados do programa `analise_polos_zeros.py` (resíduo relativo máximo das raízes: $1{,}5\times10^{-16}$):

| Raiz | Valor | Origem física (aproximada) |
|---|---|---|
| $z_1$ | $0$ | fator $d_1s$ no numerador |
| $p_1$ | $-0{,}15$ | térmica: $-H_r/C_{th}$ (exata; $\tau=C_{th}/H_r\approx6{,}7$ s) |
| $p_{2,3}$ | $-3{,}36468\pm j35{,}1733$ | compressor: $\omega_n=\sqrt{K_p/M_p}\approx35{,}4$ rad/s, $\zeta=\dfrac{B_p}{2\sqrt{K_pM_p}}\approx0{,}094$ |
| $p_{4,5}$ | $-11{,}9686\pm j48{,}5777$ | coluna de gás: para a coluna isolada, $\mathrm{Re}=-R_f/(2L_f)=-12$ e $\omega\approx48{,}5$ rad/s |

Os valores de referência do enunciado ($-0{,}15$; $-3{,}364684\pm j35{,}173304$; $-11{,}968649\pm j48{,}577673$) são reproduzidos com a precisão de arredondamento.

- **Causalidade:** a hipótese é realização física causal. $H(s)$ é racional e estritamente própria (grau 5 no denominador, grau 1 no numerador).
- **ROC:** $\operatorname{Re}(s)>-0{,}15$, com fronteira no polo térmico, o polo mais à direita.
- **Estabilidade:** os cinco polos estão no semiplano esquerdo e a ROC contém o eixo $j\omega$. Logo o sistema é BIBO estável.
- **Modelo A:** também é estável (polos $-3{,}335\pm j35{,}24$, $-7{,}612$, $-16{,}385$ e $-0{,}15$). A escolha entre A e B altera coeficientes e modos, mas não a estabilidade.

## 9. Limitações e pendências para confirmar com o professor

1. Forma da Eq. 3: $p_t$ (Modelo B, homogênea e compatível com os coeficientes) ou $A_pp_t$ (Modelo A, impressa e não homogênea).
2. Unidade de $K_{term}$: o enunciado usa K/(m³/s), mas a Eq. 5 exige J/m³ (= W/(m³/s)).
3. Os parâmetros são valores adotados pelo enunciado, não medidos.
4. A força elétrica é modelada como $K_ev_c$, uma simplificação do enunciado.
5. O modelo é linear e não inclui temperatura ambiente.

## 10. Como reproduzir

```
python3 analise_polos_zeros.py --modelo B
python3 analise_polos_zeros.py --modelo A
python3 gerar_apresentacao.py      # gera projeto5_apresentacao_final.html
```
