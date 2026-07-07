import express from "express";
import multer from "multer";
import path from "path";
import { collectInputSymbolsFromFiles } from "../services/inputService.js";
import { buildBlankPortfolioTemplateBuffer, buildBlankWatchlistTemplateText } from "../services/inputTemplateService.js";
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

    const demoMode = Boolean(currentUser.demoMode);
    requirePlanEntitlement(currentUser, "analysis.run");

    const watchlistFile = req.files?.watchlist?.[0];
    const watchlistPath = watchlistFile?.path;
    const portfolioFile = req.files?.portfolio?.[0];
    const portfolioPath = portfolioFile?.path;
    const inputSymbols = await collectInputSymbolsFromFiles({ watchlistPath, portfolioPath });
    const symbols = inputSymbols.symbols;
    if (!watchlistPath && !portfolioPath) {
      throw httpError(
        "Please choose a watchlist or portfolio file before running analysis.",
        400,
      );
    }
    if (portfolioPath && inputSymbols.portfolioSymbols.length === 0) {
      throw httpError(
        "The uploaded portfolio file was received, but no Symbol values were found. Please check that the first sheet has a Symbol column with at least one ticker.",
        400,
      );
    }
    if (symbols.length === 0) {
      throw httpError(
        "No stock symbols were found. Please fill the Symbol column in the portfolio template or add one ticker per line in the watchlist template.",
        400,
      );
    }
    const rawOutput = outputPath("siamchart_raw.csv");
    const recommendedOutput = outputPath("recommended_stocks.csv");
    const coverageOutput = outputPath("live_market_coverage_report.json");
    const logs = [];
    let marketCoverage = null;
    const rows = await fetchThaiMarketData(symbols, {
      coverageReportFile: coverageOutput,
      outputFile: rawOutput,
      logger: (message) => logs.push(message),
      onCoverageReport: (report) => {
        marketCoverage = report;
      },
    });
    if (rows.length === 0) {
      throw httpError(
        "No market data could be fetched for the uploaded symbols. Existing portfolio outputs were kept, so please check the symbols or data connection and try again.",
        502,
      );
    }
    const recommendations = await analyzeStocks(rows, {
      outputFile: recommendedOutput,
    });
    let portfolioReport = null;
    let portfolioRows = [];
    const uploadSummary = {
      watchlist: uploadedFileSummary(watchlistFile, inputSymbols.watchlistSymbols),
      portfolio: uploadedFileSummary(portfolioFile, inputSymbols.portfolioSymbols),
      combinedSymbols: symbols.length,
      sampleSymbols: symbols.slice(0, 12),
    };

    if (portfolioPath) {
      const reportFileName = `${safeBaseName(portfolioFile.originalname)}_analysis_report.xlsx`;
      const reportOutput = outputPath(reportFileName);
      portfolioRows = await analyzePortfolio(portfolioPath, recommendations, {
        outputFile: reportOutput,
      });
      uploadSummary.portfolio.holdings = portfolioRows.length;
      portfolioReport = {
        count: portfolioRows.length,
        fileName: reportFileName,
        output: reportOutput,
        downloadUrl: `/api/analysis/report/${encodeURIComponent(reportFileName)}`,
      };
    }

    const runOutputs = {
      raw: rawOutput,
      recommended: recommendedOutput,
      coverageReport: coverageOutput,
      portfolioReport: portfolioReport?.output || null,
    };
    const customerSnapshot = demoMode
      ? null
      : await saveCustomerPortfolioSnapshot(currentUser.id, {
        portfolioRows,
        recommendations,
        preserveExistingPortfolioRows: !portfolioPath,
        outputs: runOutputs,
      });
    const responsePortfolioRows = customerSnapshot?.portfolioRows || portfolioRows;
    const responsePortfolioReport = portfolioReport || preservedPortfolioReport(customerSnapshot);
    const responseOutputs = customerSnapshot?.outputs || runOutputs;
    if (!demoMode) {
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
          uploadSummary,
        },
      });
    }

    res.json({
      ok: true,
      stage: "stock-analysis",
      demoMode,
      symbols,
      count: rows.length,
      recommendationCount: recommendations.length,
      outputs: responseOutputs,
      portfolioReport: responsePortfolioReport,
      marketCoverage,
      uploadSummary,
      customerSnapshot,
      recommendations,
      portfolioRows: responsePortfolioRows,
      logs,
      message: portfolioReport
        ? "Market data, stock scoring, and portfolio report were generated."
        : responsePortfolioRows.length
          ? "Market data and stock scoring were generated. Existing portfolio holdings were kept because no new portfolio file was uploaded."
          : "Market data and stock scoring were generated. Upload a portfolio to generate a report.",
    });
  } catch (error) {
    sendAnalysisError(res, error);
  }
});

