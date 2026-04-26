export interface AgentState {
  status: string;
  model: string;
  uptimeMs: number;
  balance: number;
  initialBalance: number;
  activePairs: string[];
  roi: number;
}

export interface AgentConfig {
  hermesUrl: string;
  apiKey: string;
  instructions: string;
}

export interface Trade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  time: string;
  pnl: number;
  status: string;
}

export interface ChartDataPoint {
  time: string;
  balance: number;
}

export interface AgentLog {
  id: number;
  time: string;
  level: string;
  message: string;
}
