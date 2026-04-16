import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [isProxying, setIsProxying] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const handleLaunch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url) return;
    
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    document.cookie = `bypass_muted=${isMuted}; path=/`;
    setProxyUrl(`/proxy/${targetUrl}`);
    setIsProxying(true);
  };

  if (isProxying) {
    return (
      <div className="flex flex-col h-screen bg-bg-dark text-white font-sans overflow-hidden">
        <header className="flex items-center justify-between px-10 h-20 border-b border-border-dark shrink-0">
          <div className="text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => setIsProxying(false)}>
            BY<span className="text-accent">PASS</span>.CORE
          </div>
          <div className="text-[10px] uppercase tracking-widest text-text-muted flex items-center">
            <span className="text-green-500 mr-2 text-lg leading-none">&bull;</span> 
            TUNNEL ACTIVE: {url}
          </div>
        </header>
        <div className="flex-1 relative bg-white">
          <iframe 
            src={proxyUrl} 
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts allow-forms"
            title="Proxy View"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-white font-sans overflow-hidden relative">
      <div className="absolute top-[120px] left-[150px] text-[200px] font-black text-[#111] -z-10 select-none">
        01X
      </div>

      {/* Container grid */}
      <div className="grid grid-cols-[100px_1fr_300px] grid-rows-[80px_1fr_120px] h-full w-full max-w-[1440px] mx-auto">
        
        {/* Top Header */}
        <header className="col-span-3 border-b border-border-dark flex items-center justify-between px-10">
          <div className="text-2xl font-black tracking-tighter uppercase">
            BY<span className="text-accent">PASS</span>.CORE
          </div>
          <div className="text-[10px] uppercase tracking-widest text-text-muted flex items-center">
            <span className="text-green-500 mr-2 text-lg leading-none">&bull;</span> 
            NODE: AMSTERDAM-04 // ACTIVE
          </div>
        </header>

        {/* Left Rail */}
        <aside className="row-start-2 col-start-1 border-r border-border-dark flex flex-col justify-center items-center gap-10">
          <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] uppercase tracking-[4px] text-text-darker">
            UNFILTERED ACCESS
          </div>
          <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] uppercase tracking-[4px] text-text-darker">
            VERSION 4.0.2
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="row-start-2 col-start-2 p-[60px] flex flex-col justify-center">
          <h1 className="text-[82px] leading-[0.9] font-black mb-10 tracking-[-3px]">
            BORDERLESS<br/>INTERNET
          </h1>
          
          <form onSubmit={handleLaunch} className="relative w-full max-w-2xl">
            {!url && (
              <div className="absolute top-[25px] left-0 text-[32px] text-border-dark pointer-events-none font-mono">
                https://enter-blocked-url.com
              </div>
            )}
            <input 
              type="text" 
              className="bg-transparent border-none border-b-2 border-accent w-full py-5 text-[32px] text-accent font-mono outline-none focus:ring-0"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-8 mt-[30px]">
              <button 
                type="submit"
                className="bg-accent text-black border-none py-[15px] px-[40px] font-black uppercase cursor-pointer text-[14px] tracking-[1px] w-fit hover:bg-opacity-90 transition-colors"
              >
                Launch Tunnel
              </button>
              <label className="flex items-center gap-3 cursor-pointer text-text-muted hover:text-accent transition-colors group">
                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${isMuted ? 'border-accent bg-accent' : 'border-border-dark group-hover:border-accent'}`}>
                  {isMuted && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-[12px] uppercase tracking-[2px] font-bold">Start Muted</span>
              </label>
            </div>
          </form>
        </main>

        {/* Right Content Panel */}
        <aside className="row-start-2 col-start-3 border-l border-border-dark p-10 flex flex-col gap-[30px]">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-text-muted mb-2.5">
              Popular Destinations
            </div>
            <ul className="list-none flex flex-col gap-5">
              {[
                { name: 'X / TWITTER', category: 'Social Network', url: 'twitter.com' },
                { name: 'YOUTUBE GLOBAL', category: 'Media Streaming', url: 'youtube.com' },
                { name: 'BBC NEWS', category: 'Information', url: 'bbc.com' },
                { name: 'REDDIT', category: 'Community', url: 'reddit.com' }
              ].map((preset) => (
                <li 
                  key={preset.name} 
                  className="cursor-pointer group"
                  onClick={() => {
                    setUrl(preset.url);
                  }}
                >
                  <span className="text-[18px] font-bold block group-hover:text-accent transition-colors">
                    {preset.name}
                  </span>
                  <span className="text-[11px] text-text-darker uppercase">
                    {preset.category}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-auto">
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-text-muted mb-2.5">
              Encryption
            </div>
            <div className="text-[12px] leading-[1.4] text-text-light">
              End-to-end AES-256 bit tunnel active. Your IP is masked via residential routing.
            </div>
          </div>
        </aside>

        {/* Bottom Bar */}
        <footer className="col-span-3 row-start-3 border-t border-border-dark grid grid-cols-4 items-center px-10">
          <div className="border-r border-border-dark px-5">
            <div className="text-[24px] font-bold text-accent">4.2 GB/s</div>
            <div className="text-[10px] text-text-muted uppercase">Current Throughput</div>
          </div>
          <div className="border-r border-border-dark px-5">
            <div className="text-[24px] font-bold text-accent">14 ms</div>
            <div className="text-[10px] text-text-muted uppercase">Tunnel Latency</div>
          </div>
          <div className="border-r border-border-dark px-5">
            <div className="text-[24px] font-bold text-accent">642</div>
            <div className="text-[10px] text-text-muted uppercase">Global Exit Nodes</div>
          </div>
          <div className="px-5">
            <div className="text-[24px] font-bold text-accent">100%</div>
            <div className="text-[10px] text-text-muted uppercase">Anonymity Score</div>
          </div>
        </footer>

      </div>
    </div>
  );
}
