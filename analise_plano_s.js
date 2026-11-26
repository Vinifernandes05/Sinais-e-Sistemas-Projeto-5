/*
 * analise_plano_s.js
 *
 * Módulo isolado do analisador de H(s) do Projeto 5.
 * Classificação estrita de estabilidade no plano s:
 *   - estável
 *   - marginalmente estável
 *   - instável
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. Elementos da interface fornecidos pelo HTML
  // ---------------------------------------------------------------------------
  const el = {
    numerador: document.getElementById("inN"),
    denominador: document.getElementById("inD"),
    causal: document.getElementById("inC"),
    executar: document.getElementById("bRun"),
    restaurar: document.getElementById("bRes"),
    limpar: document.getElementById("bClr"),
    mensagem: document.getElementById("msg"),
    saida: document.getElementById("out"),
    canvas: document.getElementById("cv")
  };

  if (!el.canvas || !el.mensagem || !el.saida) {
    console.error("[analise_plano_s] Campos do analisador não encontrados no HTML.");
    return;
  }

  const ctx = el.canvas.getContext("2d");
  if (!ctx) {
    console.error("[analise_plano_s] Não foi possível obter o contexto 2d do canvas.");
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Aritmética complexa mínima, usada pelas raízes e pelo desenho
  // ---------------------------------------------------------------------------
  const C = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => {
      const d = b[0] * b[0] + b[1] * b[1];
      if (d === 0) return [0, 0];
      return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
    },
    abs: a => Math.hypot(a[0], a[1])
  };

  // ---------------------------------------------------------------------------
  // 3. Cálculo das raízes (Durand-Kerner)
  // ---------------------------------------------------------------------------
  function raizes(c) {
    const n = c.length - 1;
    if (n < 1) return [];

    const a = c.map(x => x / c[0]);
    const R = 1 + Math.max(...a.slice(1).map(Math.abs));

    let z = [...Array(n)].map((_, k) => [
      R * 0.7 * Math.cos(2 * Math.PI * k / n + 0.4),
      R * 0.7 * Math.sin(2 * Math.PI * k / n + 0.4)
    ]);

    const P = x => a.reduce((s, k) => C.add(C.mul(s, x), [k, 0]), [0, 0]);

    for (let it = 0; it < 500; it++) {
      let m = 0;
      z = z.map((zi, k) => {
        let d = [1, 0];
        for (let j = 0; j < z.length; j++) {
          if (j !== k) d = C.mul(d, C.sub(zi, z[j]));
        }
        const dz = C.div(P(zi), d);
        m = Math.max(m, C.abs(dz));
        return C.sub(zi, dz);
      });
      if (m < 1e-13 * R) break;
    }

    return z.map(x => [
      Math.abs(x[0]) < 1e-9 ? 0 : x[0],
      Math.abs(x[1]) < 1e-9 ? 0 : x[1]
    ]);
  }

  // ---------------------------------------------------------------------------
  // 4. Leitura e normalização dos coeficientes digitados
  // ---------------------------------------------------------------------------
  function interpretarCoeficientes(texto, nome) {
    const partes = texto.trim().split(/[\s,;\[\]]+/).filter(Boolean);
    if (!partes.length) throw nome + ": campo vazio.";

    return partes.map(s => {
      const v = Number(s.replace(",", "."));
      if (!isFinite(v)) throw nome + ": '" + s + "' não é um número válido.";
      return v;
    });
  }

  function removerZerosIniciais(c) {
    let k = 0;
    while (k < c.length && c[k] === 0) k++;
    return c.slice(k);
  }

  // ---------------------------------------------------------------------------
  // 5. Classificação estrita da estabilidade (sem estado "inconclusivo")
  //    Ordem de prioridade (critério do plano s para sistema causal):
  //      1) Polo efetivo com Re(s) > 0                -> instável
  //      2) Polo efetivo repetido sobre jω            -> instável
  //      3) H(s) imprópria (grau N > grau D)          -> instável
  //      4) Polo(s) efetivo(s) simples sobre jω       -> marginalmente estável
  //      5) Todos com Re(s) < 0 (ou ganho constante)  -> estável
  // ---------------------------------------------------------------------------
  function classificar(polosEfetivos, numerador, denominador, causal) {
    const grauN = numerador.length - 1;
    const grauD = denominador.length - 1;
    const impropria = grauN > grauD;

    const sig = polosEfetivos.length
      ? Math.max(...polosEfetivos.map(p => p[0]))
      : null;

    const esc = Math.max(1, ...polosEfetivos.map(C.abs));
    const tol = 1e-5 * esc;

    const sobreEixo = polosEfetivos.filter(p => Math.abs(p[0]) <= tol);
    const direita = polosEfetivos.filter(p => p[0] > tol);

    let repetido = false;
    for (let i = 0; i < sobreEixo.length; i++) {
      for (let j = i + 1; j < sobreEixo.length; j++) {
        const dist = C.abs(C.sub(sobreEixo[i], sobreEixo[j]));
        if (dist <= 1e-4 * Math.max(1, C.abs(sobreEixo[i]))) {
          repetido = true;
        }
      }
    }

    const avisoCausal = causal
      ? ""
      : " (Critério causal padrão adotado para a classificação no plano s.)";

    let est, col, ex;

    if (direita.length > 0) {
      est = "instável";
      col = "#f87171";
      ex = impropria
        ? "Polo(s) com Re(s) > 0 no semiplano direito e H(s) imprópria (grau N > grau D)."
        : "Polo(s) com Re(s) > 0 no semiplano direito.";
    } else if (repetido) {
      est = "instável";
      col = "#f87171";
      ex = impropria
        ? "Polo repetido sobre jω e H(s) imprópria (grau N > grau D)."
        : "Polo repetido sobre o eixo imaginário (jω).";
    } else if (impropria) {
      est = "instável";
      col = "#f87171";
      ex = "H(s) imprópria (grau N > grau D): ação derivativa pura / polo no infinito (não é BIBO estável).";
    } else if (sobreEixo.length > 0) {
      est = "marginalmente estável";
      col = "#fbbf24";
      ex = "Polo(s) simples sobre o eixo imaginário (jω) e nenhum no semiplano direito; não é BIBO estável.";
    } else {
      est = "estável";
      col = "#34d399";
      ex = polosEfetivos.length
        ? "Todos os polos efetivos têm Re(s) < 0; RDC contém jω (BIBO estável)."
        : "Sem polos efetivos e H(s) própria (ganho constante; BIBO estável).";
    }

    return { est, col, ex: ex + avisoCausal, sig };
  }

  // ---------------------------------------------------------------------------
  // 6. Desenho do plano s: × polos, ○ zeros, eixos e RDC
  // ---------------------------------------------------------------------------
  function desenhar(polos, zeros, sig) {
    const W = el.canvas.width;
    const H = el.canvas.height;
    const todos = [...polos, ...zeros];
    const xr = Math.max(1, ...todos.map(p => Math.abs(p[0]))) * 1.3;
    const yr = Math.max(1, ...todos.map(p => Math.abs(p[1]))) * 1.3;

    const X = x => (x + xr) / (2 * xr) * W;
    const Y = y => H / 2 - y / yr * H / 2;

    ctx.clearRect(0, 0, W, H);

    // Fundo: semiplano esquerdo e direito.
    ctx.fillStyle = "#dbeafe55";
    ctx.fillRect(0, 0, X(0), H);
    ctx.fillStyle = "#fee2e255";
    ctx.fillRect(X(0), 0, W - X(0), H);

    // Faixa da RDC (Re(s) > polo mais à direita).
    if (sig !== null && isFinite(sig)) {
      ctx.fillStyle = "#22d3ee55";
      ctx.fillRect(X(sig), 0, W - X(sig), H);
      ctx.strokeStyle = "#0891b2";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(X(sig), 0);
      ctx.lineTo(X(sig), H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Eixos reais e imaginários.
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, Y(0));
    ctx.lineTo(W, Y(0));
    ctx.moveTo(X(0), 0);
    ctx.lineTo(X(0), H);
    ctx.stroke();

    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#1d4ed8";
    ctx.fillText("semiplano esquerdo", 8, 16);
    ctx.fillStyle = "#b91c1c";
    ctx.fillText("semiplano direito", W - 130, 16);

    if (sig !== null && isFinite(sig)) {
      ctx.fillStyle = "#0e7490";
      ctx.fillText(
        "RDC: Re(s) > " + Number(sig.toFixed(4)),
        Math.min(X(sig) + 6, W - 150),
        H - 8
      );
    }

    // Polos: cruzes; zeros: círculos.
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#db2777";
    polos.forEach(p => {
      const x = X(p[0]);
      const y = Y(p[1]);
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 7);
      ctx.lineTo(x + 7, y + 7);
      ctx.moveTo(x + 7, y - 7);
      ctx.lineTo(x - 7, y + 7);
      ctx.stroke();
      ctx.fillStyle = "#111";
      ctx.font = "11px sans-serif";
      ctx.fillText(
        p[0].toFixed(2) + (p[1] ? (p[1] < 0 ? "−" : "+") + Math.abs(p[1]).toFixed(2) + "j" : ""),
        x + 8,
        y - 8
      );
    });

    ctx.strokeStyle = "#d97706";
    zeros.forEach(z => {
      ctx.beginPath();
      ctx.arc(X(z[0]), Y(z[1]), 7, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#db2777";
    ctx.fillText("× polos", 8, H - 24);
    ctx.fillStyle = "#d97706";
    ctx.fillText("○ zeros", 8, H - 8);
  }

  // ---------------------------------------------------------------------------
  // 7. Orquestração: ler -> calcular -> classificar -> mostrar -> desenhar
  // ---------------------------------------------------------------------------
  function formatarRaiz(p) {
    return Number(p[0].toFixed(6)) +
      (Math.abs(p[1]) < 1e-9
        ? ""
        : (p[1] < 0 ? "−" : "+") + Number(Math.abs(p[1]).toFixed(6)) + "j");
  }

  function executar() {
    el.mensagem.textContent = "";
    el.saida.innerHTML = "";

    try {
      const n = removerZerosIniciais(interpretarCoeficientes(el.numerador.value, "Numerador"));
      const d = removerZerosIniciais(interpretarCoeficientes(el.denominador.value, "Denominador"));

      if (!d.length) throw "Denominador nulo: divisão por zero.";
      if (!n.length) throw "Numerador nulo: H(s)=0.";

      const zeros = n.length > 1 ? raizes(n) : [];
      const polos = d.length > 1 ? raizes(d) : [];

      // Cancelamento de polo e zero coincidentes para a análise de RDC/estabilidade.
      const polosEfetivos = [...polos];
      const zerosEfetivos = [...zeros];
      for (let i = 0; i < zeros.length; i++) {
        const z = zeros[i];
        const k = polosEfetivos.findIndex(p =>
          C.abs(C.sub(z, p)) <= 1e-5 * Math.max(1, C.abs(p))
        );
        if (k >= 0) {
          polosEfetivos.splice(k, 1);
          zerosEfetivos.splice(zerosEfetivos.indexOf(z), 1);
        }
      }

      const causal = el.causal ? el.causal.checked : true;
      const resultado = classificar(polosEfetivos, n, d, causal);

      const textoRdc = !causal
        ? "Depende da RDC escolhida"
        : (resultado.sig === null
            ? "todo o plano s (sem polos efetivos)"
            : "Re(s) &gt; " + Number(resultado.sig.toFixed(6)));

      el.saida.innerHTML =
        "<p><b>Ordem:</b> N " + (n.length - 1) + ", D " + (d.length - 1) + "</p>" +
        "<p><b>Zeros:</b> " + (zeros.map(formatarRaiz).join("; ") || "nenhum") + "</p>" +
        "<p><b>Polos:</b> " + ([...polos].sort((a, b) => b[0] - a[0]).map(formatarRaiz).join("; ") || "nenhum") + "</p>" +
        "<p><b>RDC (Região de Convergência):</b> " + textoRdc + "</p>" +
        "<p><span class='badge' style='background:" + resultado.col + "'>" +
          resultado.est.toUpperCase() + "</span> " + resultado.ex + "</p>";

      // Só desenha a faixa azul da RDC quando "Assumir sistema causal" estiver marcado.
      desenhar(polos, zeros, causal ? resultado.sig : null);
    } catch (erro) {
      el.mensagem.innerHTML =
        "<span class='badge' style='background:#f87171'>Erro</span> " + erro;
      ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Ligações com os controles e execução inicial
  // ---------------------------------------------------------------------------
  if (el.executar) el.executar.onclick = executar;
  if (el.numerador) el.numerador.oninput = executar;
  if (el.denominador) el.denominador.oninput = executar;
  if (el.causal) el.causal.onchange = executar;

  if (el.restaurar) {
    el.restaurar.onclick = () => {
      el.numerador.value = "3.125, 0";
      el.denominador.value = "0.0048, 0.14792, 7.40258, 149.407075, 772.245, 112.5";
      if (el.causal) el.causal.checked = true;
      executar();
    };
  }

  if (el.limpar) {
    el.limpar.onclick = () => {
      el.numerador.value = "";
      el.denominador.value = "";
      executar();
    };
  }

  window.AnalisePlanoS = Object.freeze({
    raizes,
    classificar,
    desenhar,
    executar
  });

  executar();
})();