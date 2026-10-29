/**
 * Blitz FlareSolver
 * =================
 * Node.js Cloudflare challenge solver with a FlareSolverr-compatible API.
 *
 * Author  : Blitz
 * Handle  : @blitzlabx
 * GitHub  : https://github.com/blitzlabx/blitz-flaresolver
 * Site    : https://blitz.devs.surf
 *
 * Drop-in for TI_FLARESOLVERR_URL in blitzlabx/tokyoinsider-api
 */

"use strict";

const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const PORT = Number(process.env.PORT || 8191);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT || 2);
const DEFAULT_TIMEOUT = Number(process.env.DEFAULT_TIMEOUT || 60000);
const HEADLESS = process.env.HEADLESS !== "false";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Expose-Headers", "*");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("X-Powered-By", "Blitz FlareSolver (@blitzlabx)");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

let browser = null;
let activeJobs = 0;
const queue = [];

async function getBrowser() {
  if (browser && browser.connected) return browser;
  const launchOpts = {
    headless: HEADLESS ? "new" : false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
    ],
    defaultViewport: { width: 1920, height: 1080 },
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  browser = await puppeteer.launch(launchOpts);
  browser.on("disconnected", () => {
    browser = null;
  });
  return browser;
}

function waitTurn() {
  return new Promise((resolve) => {
    const tryRun = () => {
      if (activeJobs < MAX_CONCURRENT) {
        activeJobs += 1;
        resolve();
        return;
      }
      queue.push(tryRun);
    };
    tryRun();
  });
}

function releaseTurn() {
  activeJobs = Math.max(0, activeJobs - 1);
  const next = queue.shift();
  if (next) next();
}

async function solveRequest(url, maxTimeout) {
  const timeout = Math.min(Math.max(maxTimeout || DEFAULT_TIMEOUT, 5000), 180000);
  await waitTurn();
  let page = null;
  const started = Date.now();

  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout,
    });

    const deadline = started + timeout;
    while (Date.now() < deadline) {
      const title = await page.title().catch(() => "");
      const bodySnippet = await page
        .evaluate(() => (document.body ? document.body.innerText.slice(0, 800) : ""))
        .catch(() => "");

      const challenged =
        /just a moment/i.test(title) ||
        /checking your browser/i.test(title) ||
        /attention required/i.test(title) ||
        /cf-challenge|cf_chl|challenge-platform/i.test(bodySnippet) ||
        /enable javascript and cookies/i.test(bodySnippet);

      if (!challenged) break;
      await new Promise((r) => setTimeout(r, 1500));
    }

    await new Promise((r) => setTimeout(r, 800));

    const html = await page.content();
    const finalUrl = page.url();
    const cookies = await page.cookies();
    const userAgent = await page.evaluate(() => navigator.userAgent);

    return {
      status: "ok",
      message: "Challenge solved (or page loaded without challenge)",
      startTimestamp: started,
      endTimestamp: Date.now(),
      version: "1.0.0-blitz",
      solution: {
        url: finalUrl,
        status: 200,
        headers: {},
        response: html,
        cookies,
        userAgent,
      },
    };
  } catch (err) {
    return {
      status: "error",
      message: String(err && err.message ? err.message : err),
      startTimestamp: started,
      endTimestamp: Date.now(),
      version: "1.0.0-blitz",
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (_) {}
    }
    releaseTurn();
  }
}

app.get("/", (_req, res) => {
  res.json({
    name: "Blitz FlareSolver",
    version: "1.0.0",
    author: "Blitz",
    handle: "@blitzlabx",
    github: "https://github.com/blitzlabx/blitz-flaresolver",
    compatible: "FlareSolverr /v1 API",
    docs: "POST /v1 with { cmd: 'request.get', url, maxTimeout }",
    credits: "All credits to Blitz (@blitzlabx)",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "blitz-flaresolver",
    author: "Blitz",
    activeJobs,
    queue: queue.length,
    browser: !!(browser && browser.connected),
  });
});

app.post("/v1", async (req, res) => {
  const body = req.body || {};
  const cmd = body.cmd || body.command;

  if (cmd !== "request.get" && cmd !== "request.post") {
    return res.status(400).json({
      status: "error",
      message: "Unsupported cmd. Use request.get (request.post not fully supported yet).",
      author: "Blitz (@blitzlabx)",
    });
  }

  const url = body.url;
  if (!url || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({
      status: "error",
      message: "Missing or invalid url",
      author: "Blitz (@blitzlabx)",
    });
  }

  const maxTimeout = Number(body.maxTimeout || DEFAULT_TIMEOUT);
  const result = await solveRequest(url, maxTimeout);
  const code = result.status === "ok" ? 200 : 500;
  res.status(code).json(result);
});

async function shutdown() {
  try {
    if (browser) await browser.close();
  } catch (_) {}
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Blitz FlareSolver] listening on :${PORT} — by Blitz (@blitzlabx)`);
});
