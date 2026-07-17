import { $, bind, openApp } from "../ui.js";

let expression = "";

function safeCalculate(value) {
  const normalized = value.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  if (!/^[\d+\-*/().%\s]+$/.test(normalized)) throw new Error("算式包含無法辨識的內容");
  const percent = normalized.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
  const result = Function(`"use strict"; return (${percent})`)();
  if (!Number.isFinite(result)) throw new Error("無法計算");
  return Math.round((result + Number.EPSILON) * 1e10) / 1e10;
}

function understand(text) {
  let value = text.trim()
    .replace(/[，,]/g, "")
    .replace(/(\d+(?:\.\d+)?)\s*萬/g, "($1*10000)")
    .replace(/(\d+(?:\.\d+)?)\s*億/g, "($1*100000000)")
    .replace(/\+\s*(\d+(?:\.\d+)?)%\s*(?:稅|服務費)?/g, "* (1+$1/100)")
    .replace(/(?:再)?加\s*(\d+(?:\.\d+)?)%\s*(?:稅|服務費)?/g, "* (1+$1/100)")
    .replace(/加上?|再加/g, "+")
    .replace(/減去?|再減/g, "-")
    .replace(/乘以?|×/g, "*")
    .replace(/除以?|÷/g, "/")
    .replace(/打([一二三四五六七八九])折/g, (_, n) => `*0.${"一二三四五六七八九".indexOf(n) + 1}`)
    .replace(/(\d+(?:\.\d+)?)\s*的\s*(\d+(?:\.\d+)?)%/g, "$1*$2/100")
    .replace(/[元是多少等於?？]/g, "");
  return { expression: value, result: safeCalculate(value) };
}

function renderResult(result, explanation = "") {
  $("calcDisplay").textContent = result;
  $("calcExplain").textContent = explanation;
}

export const calculatorApp = {
  title: "計算機",
  open() {
    openApp(this.title, `
      <div class="calculator">
        <div class="calc-screen"><small id="calcExplain">可輸入算式或使用下方微 AI</small><strong id="calcDisplay">${expression || "0"}</strong></div>
        <div class="calc-grid">${["AC","(",")","÷","7","8","9","×","4","5","6","−","1","2","3","+","0",".","⌫","="].map((key) => `<button data-calc="${key}" class="${["÷","×","−","+","="].includes(key) ? "operator" : ""}">${key}</button>`).join("")}</div>
        <div class="ai-calc"><input id="aiCalcInput" placeholder="例如：1200 打八折再加 5% 稅"><button id="askCalculator">計算</button></div>
      </div>`);
    document.querySelectorAll("[data-calc]").forEach((button) => bind(button, () => {
      const key = button.dataset.calc;
      if (key === "AC") expression = "";
      else if (key === "⌫") expression = expression.slice(0, -1);
      else if (key === "=") {
        try { renderResult(safeCalculate(expression), `${expression} =`); } catch (error) { renderResult("錯誤", error.message); }
        return;
      } else expression += key;
      renderResult(expression || "0", "");
    }));
    bind($("askCalculator"), () => {
      try {
        const answer = understand($("aiCalcInput").value);
        expression = String(answer.result);
        renderResult(answer.result, `理解為：${answer.expression}`);
      } catch (error) { renderResult("無法理解", error.message); }
    });
  }
};
