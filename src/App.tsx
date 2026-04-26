import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { DashboardLayout } from "./components/DashboardLayout";
import { PerformanceChart } from "./components/PerformanceChart";
import { TradeList } from "./components/TradeList";
import { AgentConsole } from "./components/AgentConsole";
import { SettingsView } from "./components/SettingsView";
import { AgentState, Trade, ChartDataPoint, AgentLog } from "./types";
import { Activity, BrainCircuit, Cpu, ExternalLink, Server, TerminalSquare, TrendingUp, Wallet } from "lucide-react";

export default function App() {
  const [activePath, setActivePath] = useState("dashboard");
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, tradesRes, perfRes, logsRes] = await Promise.all([
          fetch("/api/agent/status"),
          fetch("/api/trades"),
          fetch("/api/performance"),
          fetch("/api/logs")
        ]);

        if (statusRes.ok) setAgentState(await statusRes.json());
        if (tradesRes.ok) setTrades((await tradesRes.json()).trades);
        if (perfRes.ok) setChartData((await perfRes.json()).chartData);
        if (logsRes.ok) setLogs((await logsRes.json()).logs);
      } catch (err) {
        console.error("Failed to fetch agent data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAgent = async () => {
    try {
      await fetch("/api/agent/toggle", { method: "POST" });
    } catch (e) {
      console.error("Failed to toggle agent", e);
    }
  };

  return (
    <>
      <DashboardLayout 
        activePath={activePath}
        onNavigate={setActivePath}
        rightSidebar={
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase">Live Agent Thought Stream</h2>
              <div className={`status-dot ${agentState?.status === 'active' ? 'bg-dash-accent animate-pulse' : 'bg-dash-danger'}`}></div>
            </div>
            
            <div className="model-badge">
              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-[10px] font-mono">C</div>
              <div>
                <p className="text-[10px] leading-none">{agentState?.model || 'Starting...'}</p>
                <p className="text-[9px] text-dash-muted mt-0.5">Primary Analytical Core</p>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-hidden">
               <AgentConsole logs={logs} />
            </div>

            <div className="mt-8 p-4 border border-dash-border rounded-xl shrink-0">
              <p className="text-[10px] text-dash-muted mb-2 uppercase tracking-widest">System Control</p>
              <button 
                onClick={handleToggleAgent}
                className={`w-full text-dash-bg text-[11px] font-bold py-3 uppercase tracking-widest hover:opacity-80 transition-opacity cursor-pointer ${agentState?.status === 'active' ? 'bg-dash-danger text-white' : 'bg-dash-accent'}`}
              >
                {agentState?.status === 'active' ? 'Pause Trading Engine' : 'Initialize Agent'}
              </button>
            </div>
          </div>
        }
      >
        {activePath === "settings" ? (
          <SettingsView />
        ) : (
          <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col pt-0 md:pt-4 h-full relative">
            
            <header className="mb-6 md:mb-10 shrink-0">
              <span className="serif-italic mb-4 hidden md:block">Automated Alpha Deployment</span>
              <div className="huge-text mb-4 mt-2 md:mt-0 flex items-start">
                {agentState?.roi ? `${agentState.roi > 0 ? '+' : ''}${agentState.roi.toFixed(2)}` : '0.00'}
                <span className="text-3xl md:text-5xl lg:text-7xl align-top text-dash-accent ml-1 mt-2 md:mt-4">%</span>
              </div>
              
              <div className="max-w-md mb-8">
                <p className="text-[11px] md:text-xs text-dash-muted leading-relaxed uppercase tracking-widest font-medium">
                  Agent clusters are currently processing high-frequency data from 12 exchanges. Sentiment analysis via {agentState?.model || 'Claude-3.5'} suggests a bullish pivot on mid-cap tech assets.
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 lg:mb-12 shrink-0">
              <StatCard 
                 title="Total Portfolio Value" 
                 value={agentState ? `$${agentState.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '---'}
                 icon={<Wallet className="w-4 h-4" />}
              />
              <StatCard 
                 title="Return on Investment" 
                 value={agentState?.roi ? `${agentState.roi > 0 ? '+' : ''}${agentState.roi.toFixed(2)}%` : '---'}
                 icon={<TrendingUp className="w-4 h-4" />}
                 valueColor={agentState?.roi && agentState.roi > 0 ? 'text-dash-accent' : 'text-dash-danger'}
              />
              <StatCard 
                 title="Active Pairs" 
                 value={agentState?.activePairs.length.toString() || '0'}
                 icon={<Server className="w-4 h-4" />}
                 subtitle={agentState?.activePairs.join(", ")}
              />
              <StatCard 
                 title="Agent Uptime" 
                 value={agentState ? formatUptime(agentState.uptimeMs) : '---'}
                 icon={<Cpu className="w-4 h-4" />}
              />
            </div>

            <div className="mb-4 md:mb-8 shrink-0 h-[220px] md:h-[300px] w-full flex items-center justify-center relative -mx-2 md:mx-0">
              <PerformanceChart data={chartData} />
            </div>

            <div className="flex gap-4 md:gap-8 mt-2 mb-8 md:mb-12 shrink-0">
              <div className="text-[10px] uppercase tracking-widest border-t border-dash-border pt-4 flex-1 text-dash-muted">
                Engine: Neural-Net 2.4-stable
              </div>
              <div className="text-[10px] uppercase tracking-widest border-t border-dash-border pt-4 flex-1 text-right text-dash-muted">
                Latency: 14ms
              </div>
            </div>

            <div className="border-t border-dash-border pt-6 pb-12 shrink-0">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-dash-muted" />
                    <h3 className="text-xs font-semibold tracking-widest uppercase">Recent Executions</h3>
                 </div>
                 <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
                   <TradeList trades={trades} />
                 </div>
            </div>
            
          </div>
        )}
      </DashboardLayout>
      <Analytics />
    </>
  );
}

function StatCard({ title, value, icon, subtitle, valueColor = "text-dash-text" }: any) {
  return (
    <div className="metric-card !mt-0 !pt-4 border-t border-dash-border">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] md:text-xs font-medium uppercase tracking-widest text-dash-muted">
          {title}
        </span>
        <div className="text-dash-muted opacity-50">
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-xl md:text-2xl font-semibold tracking-tight ${valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-[10px] mt-1 text-dash-muted uppercase tracking-widest">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function formatUptime(ms: number) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}
