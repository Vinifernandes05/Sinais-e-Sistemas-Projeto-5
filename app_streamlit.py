"""Interface: streamlit run app_streamlit.py"""
import streamlit as st
from analise_sistemas import analisar, grafico, ler_coeficientes, relatorio, EntradaInvalida
import analise_polos_zeros as m

NUM_P5, DEN_P5 = "62.5, 0", "0.0048, 0.14792, 18.80258, 227.117075, 15033.645, 2250"
st.set_page_config(page_title="Projeto 5 · Polos e zeros", layout="wide")
st.title("Análise de H(s): polos, zeros, ROC e estabilidade")
st.session_state.setdefault("num", NUM_P5); st.session_state.setdefault("den", DEN_P5)
c1, c2, c3, c4 = st.columns(4)
if c1.button("Restaurar Projeto 5 (Modelo B)"):
    st.session_state.update(num=NUM_P5, den=DEN_P5)
if c2.button("Modelo A (impresso)"):
    n, d = m.funcao_transferencia("A")
    st.session_state.update(num=", ".join(map(str, n.coeffs)), den=", ".join(map(str, d.coeffs)))
if c3.button("Limpar"):
    st.session_state.update(num="", den="")
st.text_input("Numerador (ordem decrescente de s)", key="num")
st.text_input("Denominador (ordem decrescente de s)", key="den")
causal = st.checkbox("Assumir sistema causal (ROC à direita do polo mais à direita)", True)
if c4.button("Executar análise", type="primary") or True:
    try:
        r = analisar(ler_coeficientes(st.session_state.num, "Numerador"),
                     ler_coeficientes(st.session_state.den, "Denominador"), causal)
    except EntradaInvalida as e:
        st.error(str(e)); st.stop()
    cor = {"estável": st.success, "instável": st.error}.get(r["estabilidade"], st.warning)
    cor(f"**{r['estabilidade'].upper()}** — {r['explicacao']}")
    a, b = st.columns([1, 1])
    a.pyplot(grafico(r))
    b.code(relatorio(r))
    b.caption("Causalidade depende da ROC escolhida; os polos sozinhos não a determinam.")