function preservedPortfolioReport(snapshot) {
  const reportOutput = snapshot?.outputs?.portfolioReport;
  if (!reportOutput) {
    return null;
  }
  const fileName = path.basename(reportOutput);
  return {
    count: snapshot.portfolioRows?.length || 0,
    fileName,
    output: reportOutput,
    downloadUrl: `/api/analysis/report/${encodeURIComponent(fileName)}`,
    preserved: true,
  };
}

function uploadedFileSummary(file, symbols = []) {
  if (!file) {
    return null;
  }
  return {
    fileName: file.originalname || "uploaded-file",
    sizeBytes: file.size || 0,
    parsedSymbols: symbols.length,
    sampleSymbols: symbols.slice(0, 12),
  };
}

router.get("/analysis/raw", requireSignedInForAnalysisFiles, (_req, res) => {
  res.download(outputPath("siamchart_raw.csv"), "raw_CSV.csv", (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({
        ok: false,
        message: "Raw market output has not been generated yet.",
      });
    }
  });
});

router.get("/analysis/recommended", requireSignedInForAnalysisFiles, (_req, res) => {
  res.download(outputPath("recommended_stocks.csv"), "recommended_stocks.csv", (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({
        ok: false,
        message: "Recommended stocks output has not been generated yet.",
      });
    }
  });
});

router.get("/analysis/coverage", requireSignedInForAnalysisFiles, (_req, res) => {
  res.download(outputPath("live_market_coverage_report.json"), "live_market_coverage_report.json", (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({
        ok: false,
        message: "Live market coverage report has not been generated yet.",
      });
    }
  });
});

router.get("/analysis/template/portfolio", requireSignedInForAnalysisFiles, async (_req, res) => {
  try {
    const buffer = await buildBlankPortfolioTemplateBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="portfolio_template.xlsx"');
    res.send(buffer);
  } catch (error) {
    sendAnalysisError(res, error);
  }
});

router.get("/analysis/template/watchlist", requireSignedInForAnalysisFiles, (_req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="watchlist_template.txt"');
  res.send(buildBlankWatchlistTemplateText());
});

router.get("/analysis/report/:fileName", requireSignedInForAnalysisFiles, (req, res) => {
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

async function requireSignedInForAnalysisFiles(req, res, next) {
  try {
    const currentUser = await getUserFromRequest(req);
    if (!currentUser) {
      res.status(401).json({
        ok: false,
        message: "Please sign in before downloading analysis files.",
      });
      return;
    }
    next();
  } catch (error) {
    sendAnalysisError(res, error);
  }
}

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
    const buyMode = req.body.buyMode === "split" ? "split" : "lump_sum";
    const tranches = Math.max(2, Math.min(24, Math.round(Number(req.body.tranches) || 5)));
    const trancheIntervalDays = Math.max(1, Math.min(252, Math.round(Number(req.body.trancheIntervalDays) || 20)));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (365 * yearsBack));

    const result = await runStrategySimulation(symbol, {
      startDate,
      initialCapital,
      buyMode,
      tranches,
      trancheIntervalDays,
    });
    await recordAuditEvent({
      actorUserId: currentUser.id,
      action: "simulation.run",
      targetUserId: currentUser.id,
      details: {
        symbol,
        yearsBack,
        initialCapital,
        buyMode,
        tranches: result.buyPlan?.tranches,
        trancheIntervalDays: result.buyPlan?.trancheIntervalDays,
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

function httpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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
