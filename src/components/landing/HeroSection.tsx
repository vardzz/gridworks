import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative w-full px-8 md:px-16 lg:px-24 xl:px-32 py-12 lg:py-0 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 overflow-hidden min-h-[calc(100vh-80px)]">
      
      {/* Left: Typography */}
      <div className="w-full lg:w-1/2 flex flex-col items-start z-10 pt-4 lg:pt-0 justify-center">
        <h1 className="text-6xl md:text-7xl xl:text-[7.5rem] font-bold tracking-tighter text-black leading-[0.9] mb-6 xl:mb-8 shrink-0 drop-shadow-2xl">
          Schedule.<br />
          <span className="text-prussian-blue-300 drop-shadow-md">Mastered.</span>
        </h1>
        <p className="text-lg md:text-xl xl:text-2xl text-prussian-blue-600 max-w-lg leading-snug mb-8 xl:mb-12 font-medium">
          Gridworks reads your university schedule PDF and renders it as a print-ready, style grid - instantly, entirely in your browser. No sign-up. No servers. Just results.
        </p>
        <div className="flex flex-wrap items-center gap-4 xl:gap-6">
          <Link
            href="/app"
            className="bg-[#fca311] text-black px-8 xl:px-10 py-4 xl:py-5 rounded-full text-base xl:text-lg font-bold transition-all shadow-[0_4px_20px_rgba(252,163,17,0.4)] hover:-translate-y-1 hover:scale-105 active:scale-95"
          >
            Try now
          </Link>
          <Link
            href="#features"
            className="text-prussian-blue-600 font-bold text-base xl:text-lg hover:text-black transition-colors underline decoration-2 underline-offset-4"
          >
            See how
          </Link>
        </div>
      </div>

      {/* Right: Asymmetrical Floating Composition */}
      <div className="w-full lg:w-1/2 relative h-[350px] sm:h-[450px] lg:h-[550px] xl:h-[650px] flex items-center justify-center pointer-events-none origin-center scale-75 sm:scale-90 lg:scale-100">
        {/* The Grid abstraction */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-40" />
        
        {/* Pristine Cards */}
        <div className="relative z-10 w-full max-w-md h-[400px]">
          {/* Advanced Design Card */}
          <div className="absolute top-10 left-[-2rem] z-10 animate-float">
            <div className="w-96 h-56 bg-white border border-alabaster-grey shadow-2xl p-8 rounded-3xl -rotate-[3deg] transition-transform duration-1000 ease-out hover:rotate-0 hover:-translate-y-4 flex flex-col">
              <div className="w-16 h-2.5 bg-[#fca311] mb-5 rounded-full shrink-0" />
              <div className="text-5xl font-bold tracking-tight text-black">Advanced<br/>Design</div>
              <div className="text-base font-medium text-prussian-blue-600 mt-auto">1:00 PM • Studio</div>
            </div>
          </div>

          {/* CS 101 Card */}
          <div className="absolute top-[-2rem] right-0 z-20 animate-float-delayed">
            <div className="w-80 h-48 bg-white border border-alabaster-grey shadow-2xl p-8 rounded-3xl rotate-[6deg] translate-x-4 translate-y-12 transition-transform duration-1000 ease-out hover:rotate-0 hover:translate-x-0 flex flex-col">
              <div className="w-14 h-2.5 bg-[#fca311] mb-4 rounded-full shrink-0" />
              <div className="text-5xl font-bold tracking-tight text-black">CS 101</div>
              <div className="text-base font-medium text-prussian-blue-600 mt-auto">9:00 AM • Lecture Hall</div>
            </div>
          </div>

          {/* Physics II Card */}
          <div className="absolute top-48 right-0 z-10 animate-float-slow">
            <div className="w-72 h-44 bg-white border border-alabaster-grey shadow-2xl p-7 rounded-3xl rotate-[4deg] translate-y-8 transition-transform duration-1000 ease-out hover:rotate-0 flex flex-col">
              <div className="w-12 h-2.5 bg-[#fca311] mb-4 rounded-full shrink-0" />
              <div className="text-5xl font-bold tracking-tight text-black">Physics II</div>
              <div className="text-sm font-medium text-prussian-blue-600 mt-auto">3:30 PM • Lab 4</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
