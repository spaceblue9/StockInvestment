import express from "express";
import multer from "multer";
import path from "path";
import { collectSymbolsFromFiles } from "../services/inputService.js";
import { getUserFromRequest, recordAuditEvent, requirePlanEntitlement, saveCustomerPortfolioSnapshot } from "../services/authService.js";
import { fetchThaiMarketData } from "../services/marketDataService.js";
import { ensureDataDirs, outputPath, UPLOAD_DIR } from "../services/pathService.js";
import { analyzePortfolio } from "../services/portfolioService.js";
import { runStrategySimulation } from "../services/simulationService.js";
import { analyzeStocks } from "../services/stockAnalysisService.js";

const router = express.Router();
ensureDataDirs();

const upload = multer({
  dest: UPLOAD_DIR,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post("/analysis/run", upload.fields([
  { name: "watchlist", maxCount: 1 },
  { name: "portfolio", maxCount: 1 },
]), async (req, res) => {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      res.status(401).json({
        ok: false,
        message: "Please sign in before running portfolio analysis.",
      });
      return;
    }

    requirePlanEntitlement(currentUser, "analysis.run");

    const watchlistPath = req.files?.watchlist?.[0]?.path;
    const portfolioFile = req.files?.portfolio?.[0];
    const portfolioPath = portfolioFile?.path;
    const symbols = await collectSymbolsFromFiles({ watchlistPath, portfolioPath });
    const rawOutput = outputPath("siamchart_raw.csv");
    const recommendedOutput = outputPath("recommended_stocks.csv");
    const logs = [];
    const rows = await fetchThaiMarketData(symbols, {
      outputFile: rawOutput,
      logger: (message) => logs.push(message),
    });
    const recommendations = await analyzeStocks(rows, {
      outputFile: recommendedOutput,
    });
    let portfolioReport = null;
    let portfolioRows = [];

    if (portfolioPath) {
      const reportFileName = `${safeBaseName(portfolioFile.originalname)}_analysis_report.xlsx`;
      const reportOutput = outputPath(reportFileName);
      portfolioRows = await analyzePortfolio(portfolioPath, recommendations, {
        outputFile: reportOutput,
      });
      portfolioReport = {
        count: portfolioRows.length,
        fileName: reportFileName,
        output: reportOutput,
        downloadUrl: `/api/analysis/report/${encodeURIComponent(reportFileName)}`,
      };
    }

    const customerSnapshot = await saveCustomerPortfolioSnapshot(currentUser.id, {
      portfolioRows,
      recommendations,
      outputs: {
        raw: rawOutput,
        recommended: recommendedOutput,
        portfolioReport: portfolioReport?.output || null,
      },
    });
    await recordAuditEvent({
      actorUserId: currentUser.id,
      action: "analysis.run",
      targetUserId: currentUser.id,
      details: {
        symbols: symbols.length,
        fetchedRows: rows.length,
        recommendationCount: recommendations.length,
        portfolioRows: portfolioRows.length,
        hasPortfolio: Boolean(portfolioPath),
      },
    });

    res.json({
      ok: true,
      stage: "stock-analysis",
      symbols,
      count: rows.length,
      recommendationCount: recommendations.length,
      outputs: {
        raw: rawOutput,
        recommended: recommendedOutput,
        portfolioReport: portfolioReport?.output || null,
      },
      portfolioReport,
      customerSnapshot,
      recommendations,
      portfolioRows,
      logs,
      message: portfolioReport
        ? "Market data, stock scoring, and portfolio report were generated."
        : "Market data and stock scoring were generated. Upload a portfolio to generate a report.",
    });
  } catch (error) {
    sendAnalysisError(res, error);
  }
});

router.get("/analysis/raw", (_req, res) => {
  res.download(outputPath("siamchart_raw.csv"), "siamchart_raw.csv", (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({
        ok: false,
        message: "Raw market output has not been generated yet.",
      });
    }
  });
});

router.get("/analysis/recommended", (_req, res) => {
  res.download(outputPath("recommended_stocks.csv"), "recommended_stocks.csv", (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({
        ok: false,
        message: "Recommended stocks output has not been generated yet.",
      });
    }
  });
});

router.get("/analysis/report/:fileName", (req, res) => {
  const fileName = path.basename(req.params.fileName);
  res.download(outputPath(fileName), fileName, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({
        ok: false,
        message: "Portfolio report has not been generated yet.",
      });
    }
  });
});

router.post("/simulation/run", async (req, res) => {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      res.status(401).json({
        ok: false,
        message: "Please sign in before running strategy simulations.",
      });
      return;
    }

    requirePlanEntitlement(currentUser, "simulation.run");

    const symbol = String(req.body.symbol || "CPALL").trim().toUpperCase();
    const yearsBack = Math.max(1, Math.min(3, Number(req.body.yearsBack) || 1));
    const initialCapital = Math.max(1000, Number(req.body.initialCapital) || 100000);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (365 * yearsBack));

    const result = await runStrategySimulation(symbol, {
      startDate,
      initialCapital,
    });
    await recordAuditEvent({
      actorUserId: currentUser.id,
      action: "simulation.run",
      targetUserId: currentUser.id,
      details: {
        symbol,
        yearsBack,
        initialCapital,
        finalValue: Math.round(result.summary?.finalValue || 0),
        trades: result.summary?.totalTrades || 0,
      },
    });

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    sendAnalysisError(res, error);
  }
});

function safeBaseName(fileName) {
  const parsed = path.parse(fileName || "portfolio");
  return parsed.name.replace(/[^a-zA-Z0-9_-]+/g, "_") || "portfolio";
}

router.get("/analysis/outputs", (_req, res) => {
  res.status(501).json({
    ok: false,
    message: "Output listing is planned after report generation is ported.",
  });
});

function sendAnalysisError(res, error) {
  res.status(error.statusCode || 500).json({
    ok: false,
    message: error.message,
    entitlement: error.code === "PLAN_UPGRADE_REQUIRED"
      ? {
        feature: error.feature,
        requiredPlanId: error.requiredPlanId,
        currentPlanId: error.currentPlanId,
      }
      : null,
  });
}

export default router;
