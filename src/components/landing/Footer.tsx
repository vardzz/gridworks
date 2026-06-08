import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white px-6 pt-32 pb-8 overflow-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col">
        
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
        <div className="flex flex-col md:flex-row justify-end items-center gap-8 text-sm font-semibold text-prussian-blue-600 border-t border-alabaster-grey pt-8">
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 md:gap-8 text-black/60">
             <span className="hover:text-black cursor-pointer transition-colors">© {new Date().getFullYear()} Gridworks</span>
             <span className="hover:text-black cursor-pointer transition-colors">Handcrafted in browser</span>
             <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
