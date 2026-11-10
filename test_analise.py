import numpy as np, analise_sistemas as a, analise_polos_zeros as m
DEN=[0.0048,0.14792,18.80258,227.117075,15033.645,2250]
def srt(x): return sorted(x,key=lambda c:(round(c.real,6),round(c.imag,6)))
def t1():
    r=a.analisar([62.5,0],DEN)
    ref=[-0.15,-3.364684+35.173304j,-3.364684-35.173304j,-11.968649+48.577673j,-11.968649-48.577673j]
    assert np.allclose(srt(r["polos"]),srt(ref),atol=2e-6), r["polos"]
    assert np.allclose(r["zeros"],[0]) and r["estabilidade"]=="estável" and r["roc"]=="Re(s) > -0.15"
def t1b():
    nA,dA=m.funcao_transferencia("A"); nB,dB=m.funcao_transferencia("B")
    assert np.allclose(dB.coeffs,[0.0048,0.14792,18.80258,227.117075,15033.645,2250])
    assert np.allclose(dA.coeffs,[0.0048,0.14792,7.40258,149.407075,772.245,112.5])
    assert np.isclose(nB.coeffs[0],62.5) and np.isclose(nA.coeffs[0],3.125)
    c,d1=m.coeficientes_literais_B(); assert np.allclose(dB.coeffs,c)
def t2():
    r2=a.analisar([62.5,0],[0.0048,0.14792,18.80258,227.117075,15033.645,4500])
    assert not np.isclose(r2["sigma_max"],-0.15)
def t3():
    for n,d in (("abc","1 2"),("","1 2"),("1","1 nan"),("1","1,x")):
        try: a.analisar(a.ler_coeficientes(n,"N"),a.ler_coeficientes(d,"D")); assert 0
        except a.EntradaInvalida: pass
    for n,d in (([1],[0,0]),([0],[1,1])):
        try: a.analisar(n,d); assert 0
        except a.EntradaInvalida: pass
def t4(): assert a.analisar([1],[1,3,2])["estabilidade"]=="estável"
def t5(): assert a.analisar([1],[1,-1,-2])["estabilidade"]=="instável"
def t6():
    assert a.analisar([1],[1,0,4])["estabilidade"]=="marginalmente estável"
    assert a.analisar([1],[1,0,8,0,16])["estabilidade"]=="instável"   # (s²+4)² repetido
    assert a.analisar([1],[1,0])["estabilidade"]=="marginalmente estável"
    assert a.analisar([1,0],[1,1,0])["estabilidade"]=="estável"        # cancelamento s/s
def t7():
    assert a.analisar([1],[1,1])["ordem_den"]==1 and a.analisar([1],[1,2,3,4,5,6,7])["ordem_den"]==6
    assert a.analisar([1,0,0],[1,1])["estabilidade"]=="inconclusivo"   # imprópria
    assert a.analisar([1],[1,1],causal=False)["estabilidade"]=="inconclusivo"
    a.grafico(a.analisar([1],[1,2,5]))
if __name__=="__main__":
    for t in (t1,t1b,t2,t3,t4,t5,t6,t7): t(); print("OK",t.__name__)
