import Link from "next/link";
import { Grid, Layers, Layout, MousePointer2, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 px-6 md:py-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="relative bg-prussian-blue border border-prussian-blue-600 shadow-[0_20px_60px_rgba(20,33,61,0.3)] rounded-[3rem] p-12 md:p-24 text-center flex flex-col items-center overflow-hidden group">
          
          {/* Floating Icons Background */}
          <div className="absolute inset-0 pointer-events-none opacity-60">
             <div className="absolute top-[10%] left-[10%] text-white/5 animate-drift-1">
                <Grid size={120} strokeWidth={1} />
             </div>
             <div className="absolute bottom-[10%] right-[5%] text-white/5 animate-drift-2">
                <Layers size={140} strokeWidth={1} />
             </div>
             <div className="absolute top-[20%] right-[15%] text-[#fca311]/20 animate-drift-3">
                <Sparkles size={60} strokeWidth={1.5} />
             </div>
             <div className="absolute bottom-[20%] left-[15%] text-white/10 animate-drift-1" style={{ animationDelay: '-5s' }}>
                <Layout size={90} strokeWidth={1.5} />
             </div>
             <div className="absolute top-[40%] left-[5%] text-white/5 animate-drift-2" style={{ animationDelay: '-10s' }}>
                <MousePointer2 size={70} strokeWidth={1.5} />
             </div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter text-white leading-[0.9] mb-8 drop-shadow-lg">
              Build your grid.
            </h2>
            <p className="text-xl md:text-2xl text-white mb-16 max-w-2xl font-medium leading-relaxed drop-shadow-sm">
              Experience the difference of a tool crafted specifically for design-conscious students.
            </p>
            <Link
              href="/app"
              className="relative overflow-hidden bg-[#fca311] text-black px-12 py-6 rounded-full text-xl md:text-2xl font-bold transition-all shadow-[0_0_60px_rgba(252,163,17,0.5)] hover:shadow-[0_0_80px_rgba(252,163,17,0.6)] hover:-translate-y-1 hover:scale-105 active:scale-95 group/btn"
            >
              <span className="relative z-10">Start Building Now</span>
              <div className="absolute inset-0 -translate-x-full bg-white/30 skew-x-12 group-hover/btn:animate-[translate-x-full_1s_ease-in-out_forwards] transition-transform duration-700 group-hover/btn:translate-x-[200%]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
