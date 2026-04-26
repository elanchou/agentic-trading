import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { format } from "date-fns";
import { ChartDataPoint } from "@/types";

interface Props {
  data: ChartDataPoint[];
}

export function PerformanceChart({ data }: Props) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-dash-accent)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--color-dash-accent)" stopOpacity={0} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-dash-bg)', borderColor: 'var(--color-dash-border)', borderRadius: '4px', color: 'var(--color-dash-text)', fontSize: '12px' }}
            itemStyle={{ color: 'var(--color-dash-accent)', fontWeight: 600 }}
            labelFormatter={(label) => format(new Date(label), "MMM dd, HH:mm:ss")}
            formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 'Balance']}
            cursor={{ stroke: 'var(--color-dash-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="var(--color-dash-accent)" 
            strokeWidth={2}
            fillOpacity={0.1} 
            fill="url(#colorBalance)" 
            isAnimationActive={false}
            style={{ filter: 'url(#glow)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
