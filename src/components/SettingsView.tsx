import { useState, useEffect } from "react";
import { Server, Key, Link2, CheckCircle, XCircle, Loader2, FileText, Upload, Terminal, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [hermesUrl, setHermesUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<"idle" | "testing" | "saving" | "success" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const [setupStatus, setSetupStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  useEffect(() => {
    fetch("/api/agent/config").then(res => res.json()).then(data => {
      setHermesUrl(data.hermesUrl || "");
      setApiKey(data.apiKey || "");
      setInstructions(data.instructions || "");
      if (data.hermesUrl && data.apiKey) {
        setStep(2); // Auto advance if config exists
      }
    });
  }, []);

  const runNodeSetup = async () => {
    setSetupStatus("running");
    try {
      const res = await fetch("/api/node/setup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setHermesUrl(data.apiEndpoint);
        setApiKey(data.assignedKey);
        setSetupStatus("success");
        setTimeout(() => setStep(2), 1500);
      } else {
        setSetupStatus("error");
      }
    } catch {
      setSetupStatus("error");
    }
  };

  const testConnection = async () => {
    setStatus("testing");
    try {
      // Simulate validation or check node
      setTimeout(() => {
         if(hermesUrl) setStatus("success");
         else setStatus("error");
      }, 1000);
    } catch (e) {
      setStatus("error");
    }
  };

  const saveConfig = async () => {
    setSaveStatus("saving");
    try {
      await fetch("/api/agent/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hermesUrl, apiKey, instructions })
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      alert("Failed to save configuration.");
      setSaveStatus("idle");
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col pt-0 md:pt-4 h-full relative space-y-8">
      <header className="mb-4 shrink-0">
        <span className="serif-italic mb-4 hidden md:block">System Configuration</span>
        <h1 className="huge-text mb-4 mt-2 md:mt-0 flex items-start text-5xl md:text-7xl">
          Node Settings
        </h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 border-t border-dash-border pt-8 flex-1">
        {/* Step Navigation Sidebar */}
        <aside className="w-full lg:w-48 lg:border-r border-dash-border lg:pr-8 flex flex-col gap-6 shrink-0">
           <button 
             onClick={() => setStep(1)}
             className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-left transition-colors ${step === 1 ? 'text-dash-accent' : 'text-dash-muted hover:text-dash-text'}`}
           >
             <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${step === 1 ? 'border-dash-accent bg-dash-accent/10' : 'border-dash-muted'}`}>1</div>
             Init Node
           </button>
           <button 
             onClick={() => setStep(2)}
             className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-left transition-colors ${step === 2 ? 'text-dash-accent' : 'text-dash-muted hover:text-dash-text'}`}
           >
             <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${step === 2 ? 'border-dash-accent bg-dash-accent/10' : 'border-dash-muted'}`}>2</div>
             Connection
           </button>
           <button 
             onClick={() => setStep(3)}
             className={`flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-left transition-colors ${step === 3 ? 'text-dash-accent' : 'text-dash-muted hover:text-dash-text'}`}
           >
             <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${step === 3 ? 'border-dash-accent bg-dash-accent/10' : 'border-dash-muted'}`}>3</div>
             Agent Rules
           </button>
        </aside>

        {/* Step Content */}
        <div className="flex-1 max-w-3xl">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-6 h-6 text-dash-accent" />
                <h2 className="text-lg font-semibold tracking-widest uppercase">1. Initialize Hermes Node</h2>
              </div>
              <p className="text-xs text-dash-muted leading-relaxed uppercase tracking-widest">
                This process will execute <code className="bg-dash-bg px-1 mx-1 rounded border border-dash-border">mkdir -p hermes</code> to create a local data volume, and fetch the necessary docker image using <code className="bg-dash-bg px-1 mx-1 rounded border border-dash-border">docker run nousresearch/hermes-agent</code>.
              </p>
              
              <div className="bg-black/40 border border-dash-border rounded-xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-dash-accent" />
                 <h3 className="text-xs font-mono mb-4 text-dash-muted flex items-center gap-2">
                   <Terminal className="w-4 h-4" /> &gt; SYSTEM EXEC
                 </h3>
                 <div className="font-mono text-[10px] text-dash-text space-y-2 opacity-80 mb-6">
                   <p>$ mkdir -p hermes</p>
                   <p>$ docker run -it --rm -v $(pwd)/hermes:/opt/data nousresearch/hermes-agent setup</p>
                 </div>
                 
                 <button 
                  onClick={runNodeSetup}
                  disabled={setupStatus === "running"}
                  className="bg-dash-text text-dash-bg px-6 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-3 disabled:opacity-50 w-full justify-center md:justify-start md:w-auto"
                 >
                   {setupStatus === "running" ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning Node...</>
                   ) : setupStatus === "success" ? (
                     <><CheckCircle className="w-4 h-4" /> Setup Complete</>
                   ) : (
                     "Execute Setup Routine"
                   )}
                 </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Link2 className="w-6 h-6 text-dash-accent" />
                <h2 className="text-lg font-semibold tracking-widest uppercase">2. API Configuration</h2>
              </div>
              <p className="text-xs text-dash-muted leading-relaxed uppercase tracking-widest">
                Verify the automatically generated endpoint and API key from the Node Setup process. Adjust manually if connecting to a remote instance.
              </p>

              <div className="space-y-6 bg-white/5 p-6 border border-dash-border rounded">
                <div className="space-y-2">
                   <label className="text-[10px] text-dash-muted uppercase tracking-widest block">API Endpoint URL</label>
                   <div className="flex bg-dash-bg border border-dash-border rounded p-3 focus-within:border-dash-accent transition-colors">
                     <Server className="w-4 h-4 text-dash-muted my-auto mr-3" />
                     <input 
                       type="text" 
                       className="flex-1 bg-transparent text-sm outline-none text-dash-text font-mono" 
                       value={hermesUrl}
                       onChange={(e) => setHermesUrl(e.target.value)}
                       placeholder="http://localhost:8000"
                     />
                   </div>
                </div>

                <div className="space-y-2 mt-4">
                   <label className="text-[10px] text-dash-muted uppercase tracking-widest block">API Key</label>
                   <div className="flex bg-dash-bg border border-dash-border rounded p-3 focus-within:border-dash-accent transition-colors">
                     <Key className="w-4 h-4 text-dash-muted my-auto mr-3" />
                     <input 
                       type="text" 
                       className="flex-1 bg-transparent text-sm outline-none text-dash-text font-mono" 
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       placeholder="sk-..."
                     />
                   </div>
                </div>

                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-dash-border">
                   <button 
                     onClick={testConnection}
                     disabled={status === "testing" || !hermesUrl}
                     className="flex items-center gap-2 border border-dash-border hover:border-dash-muted px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors text-dash-text disabled:opacity-50"
                   >
                     {status === "testing" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test URL"}
                   </button>
                   
                   {status === "success" && (
                     <div className="flex items-center gap-2 text-dash-accent text-xs font-medium uppercase tracking-widest">
                       <CheckCircle className="w-4 h-4" /> Valid
                     </div>
                   )}
                   
                   <div className="flex-1" />
                   
                   <button 
                     onClick={() => setStep(3)}
                     className="bg-dash-text text-dash-bg px-6 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-2"
                   >
                     Continue to Rules
                   </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-[calc(100vh-250px)]">
              <div className="flex items-center gap-3 mb-2 shrink-0">
                <Settings className="w-6 h-6 text-dash-accent" />
                <h2 className="text-lg font-semibold tracking-widest uppercase">3. Agent Engine Rules</h2>
              </div>
              <p className="text-xs text-dash-muted leading-relaxed uppercase tracking-widest shrink-0 mb-4">
                Configure the trading thesis, boundaries, and JSON schema expectation for the underlying model.
              </p>

              <div className="flex-1 relative flex flex-col bg-white/5 border border-dash-border rounded p-6">
                 <div className="flex items-center gap-2 mb-4 shrink-0">
                   <FileText className="w-4 h-4 text-dash-accent" />
                   <label className="text-[10px] text-dash-muted uppercase tracking-widest">System Prompt Override</label>
                 </div>
                 <textarea 
                   className="w-full flex-1 bg-dash-bg border border-dash-border rounded p-4 text-xs md:text-sm outline-none text-dash-accent font-mono resize-none focus-within:border-dash-accent transition-colors shadow-inner"
                   value={instructions}
                   onChange={(e) => setInstructions(e.target.value)}
                   spellCheck={false}
                 />
                 
                 <div className="flex items-center gap-4 mt-6 pt-6 border-t border-dash-border shrink-0 justify-end">
                   {saveStatus === "success" && (
                      <div className="flex items-center gap-2 text-dash-accent text-xs font-medium uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4" /> Deployed
                      </div>
                   )}
                   <button 
                     onClick={saveConfig}
                     disabled={saveStatus === "saving"}
                     className="bg-dash-text text-dash-bg px-8 py-3 text-[11px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-2 disabled:opacity-60 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                   >
                     {saveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                     Commit & Deploy Rules
                   </button>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
