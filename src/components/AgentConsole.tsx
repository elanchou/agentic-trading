import { AgentLog } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function AgentConsole({ logs }: { logs: AgentLog[] }) {
  return (
    <div className="font-mono text-xs flex flex-col h-full overflow-y-auto pr-2">
      {logs.map((log) => (
        <div key={log.id} className="log-entry">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between w-full">
              <span className="text-dash-text break-words pr-2 leading-relaxed">
                {log.message}
              </span>
              <span className="tag whitespace-nowrap shrink-0 h-fit">
                {log.level}
              </span>
            </div>
          </div>
          <span className="text-dash-muted text-[10px] shrink-0 mt-2">
             {format(new Date(log.time), "HH:mm:ss")}
          </span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-dash-muted text-center pt-8 font-sans text-xs">
          Waiting for agent output stream...
        </div>
      )}
    </div>
  );
}
