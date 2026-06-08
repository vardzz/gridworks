import Link from "next/link";
import { Hexagon, Triangle, Circle, Square, Box } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-white px-6 pt-32 pb-8 overflow-hidden">
      
      {/* Floating Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.15]">
        <div className="absolute top-[20%] left-[10%] text-prussian-blue-600 animate-drift-1"><Hexagon size={120} strokeWidth={1} /></div>
        <div className="absolute top-[40%] right-[15%] text-[#fca311] animate-drift-2"><Triangle size={90} strokeWidth={1} /></div>
        <div className="absolute bottom-[30%] left-[25%] text-prussian-blue-300 animate-drift-3"><Circle size={100} strokeWidth={1} /></div>
        <div className="absolute bottom-[10%] right-[30%] text-alabaster-grey-900 animate-drift-1" style={{animationDelay: '-5s'}}><Square size={140} strokeWidth={1} /></div>
        <div className="absolute top-[10%] right-[5%] text-prussian-blue-600 animate-drift-2" style={{animationDelay: '-8s'}}><Box size={80} strokeWidth={1} /></div>
      </div>

      <div className="relative max-w-[1400px] mx-auto flex flex-col z-10">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20 md:mb-32">
          {/* Left Hook */}
          <div className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-black max-w-sm leading-tight">
            Experience the difference.
          </div>

          {/* Right Links */}
          <div className="flex flex-wrap gap-16 md:gap-32">
            <div>
              <ul className="space-y-4 text-sm font-semibold text-black tracking-tight">
                <li><Link href="/app" className="hover:text-[#fca311] transition-colors">App</Link></li>
                <li><Link href="#features" className="hover:text-[#fca311] transition-colors">Features</Link></li>
                <li><Link href="#themes" className="hover:text-[#fca311] transition-colors">Themes</Link></li>
              </ul>
            </div>
            <div>
              <ul className="space-y-4 text-sm font-semibold text-black tracking-tight">
                <li><a href="#" className="hover:text-[#fca311] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[#fca311] transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-[#fca311] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Massive Typography */}
        <div className="w-full mb-16 md:mb-24 flex items-center justify-center pointer-events-auto select-none">
          <h1 
            className="text-[19.5vw] xl:text-[275px] leading-[0.75] font-bold tracking-tighter text-prussian-blue flex items-baseline group cursor-default"
            aria-label="Gridworks"
          >
            <span aria-hidden="true">Gr</span>
            <span className="relative inline-flex justify-center" aria-hidden="true">
              {/* The Witty Grid Dot */}
              <span className="absolute bottom-[0.75em] grid grid-cols-2 gap-[2px] md:gap-[4px] w-[0.18em] h-[0.18em] transition-all duration-700 ease-out group-hover:gap-[8px] md:group-hover:gap-[12px] group-hover:-translate-y-4 group-hover:rotate-12">
                 <span className="bg-[#fca311] rounded-sm" />
                 <span className="bg-prussian-blue-300 rounded-sm" />
                 <span className="bg-prussian-blue-600 rounded-sm" />
                 <span className="bg-[#fca311] rounded-sm" />
              </span>
              <span>ı</span>
            </span>
            <span aria-hidden="true">dworks</span>
          </h1>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-sm font-semibold text-prussian-blue-600 border-t border-alabaster-grey pt-8">
          <div className="flex items-center gap-6 text-black/60">
             <span>Built by <a href="https://www.vardz.dev/" target="_blank" rel="noopener noreferrer" className="text-black hover:text-[#fca311] transition-colors underline decoration-2 underline-offset-4">Vardz</a></span>
             <a href="https://github.com/vardzz/gridworks.git" target="_blank" rel="noopener noreferrer" className="text-black hover:text-[#fca311] transition-colors flex items-center gap-2">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
               Github
             </a>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 md:gap-8 text-black/60">
             <span className="hover:text-black transition-colors">© {new Date().getFullYear()} Gridworks.</span>
             <span className="hover:text-black transition-colors">All rights reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
