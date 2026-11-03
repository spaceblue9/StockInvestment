import assert from "node:assert/strict";
import { buildAiInvestmentContext, buildOpenRouterRequest, generateAiInvestmentExplanation } from "../src/services/aiInvestmentService.js";

const snapshot = {
  generatedAt: "2026-11-03T02:00:00.000Z",
  userEmail: "private@example.com",
  uploadedFile: "portfolio_private.xlsx",
  summary: { holdings: 2, marketValue: 150000, avgScore: 68 },
  portfolioRows: [
    { Symbol: "AAA", Sector: "Energy", Total_Score: 72, RRR: 1.8, Target_Action: "Hold", ownerEmail: "private@example.com" },
    { Symbol: "BBB", Sector: "Energy", Total_Score: 65, RRR: 1.2, Target_Action: "Wait" },
  ],
};

const context = buildAiInvestmentContext(snapshot, { mode: "compare", symbol: "AAA" });
const serializedContext = JSON.stringify(context);
assert.equal(serializedContext.includes("private@example.com"), false);
assert.equal(serializedContext.includes("portfolio_private.xlsx"), false);
assert.equal(context.selectedStock.Symbol, "AAA");
assert.equal(context.peers[0].Symbol, "BBB");
assert.equal(context.dataContract.companyProfileAvailable, false);

const request = buildOpenRouterRequest(context);
assert.equal(request.provider.zdr, true);
assert.equal(request.provider.data_collection, "deny");
assert.equal(request.response_format.type, "json_schema");
assert.match(request.messages[0].content, /Never calculate or replace Think2/u);
assert.match(request.messages[0].content, /never infer it from the ticker/iu);

let sentRequest;
const response = await generateAiInvestmentExplanation(snapshot, { mode: "stock", symbol: "AAA" }, {
  apiKey: "test-key",
  fetchImpl: async (_url, options) => {
    sentRequest = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        model: "test-model",
        provider: "test-provider",
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150, cost: 0.001 },
        choices: [{ message: { content: JSON.stringify({
          title: "คำอธิบาย AAA", summary: "สรุปจากข้อมูล Think2", keyPoints: ["คะแนน 72"],
          risks: ["ควรตรวจข้อมูลเพิ่ม"], nextQuestions: ["งบล่าสุดเป็นอย่างไร"],
          dataLimitations: ["ไม่มีข้อมูลประเภทธุรกิจที่ยืนยันแล้ว"], disclaimer: "ใช้เพื่อการศึกษา",
        }) } }],
      }),
    };
  },
});

assert.equal(response.result.title, "คำอธิบาย AAA");
assert.equal(response.usage.totalTokens, 150);
assert.equal(sentRequest.provider.zdr, true);
console.log("AI investment service regression passed.");
