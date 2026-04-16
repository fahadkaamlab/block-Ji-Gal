import React, { useState, useEffect } from 'react';
import { Shield, Globe, Zap, Lock, ArrowLeft, RotateCcw, Monitor, Terminal, Activity, Menu, Globe2, Coffee } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [isProxying, setIsProxying] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState(14);
  const [throughput, setThroughput] = useState(4.2);

  // Simulate network jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(8, Math.min(25, prev + (Math.random() - 0.5) * 2)));
      setThroughput(prev => Math.max(3.8, Math.min(4.9, prev + (Math.random() - 0.5) * 0.1)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = (e?: React.FormEvent, target?: string) => {
    e?.preventDefault();
    const finalUrl = target || url;
    if (!finalUrl) return;
    
    let sanitizedUrl = finalUrl.trim();
    if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }
    
    // Persist mute state in cookie for the proxy to read
    document.cookie = `bypass_muted=${isMuted}; path=/; max-age=3600`;
    
    setProxyUrl(`/proxy/${sanitizedUrl}`);
    setIsProxying(true);
    setIsLoading(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (isProxying) {
    return (
      <div className="flex flex-col h-screen bg-[#080808] text-white font-sans overflow-hidden">
        <header className="flex items-center justify-between px-6 h-16 border-b border-[#222] shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-6">
            <button 
              className="p-2 hover:bg-[#222] transition-colors rounded-none border border-transparent hover:border-[#CCFF00]"
              onClick={() => {
                setIsProxying(false);
                setIsLoading(false);
              }}
              title="Return to Dashboard"
            >
              <ArrowLeft size={20} className="text-[#CCFF00]" />
            </button>
            <div className="text-xl font-black tracking-tighter uppercase select-none hidden md:block">
              BY<span className="text-[#CCFF00]">PASS</span>.CORE
            </div>
          </div>
          
          <div className="flex-1 max-w-2xl px-4 md:px-10">
            <div className="bg-[#111] border border-[#222] px-4 py-1.5 text-xs font-mono text-[#666] flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <span className="text-[#CCFF00] shrink-0">TUNNEL://</span>
              <span className="truncate">{url || proxyUrl.split('/proxy/')[1]}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#CCFF00] animate-pulse hidden sm:flex">
                <span className="w-2 h-2 bg-[#CCFF00] rounded-full"></span>
                POLLING...
              </div>
            )}
            <button 
              className="p-2 hover:bg-[#222] transition-colors text-[#666] hover:text-[#CCFF00]"
              onClick={() => {
                const current = proxyUrl;
                setProxyUrl('');
                setTimeout(() => {
                  setProxyUrl(current);
                  setIsLoading(true);
                }, 10);
              }}
              title="Reload Tunnel"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 relative bg-white">
          {isLoading && (
            <div className="absolute inset-0 bg-[#080808] z-20 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-24 h-1 bg-[#111] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#CCFF00] animate-[shimmer_1.5s_infinite] origin-left"></div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-mono text-[#CCFF00] uppercase tracking-[4px]">Initiating Handshake</div>
                <div className="text-[8px] font-mono text-[#444] uppercase tracking-[2px]">AES-256-GCM / DH-KEY-EXCHANGE</div>
              </div>
            </div>
          )}
          <iframe 
            src={proxyUrl} 
            className="w-full h-full border-none bg-white"
            onLoad={handleIframeLoad}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            title="Proxy View"
          />
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            0% { transform: scaleX(0); transform-origin: left; }
            45% { transform: scaleX(1); transform-origin: left; }
            55% { transform: scaleX(1); transform-origin: right; }
            100% { transform: scaleX(0); transform-origin: right; }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#080808] text-white font-sans overflow-hidden relative selection:bg-[#CCFF00] selection:text-black">
      {/* Background Graphic */}
      <div className="absolute top-[10%] left-[10%] text-[24vw] font-black text-[#111] -z-10 select-none leading-none tracking-tighter opacity-50">
        01X
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_300px] grid-rows-[80px_1fr_auto] md:grid-rows-[80px_1fr_120px] h-full w-full max-w-[1600px] mx-auto overflow-y-auto md:overflow-hidden bg-[#080808] border-x border-[#222]">
        
        {/* Top Header */}
        <header className="col-span-1 md:col-span-3 border-b border-[#222] flex items-center justify-between px-10 bg-[#080808] z-10 sticky top-0">
          <div className="flex items-center gap-10">
            <div className="text-2xl font-black tracking-tighter uppercase cursor-default">
              BY<span className="text-[#CCFF00]">PASS</span>.CORE
            </div>
            <nav className="hidden lg:flex items-center gap-6">
              {['Networks', 'Security', 'Exit Nodes', 'Logs'].map(item => (
                <a key={item} href="#" className="text-[10px] uppercase tracking-widest text-[#444] hover:text-[#CCFF00] transition-colors">{item}</a>
              ))}
            </nav>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[#666] flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-green-500 mr-2 text-lg leading-none animate-pulse">&bull;</span> 
              NODE: AMSTERDAM-04
            </div>
            <div className="hidden sm:block text-[#222]">|</div>
            <div className="hidden sm:block">UPTIME: 9422:12:04</div>
          </div>
        </header>

        {/* Left Rail (Desktop Only) */}
        <aside className="hidden md:flex row-start-2 col-start-1 border-r border-[#222] flex-col justify-between py-10 items-center">
          <div className="flex flex-col gap-8">
            <Globe2 size={20} className="text-[#444] hover:text-[#CCFF00] cursor-pointer" />
            <Shield size={20} className="text-[#444] hover:text-[#CCFF00] cursor-pointer" />
            <Activity size={20} className="text-[#444] hover:text-[#CCFF00] cursor-pointer" />
          </div>
          <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] uppercase tracking-[4px] text-[#444] h-fit">
            UNFILTERED ACCESS // v4.0.2
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="row-start-2 col-start-1 md:col-start-2 p-8 md:p-[80px] flex flex-col justify-center">
          <div className="mb-12">
            <div className="inline-block bg-[#CCFF00] text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest mb-4">
              Access Granted
            </div>
            <h1 className="text-[64px] md:text-[100px] leading-[0.85] font-black mb-10 tracking-[-4px] uppercase italic">
              Borderless<br/>Internet
            </h1>
            <p className="text-[#666] max-w-md text-sm leading-relaxed font-medium uppercase tracking-wider mb-2">
              Bypass geo-restrictions and corporate filters with industrial-grade residential proxy tunneling.
            </p>
          </div>
          
          <form onSubmit={handleLaunch} className="relative w-full max-w-2xl group">
            <div className="relative">
              {!url && (
                <div className="absolute top-[20px] left-0 text-xl md:text-[32px] text-[#222] pointer-events-none font-mono tracking-tighter">
                  HTTPS://ENTER-TUNNEL-URL.NET
                </div>
              )}
              <input 
                type="text" 
                className="bg-transparent border-none border-b-4 border-[#222] focus:border-[#CCFF00] w-full py-4 text-xl md:text-[40px] text-[#CCFF00] font-mono outline-none transition-all duration-500 placeholder:text-[#222] uppercase"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mt-10">
              <button 
                type="submit"
                className="bg-[#CCFF00] text-black border-none py-4 px-10 font-black uppercase cursor-pointer text-[14px] tracking-[2px] w-full sm:w-fit hover:bg-white hover:-translate-y-1 transition-all duration-300 shadow-[8px_8px_0px_#111] hover:shadow-[12px_12px_0px_#111]"
              >
                Launch Tunnel
              </button>
              
              <label className="flex items-center gap-4 cursor-pointer text-[#666] hover:text-[#CCFF00] transition-colors group">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isMuted} 
                  onChange={() => setIsMuted(!isMuted)} 
                />
                <div className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${isMuted ? 'border-[#CCFF00] bg-[#CCFF00]' : 'border-[#333] group-hover:border-[#CCFF00]'}`}>
                  {isMuted && <Shield size={14} className="text-black" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[2px] font-black">Silent Mode</span>
                  <span className="text-[8px] uppercase tracking-[1px] opacity-50">Auto-mute Audio/Video</span>
                </div>
              </label>
            </div>
          </form>
        </main>

        {/* Right Content Panel (Desktop Only) */}
        <aside className="hidden md:flex row-start-2 col-start-3 border-l border-[#222] p-10 flex flex-col gap-10 bg-[#0a0a0a]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] font-black uppercase tracking-[3px] text-[#444]">
                Presets
              </div>
              <Terminal size={14} className="text-[#222]" />
            </div>
            <ul className="list-none flex flex-col gap-6">
              {[
                { name: 'X / TWITTER', category: 'Social Grid', url: 'twitter.com' },
                { name: 'YOUTUBE', category: 'Global Media', url: 'youtube.com' },
                { name: 'WIKIPEDIA', category: 'Knowledge', url: 'wikipedia.org' },
                { name: 'REDDIT', category: 'Community', url: 'reddit.com' }
              ].map((preset) => (
                <li 
                  key={preset.name} 
                  className="cursor-pointer group relative overflow-hidden"
                  onClick={() => handleLaunch(undefined, preset.url)}
                >
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-[#CCFF00] -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                  <div className="pl-0 group-hover:pl-4 transition-all duration-300">
                    <span className="text-[20px] font-black block group-hover:text-[#CCFF00] leading-none mb-1">
                      {preset.name}
                    </span>
                    <span className="text-[9px] text-[#444] uppercase tracking-widest font-bold">
                      {preset.category}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-auto p-6 border border-[#222] bg-[#080808]">
            <div className="flex items-center gap-3 mb-4">
              <Lock size={16} className="text-[#CCFF00]" />
              <div className="text-[10px] font-black uppercase tracking-[2px] text-[#CCFF00]">
                Encryption Status
              </div>
            </div>
            <div className="text-[11px] leading-relaxed text-[#555] font-medium italic">
              "Tunnel active via residential backbone. IP scrubbed. Fingerprint randomized for maximum stealth."
            </div>
          </div>
        </aside>

        {/* Bottom Bar Stats */}
        <footer className="col-span-1 md:col-span-3 row-start-3 border-t border-[#222] grid grid-cols-2 lg:grid-cols-4 items-center bg-[#080808]">
          <div className="border-r border-[#222] p-8 group hover:bg-[#0a0a0a] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Throughput</div>
              <Zap size={14} className="text-[#222] group-hover:text-[#CCFF00]" />
            </div>
            <div className="text-[32px] font-black text-[#CCFF00] tracking-tighter leading-none italic">{throughput.toFixed(1)} GB/S</div>
          </div>
          
          <div className="border-r border-[#222] p-8 group hover:bg-[#0a0a0a] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Latency</div>
              <Activity size={14} className="text-[#222] group-hover:text-[#CCFF00]" />
            </div>
            <div className="text-[32px] font-black text-[#CCFF00] tracking-tighter leading-none italic">{latency.toFixed(0)} MS</div>
          </div>
          
          <div className="border-r border-[#222] p-8 group hover:bg-[#0a0a0a] transition-colors hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Exit Points</div>
              <Monitor size={14} className="text-[#222] group-hover:text-[#CCFF00]" />
            </div>
            <div className="text-[32px] font-black text-[#CCFF00] tracking-tighter leading-none italic">1,842</div>
          </div>
          
          <div className="p-8 group hover:bg-[#0a0a0a] transition-colors hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Payload Encr.</div>
              <Shield size={14} className="text-[#222] group-hover:text-[#CCFF00]" />
            </div>
            <div className="text-[32px] font-black text-[#CCFF00] tracking-tighter leading-none italic">AES-256</div>
          </div>
        </footer>

      </div>
    </div>
  );
}

