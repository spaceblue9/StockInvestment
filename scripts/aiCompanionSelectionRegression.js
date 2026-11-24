import assert from "node:assert/strict";
import { buildAiCompanionPrompts, resolveAiCompanionSymbol } from "../src/public/aiCompanionUi.js";

const symbols = ["SISB", "CPF", "AOT.BK"];

assert.equal(resolveAiCompanionSymbol({
  availableSymbols: symbols,
  selectedSymbol: "CPF",
  marketChartSymbol: "SISB",
  fallbackSymbol: "SISB",
}), "CPF", "Explicit drawer selection must take priority over the previous chart and top-scored stock.");

assert.equal(resolveAiCompanionSymbol({
  availableSymbols: symbols,
  selectedSymbol: "OUTSIDE",
  marketChartSymbol: "AOT.BK",
  fallbackSymbol: "SISB",
}), "AOT", "Out-of-scope selections must fall back to an in-scope context Symbol.");

const cpfPrompts = buildAiCompanionPrompts("screener", "CPF");
assert.equal(cpfPrompts.length, 5);
assert(cpfPrompts.every((prompt) => prompt.symbol === "CPF"), "Every Screener prompt must submit the selected Symbol.");
assert.deepEqual(cpfPrompts.map((prompt) => prompt.label), [
  "วิเคราะห์ CPF แบบ VI ระยะยาว",
  "CPF ทำธุรกิจอะไร และตัวเลขบอกอะไร",
  "ทำไม CPF จึงน่าศึกษา และยังขาดอะไร",
  "มีเหตุผลอะไรที่ยังไม่ควรลงทุนใน CPF",
  "แปล PE, RSI, RRR และ Volume ของ CPF",
]);
assert.equal(cpfPrompts.some((prompt) => prompt.label.includes("SISB") || prompt.label.includes("หุ้นเด่น")), false);

const aotPrompts = buildAiCompanionPrompts("screener", "AOT.BK");
assert(aotPrompts.every((prompt) => prompt.symbol === "AOT"), "Prompt payloads should normalize the selected ticker before AI submission.");
assert(aotPrompts.every((prompt) => prompt.label.includes("AOT")), "Every stock-specific label should change when the drawer Symbol changes.");

console.log("AI Companion selected stock regression passed.");
