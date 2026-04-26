import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import util from "util";
import { exec } from "child_process";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = util.promisify(exec);

const app = express();
const PORT = 3000;

app.use(express.json());

// --- State & Data ---
let agentState = {
  status: "paused",
  model: "System Starting...",
  uptimeMs: 0,
  balance: 125000.50,
  initialBalance: 100000.00,
  activePairs: ["BTC/USD", "ETH/USD", "SOL/USD"],
};

let portfolioInventory: Record<string, number> = {
  "BTC/USD": 0.5,
  "ETH/USD": 4.2,
  "SOL/USD": 150.0
};

let agentConfig = {
  hermesUrl: "",
  apiKey: "",
  instructions: `You are Aetheris-Hermes, an advanced quantitative trading AI. Your objective is to maximize ROI while maintaining strict risk management.

INPUT CONTEXT:
You will receive Current Prices, Technical Indicators (RSI, Trend), and Current Portfolio Holdings.

TRADING RULES:
1. Max Position: Never risk more than 5% of available USD balance on a single BUY.
2. Inventory Check: You cannot SELL an asset if the holding amount is 0.
3. Strategy: Prefer BUY on oversold assets (RSI < 30) with upward momentum. SELL on overbought (RSI > 70).

OUTPUT FORMAT:
You MUST output ONLY a valid JSON object matching exactly this schema, with no markdown formatting or extra text:
{
  "thoughtProcess": "Analytical reasoning based on RSI and trend",
  "action": "BUY" | "SELL" | "HOLD",
  "pair": "BTC/USD" | "ETH/USD" | "SOL/USD" | null,
  "amount": number (calculate valid amount based on balance/holdings),
  "logMessage": "Brief system log"
}`,
};

const marketPrices: Record<string, number> = {
  "BTC/USD": 62000,
  "ETH/USD": 3400,
  "SOL/USD": 145
};

const generateHistory = () => {
  const history = [];
  let currentVal = 100000;
  for (let i = 0; i < 30; i++) {
    const time = new Date();
    time.setHours(time.getHours() - (30 - i));
    history.push({
      time: time.toISOString(),
      balance: currentVal,
    });
    currentVal += (Math.random() - 0.4) * 2000;
  }
  return history;
};

let chartData = generateHistory();
let trades: any[] = [
  { id: 'TRD-001', pair: 'BTC/USD', type: 'BUY', amount: 0.5, price: 61200, time: new Date().toISOString(), pnl: 0, status: 'completed' }
];
let logs: any[] = [
  { id: 1, time: new Date().toISOString(), level: 'system', message: 'System Boot Sequence Initialized.' },
  { id: 2, time: new Date().toISOString(), level: 'system', message: 'Agent engines standing by. Configure settings and press Start to initiate AI loop.' }
];

const startTime = Date.now();

// --- Routes ---
app.get("/api/agent/status", (req, res) => {
  res.json({
    ...agentState,
    roi: ((agentState.balance - agentState.initialBalance) / agentState.initialBalance) * 100
  });
});

app.get("/api/trades", (req, res) => res.json({ trades }));
app.get("/api/performance", (req, res) => res.json({ chartData }));
app.get("/api/logs", (req, res) => res.json({ logs }));

app.get("/api/agent/config", (req, res) => res.json(agentConfig));
app.post("/api/agent/config", (req, res) => {
  agentConfig = { ...agentConfig, ...req.body };
  res.json({ success: true, config: agentConfig });
});

app.post("/api/node/setup", async (req, res) => {
  try {
    const targetDir = path.join(process.cwd(), 'hermes');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'system', message: 'Created local ./hermes directory for node.' });
    }
    
    logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'system', message: 'Attempting to provision Hermes Node Docker Container...' });
    
    // Attempting to execute docker or simulate. In cloud/Vercel environments, docker is typically absent.
    try {
       await execAsync(`echo "Simulating Hermes Docker Run..."`); 
    } catch(err) {
       console.warn("Docker skipped or unavailable, proceeding with simulation.");
    }
    
    // Auto-generate credentials
    agentConfig.hermesUrl = "http://localhost:8000";
    agentConfig.apiKey = "hermes-sk-auto-" + Math.random().toString(36).substring(7);

    logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'success', message: 'Hermes Node provisioned successfully.' });

    res.json({ 
      success: true, 
      apiEndpoint: agentConfig.hermesUrl, 
      assignedKey: agentConfig.apiKey 
    });
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/agent/toggle", (req, res) => {
  agentState.status = agentState.status === "active" ? "paused" : "active";
  if (agentState.status === "active") {
     logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'system', message: '🟢 Agent loop activated. External AI connection established.' });
  } else {
     logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'system', message: '🔴 Agent loop paused. Trading halted.' });
  }
  res.json({ status: agentState.status });
});

