import { Trade } from "@/types";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function TradeList({ trades }: { trades: Trade[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-dash-border text-[10px] uppercase tracking-wider text-dash-muted">
            <th className="pb-3 font-medium px-4">Time</th>
            <th className="pb-3 font-medium">Pair</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium text-right">Amount</th>
            <th className="pb-3 font-medium text-right">Price</th>
            <th className="pb-3 font-medium text-right px-4">PnL</th>
          </tr>
        </thead>
        <tbody className="text-sm font-mono align-middle">
          {trades.map((trade, idx) => (
            <tr key={trade.id} className="border-b border-dash-border/50 hover:bg-dash-card/60 transition-colors group">
              <td className="py-3 text-dash-muted text-xs px-4 whitespace-nowrap">
                {format(new Date(trade.time), "HH:mm:ss")}
              </td>
              <td className="py-3 font-semibold text-dash-text">{trade.pair}</td>
              <td className="py-3">
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                  trade.type === 'BUY' ? "bg-dash-accent/10 text-dash-accent" : "bg-dash-danger/10 text-dash-danger"
                )}>
                  {trade.type === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {trade.type}
                </span>
              </td>
              <td className="py-3 text-right text-dash-text">
                {trade.amount.toFixed(4)}
              </td>
              <td className="py-3 text-right text-dash-muted group-hover:text-dash-text transition-colors">
                ${trade.price.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </td>
              <td className={cn(
                "py-3 text-right px-4",
                trade.pnl > 0 ? "text-dash-accent" : trade.pnl < 0 ? "text-dash-danger" : "text-dash-muted"
              )}>
                {trade.pnl !== 0 ? `${trade.pnl > 0 ? '+' : ''}$${Math.abs(trade.pnl).toFixed(2)}` : '-'}
              </td>
            </tr>
          ))}
          {trades.length === 0 && (
             <tr>
               <td colSpan={6} className="py-8 text-center text-dash-muted text-xs font-sans">
                 No recent trades executed by agent
               </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
