/*
 * analise_plano_s.js
 *
 * Módulo isolado do analisador de H(s) do Projeto 5.
 * Antes, este código estava embutido no final de
 * projeto5_apresentacao_modelo_A_validado.html.
 *
 * Responsabilidade:
 *   - ler numerador/denominador e a hipótese de causalidade;
 *   - calcular polos e zeros por raízes do polinômio;
 *   - cancelar polos e zeros coincidentes;
 *   - determinar a RDC e classificar a estabilidade:
 *     estável, instável, marginalmente estável ou inconclusivo;
 *   - desenhar o plano s no <canvas> da apresentação.
 *
 * Não usa bibliotecas externas. É carregado por um <script src> local
 * após o DOM da apresentação, mantendo a funcionalidade original.
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
      return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
    },
    abs: a => Math.hypot(a[0], a[1])
  };

  // ---------------------------------------------------------------------------
  // 3. Cálculo das raízes: zeros vêm do numerador, polos do denominador
  //    Método iterativo simultâneo (Durand-Kerner), igual ao código original.
  // ---------------------------------------------------------------------------
  function raizes(c) {
    const n = c.length - 1;
    if (n < 1) return [];

    // Normalização pelo coeficiente líder e raio inicial de busca.
    const a = c.map(x => x / c[0]);
    const R = 1 + Math.max(...a.slice(1).map(Math.abs));

    // Chutes iniciais distribuídos em torno de zero.
    let z = [...Array(n)].map((_, k) => [
      R * 0.7 * Math.cos(2 * Math.PI * k / n + 0.4),
      R * 0.7 * Math.sin(2 * Math.PI * k / n + 0.4)
    ]);

    // Avaliação do polinômio em x.
    const P = x => a.reduce((s, k) => C.add(C.mul(s, x), [k, 0]), [0, 0]);

    // Iterações até convergência ou limite de 500 passos.
    for (let it = 0; it < 500; it++) {
      let m = 0;
      z = z.map((zi, k) => {
        let d = [1, 0];
        z.forEach((zj, j) => {
          if (j !== k) d = C.mul(d, C.sub(zi, zj));
        });
        const dz = C.div(P(zi), d);
        m = Math.max(m, C.abs(dz));
        return C.sub(zi, dz);
      });
      if (m < 1e-13 * R) break;
    }

    // Zera componentes numericamente insignificantes para limpar a saída.
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
  // 5. Classificação da estabilidade a partir dos polos efetivos
  //    Regras mantidas exatamente como na versão embutida no HTML:
  //      - sem causalidade assumida ou H(s) imprópria -> inconclusivo;
  //      - polo no semiplano direito -> instável;
  //      - polo repetido sobre jω -> instável;
  //      - polos simples sobre jω -> marginalmente estável;
  //      - todos com Re(s) < 0 -> estável (BIBO, com RDC contendo jω).
  // ---------------------------------------------------------------------------
  function classificar(polosEfetivos, numerador, denominador, causal) {
    const sig = polosEfetivos.length
      ? Math.max(...polosEfetivos.map(p => p[0]))
      : -Infinity;
    const esc = Math.max(1, ...polosEfetivos.map(C.abs));
    const tol = 1e-6 * esc;

    const sobreEixo = polosEfetivos.filter(p => Math.abs(p[0]) <= tol);
    const direita = polosEfetivos.filter(p => p[0] > tol);

    const repetido = sobreEixo.some((p, a) =>
      sobreEixo.some((q, b) =>
        a !== b && C.abs(C.sub(p, q)) <= 1e-4 * Math.max(1, C.abs(p))
      )
    );

    let est, col, ex;
    if (!causal) {
      est = "inconclusivo";
      col = "#fbbf24";
      ex = "Sem hipótese causal a RDC não é fixada pelos polos.";
    } else if (numerador.length > denominador.length) {
      est = "inconclusivo";
      col = "#fbbf24";
      ex = "H(s) imprópria (grau N > grau D).";
    } else if (direita.length) {
      est = "instável";
      col = "#f87171";
      ex = "Polo com Re(s) > 0.";
    } else if (sobreEixo.length) {
      if (repetido) {
        est = "instável";
        col = "#f87171";
        ex = "Polo repetido sobre jω.";
      } else {
        est = "marginalmente estável";
        col = "#fbbf24";
        ex = "Polos simples sobre jω; não é BIBO estável.";
      }
    } else {
      est = "estável";
      col = "#34d399";
      ex = "Todos Re(s) < 0; RDC contém jω (BIBO estável).";
    }

    return { est, col, ex, sig };
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
    if (sig !== null) {
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

    if (sig !== null) {
      ctx.fillStyle = "#0e7490";
      ctx.fillText("RDC: Re(s) > " + (sig.toFixed(4) * 1), Math.min(X(sig) + 6, W - 150), H - 8);
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
      ctx.arc(X(z[0]), Y(z[1]), 7, 0, 7);
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
    return p[0].toFixed(6) * 1 +
      (Math.abs(p[1]) < 1e-9
        ? ""
        : (p[1] < 0 ? "−" : "+") + Math.abs(p[1]).toFixed(6) * 1 + "j");
  }

  function executar() {
    el.mensagem.textContent = "";
    el.saida.innerHTML = "";

    try {
      const n = removerZerosIniciais(interpretarCoeficientes(el.numerador.value, "Numerador"));
      const d = removerZerosIniciais(interpretarCoeficientes(el.denominador.value, "Denominador"));

      if (!d.length) throw "Denominador nulo: divisão por zero.";
      if (d.length < 2) throw "Denominador constante: não há polos.";
      if (!n.length) throw "Numerador nulo: H(s)=0.";

      // Zeros = raízes do numerador; polos = raízes do denominador.
      const zeros = n.length > 1 ? raizes(n) : [];
      const polos = raizes(d);

      // Cancelamento de polo e zero coincidentes para a análise de RDC/estabilidade.
      const polosEfetivos = [...polos];
      const zerosEfetivos = [...zeros];
      zeros.forEach(z => {
        const k = polosEfetivos.findIndex(p =>
          C.abs(C.sub(z, p)) <= 1e-6 * Math.max(1, C.abs(p))
        );
        if (k >= 0) {
          polosEfetivos.splice(k, 1);
          zerosEfetivos.splice(zerosEfetivos.indexOf(z), 1);
        }
      });

      const causal = el.causal.checked;
      const resultado = classificar(polosEfetivos, n, d, causal);

      el.saida.innerHTML =
        "<p><b>Ordem:</b> N " + (n.length - 1) + ", D " + (d.length - 1) + "</p>" +
        "<p><b>Zeros:</b> " + (zeros.map(formatarRaiz).join("; ") || "nenhum") + "</p>" +
        "<p><b>Polos:</b> " + [...polos].sort((a, b) => b[0] - a[0]).map(formatarRaiz).join("; ") + "</p>" +
        "<p><b>RDC (Região de Convergência):</b> " +
          (causal ? "Re(s) &gt; " + resultado.sig.toFixed(6) * 1 : "depende da RDC escolhida") +
        "</p>" +
        "<p><span class='badge' style='background:" + resultado.col + "'>" +
          resultado.est.toUpperCase() + "</span> " + resultado.ex + "</p>";

      // O desenho mantém todos os polos calculados, como na versão original.
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
  el.executar.onclick = executar;
  el.numerador.oninput = el.denominador.oninput = el.causal.onchange = executar;

  el.restaurar.onclick = () => {
    el.numerador.value = "3.125, 0";
    el.denominador.value = "0.0048, 0.14792, 7.40258, 149.407075, 772.245, 112.5";
    el.causal.checked = true;
    executar();
  };

  el.limpar.onclick = () => {
    el.numerador.value = "";
    el.denominador.value = "";
    executar();
  };

  // API opcional para reutilização/testes fora da apresentação.
  window.AnalisePlanoS = Object.freeze({
    raizes,
    classificar,
    desenhar,
    executar
  });

  executar();
})();
