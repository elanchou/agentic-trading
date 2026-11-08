# Agentic Trading

Agentic trading dashboard: an agent console, trade list, performance chart and settings, backed by an Express API.

## Features

- Start and stop the trading agent, edit its configuration
- Trades, performance and log views
- Design notes for the execution control plane in `docs/plans/`

## Tech stack

React 19, Vite, Express 4, Recharts, Tailwind CSS 4, TypeScript, `@google/genai`

## Getting started

**Prerequisites:** Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # set GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API key used for AI features |
| `APP_URL` | Public URL of the deployed app (set automatically in AI Studio) |

## Project structure

```text
src/
  components/   AgentConsole, DashboardLayout, PerformanceChart, SettingsView, TradeList
  server/       execution types
server.ts       Express API + Vite middleware
tests/
docs/plans/
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/agent/status` | Agent status |
| GET/POST | `/api/agent/config` | Read or update agent config |
| POST | `/api/agent/toggle` | Start or stop the agent |
| POST | `/api/node/setup` | Node setup |
| GET | `/api/trades`, `/api/performance`, `/api/logs` | Data views |