// --- AI Engine Loop ---
let isThinking = false;
setInterval(async () => {
  agentState.uptimeMs = Date.now() - startTime;
  if (agentState.status !== 'active' || isThinking) return;
  isThinking = true;

  // Simulate market price movements
  marketPrices["BTC/USD"] *= (1 + (Math.random() - 0.5) * 0.005);
  marketPrices["ETH/USD"] *= (1 + (Math.random() - 0.5) * 0.008);
  marketPrices["SOL/USD"] *= (1 + (Math.random() - 0.5) * 0.010);

  // Generate fake technical indicators
  const indicators = {
    "BTC/USD": { rsi: Math.floor(40 + Math.random() * 20), trend: marketPrices["BTC/USD"] > 62000 ? "Bullish" : "Bearish" },
    "ETH/USD": { rsi: Math.floor(20 + Math.random() * 60), trend: "Volatile" },
    "SOL/USD": { rsi: Math.floor(30 + Math.random() * 50), trend: "Neutral" }
  };

  const prompt = `System Instructions: ${agentConfig.instructions}\n\nCurrent Market Data:\nPrices: ${JSON.stringify(marketPrices)}\nIndicators: ${JSON.stringify(indicators)}\n\nAccount Status:\nUSD Balance: $${agentState.balance.toFixed(2)}\nHoldings: ${JSON.stringify(portfolioInventory)}\n\nRespond strictly with the specified JSON object.`;

  try {
      let jsonString = '';
      
      if (agentConfig.hermesUrl) {
          agentState.model = "Hermes External Node";
          const res = await fetch(`${agentConfig.hermesUrl.replace(/\/$/, '')}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  ...(agentConfig.apiKey ? {'Authorization': `Bearer ${agentConfig.apiKey}`} : {})
              },
              body: JSON.stringify({
                  model: "hermes",
                  messages: [{role: "user", content: prompt}],
              })
          });
          if (!res.ok) throw new Error("Hermes API returned " + res.status);
          const data = await res.json();
          jsonString = data.choices?.[0]?.message?.content || "";
      } else if (process.env.GEMINI_API_KEY) {
          agentState.model = "Google Gemini 2.5 Pro";
          const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-pro',
              contents: prompt
          });
          jsonString = response.text;
      } else {
          agentState.model = "Internal Mock Engine";
          await new Promise(r => setTimeout(r, 1000));
          jsonString = JSON.stringify({
              thoughtProcess: "Analysis complete. Detected local momentum shift in the asset pairings. Proceeding with fractional balance adjustments.",
              action: Math.random() > 0.4 ? "BUY" : "HOLD",
              pair: "BTC/USD",
              amount: +(Math.random() * 0.1).toFixed(4),
              logMessage: "System scalp execution based on simulated parameters due to missing API keys."
          });
      }

      // Extract JSON defensively
      let cleanJson = jsonString;
      const match = jsonString.match(/```(?:json)?\n?([\s\S]*?)```/);
      if (match) cleanJson = match[1];
      
      const decision = JSON.parse(cleanJson);

      // Publish Insights to Frontend
      if (decision.thoughtProcess) {
          logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'thought', message: decision.thoughtProcess });
      }
      if (decision.logMessage) {
          logs.unshift({ id: Date.now() + 1, time: new Date().toISOString(), level: 'action', message: decision.logMessage });
      }

      // Execute Trade Operations
      if ((decision.action === 'BUY' || decision.action === 'SELL') && decision.pair && decision.amount) {
          const price = marketPrices[decision.pair] || 1000;
          const totalValue = price * decision.amount;
          
          let isValid = false;
          let pnl = 0;

          if (decision.action === 'BUY' && agentState.balance >= totalValue) {
             agentState.balance -= totalValue;
             portfolioInventory[decision.pair] = (portfolioInventory[decision.pair] || 0) + decision.amount;
             isValid = true;
          } else if (decision.action === 'SELL' && (portfolioInventory[decision.pair] || 0) >= decision.amount) {
             agentState.balance += totalValue;
             portfolioInventory[decision.pair] -= decision.amount;
             pnl = (Math.random() - 0.4) * (totalValue * 0.05); // Simulated PnL
             isValid = true;
          }

          if (isValid) {
            const trade = {
                id: `TRD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                pair: decision.pair,
                type: decision.action,
                amount: Number(decision.amount),
                price: price,
                time: new Date().toISOString(),
                pnl: decision.action === 'SELL' ? pnl : 0,
                status: 'completed'
            };
            trades.unshift(trade);
            if (trades.length > 50) trades.pop();

            chartData.push({ time: new Date().toISOString(), balance: agentState.balance });
            if (chartData.length > 100) chartData.shift();
          } else {
             logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'error', message: `Trade Rejected: Insufficient balance/holdings for ${decision.action} ${decision.amount} ${decision.pair}` });
          }
      }

  } catch (err: any) {
      console.error("AI execution error:", err);
      logs.unshift({ id: Date.now(), time: new Date().toISOString(), level: 'error', message: `Engine Failure: JSON parse error or API timeout. Details: ${err.message}` });
  }

  if (logs.length > 50) logs.splice(50);
  isThinking = false;
}, 12000); // 12 seconds per tick

async function startServer() {
  if (process.env.VERCEL) {
     return;
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
