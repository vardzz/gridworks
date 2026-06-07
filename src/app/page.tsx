import Link from "next/link";
import { THEME_PRESETS } from "@/lib/themes";

export default function LandingPage() {
  const themes = Object.values(THEME_PRESETS);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-orange selection:text-white flex flex-col">
      
      {/* ── Navbar: Ultra Minimal ──────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-alabaster-grey transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-bold text-2xl tracking-tighter text-black">
            Gridworks.
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-prussian-blue-600">
              <Link href="#features" className="hover:text-orange transition-colors">Features</Link>
              <Link href="#themes" className="hover:text-orange transition-colors">Themes</Link>
              <Link href="#faq" className="hover:text-orange transition-colors">FAQ</Link>
            </div>
            <Link
              href="/app"
              className="inline-flex items-center justify-center bg-orange text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
            >
              Start Building
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        
        {/* ── Hero Section: Asymmetrical & Editorial ─────────────────── */}
        <section className="relative w-full px-6 py-24 md:py-48 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-20 overflow-hidden">
          
          {/* Left: Typography */}
          <div className="w-full md:w-1/2 flex flex-col items-start z-10">
            <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tighter text-black leading-[0.9] mb-8">
              Schedule.<br />
              <span className="text-prussian-blue-300">Mastered.</span>
            </h1>
            <p className="text-xl md:text-2xl text-prussian-blue-600 max-w-lg leading-snug mb-12 font-medium">
              We transformed the chaotic registration process into an elegant, print-ready grid. Instantly. Privately. Beautifully.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/app"
                className="bg-orange text-white px-10 py-5 rounded-full text-lg font-bold hover:bg-orange-600 transition-all shadow-[0_4px_20px_rgba(252,163,17,0.3)] hover:-translate-y-1"
              >
                Try for free
              </Link>
              <Link
                href="#features"
                className="text-prussian-blue-600 font-bold text-lg hover:text-black transition-colors underline decoration-2 underline-offset-4"
              >
                See how
              </Link>
            </div>
          </div>

          {/* Right: Asymmetrical Floating Composition */}
          <div className="w-full md:w-1/2 relative h-[500px] md:h-[700px] flex items-center justify-center pointer-events-none">
            {/* The Grid abstraction */}
            <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-40" />
            
            {/* Pristine Cards */}
            <div className="relative z-10 w-full max-w-md">
              <div className="absolute top-0 right-10 w-72 h-40 bg-white border border-alabaster-grey shadow-2xl p-6 rounded-2xl rotate-[6deg] translate-x-12 translate-y-12 transition-transform duration-1000 ease-out hover:rotate-0 hover:translate-x-0">
                <div className="w-8 h-2 bg-prussian-blue mb-4 rounded-full" />
                <div className="text-3xl font-bold tracking-tight text-black">CS 101</div>
                <div className="text-sm font-medium text-prussian-blue-600 mt-1">9:00 AM • Lecture Hall</div>
              </div>
              
              <div className="absolute top-32 left-0 w-80 h-48 bg-prussian-blue shadow-2xl p-6 rounded-2xl -rotate-[3deg] transition-transform duration-1000 ease-out hover:rotate-0 hover:-translate-y-4">
                <div className="w-12 h-2 bg-orange mb-4 rounded-full" />
                <div className="text-4xl font-bold tracking-tight text-white">Advanced<br/>Design</div>
                <div className="text-sm font-medium text-prussian-blue-900 mt-2">1:00 PM • Studio</div>
              </div>

              <div className="absolute top-64 right-0 w-64 h-32 bg-alabaster-grey-900 border border-alabaster-grey shadow-xl p-6 rounded-2xl rotate-[4deg] translate-y-8 transition-transform duration-1000 ease-out hover:rotate-0">
                <div className="w-6 h-2 bg-black mb-3 rounded-full" />
                <div className="text-2xl font-bold tracking-tight text-black">Physics II</div>
                <div className="text-sm font-medium text-prussian-blue-600 mt-1">3:30 PM • Lab 4</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Problem Section: Typographic Tension ──────────────── */}
        <section className="py-48 px-6 bg-alabaster-grey-900 border-y border-alabaster-grey">
          <div className="max-w-[1000px] mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-black leading-tight">
              Stop fighting with spreadsheets.<br/>
              <span className="text-prussian-blue-600">Your time is too valuable.</span>
            </h2>
          </div>
        </section>

        {/* ── Features Section: Sticky-Scroll Editorial ─────────────── */}
        <section id="features" className="relative max-w-[1400px] mx-auto px-6 py-32 md:py-48">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24 relative items-start">
            
            {/* Sticky Typography Column */}
            <div className="md:col-span-5 md:sticky md:top-40">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-black mb-8 leading-[0.9]">
                Designed<br/>for speed.
              </h2>
              <p className="text-xl text-prussian-blue-600 font-medium max-w-md leading-relaxed">
                A relentless focus on removing friction. From raw PDF to a stunning visual output in under three seconds.
              </p>
            </div>

            {/* Scrolling Visuals Column */}
            <div className="md:col-span-7 flex flex-col gap-32">
              
              {/* Feature 1 */}
              <div className="group">
                <div className="text-sm font-bold text-orange tracking-widest uppercase mb-4">01 — Intake</div>
                <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Drop your raw data.</h3>
                <div className="aspect-[4/3] bg-alabaster-grey-900 border border-alabaster-grey p-8 md:p-16 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
                  <div className="w-full max-w-sm bg-white border border-alabaster-grey shadow-2xl rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-prussian-blue rounded-full mx-auto mb-6 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white rounded-sm border-t-transparent animate-spin" />
                    </div>
                    <div className="text-xl font-bold text-black mb-2">Parsing schedule...</div>
                    <div className="text-sm text-prussian-blue-600">Reading 14 items from text</div>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group">
                <div className="text-sm font-bold text-orange tracking-widest uppercase mb-4">02 — Review</div>
                <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Edit with precision.</h3>
                <div className="aspect-[4/3] bg-prussian-blue border border-prussian-blue-600 p-8 md:p-16 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
                  <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="h-12 border-b border-alabaster-grey flex items-center px-6">
                      <div className="text-sm font-bold text-black">Schedule Data</div>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 border border-alabaster-grey rounded-lg flex items-center px-4 gap-4">
                          <div className={`w-4 h-4 rounded-full ${i === 1 ? 'bg-orange' : 'bg-prussian-blue'}`} />
                          <div className="flex-1 h-2 bg-alabaster-grey-900 rounded-full" />
                          <div className="w-24 h-2 bg-alabaster-grey-900 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group">
                <div className="text-sm font-bold text-orange tracking-widest uppercase mb-4">03 — Export</div>
                <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Print-ready aesthetics.</h3>
                <div className="aspect-[4/3] bg-alabaster-grey-900 border border-alabaster-grey p-8 md:p-16 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
                  <div className="w-full h-full bg-white border border-alabaster-grey shadow-2xl flex">
                     {/* Mock Grid Lines */}
                     <div className="flex-1 border-r border-alabaster-grey h-full relative">
                        <div className="absolute top-1/4 left-4 right-4 h-24 bg-prussian-blue-800 rounded-sm" />
                     </div>
                     <div className="flex-1 border-r border-alabaster-grey h-full relative">
                        <div className="absolute top-1/2 left-4 right-4 h-32 bg-orange-800 rounded-sm" />
                     </div>
                     <div className="flex-1 h-full relative">
                        <div className="absolute top-1/3 left-4 right-4 h-16 bg-prussian-blue-800 rounded-sm" />
                     </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Themes Section: Staggered Grid ────────────────────────── */}
        <section id="themes" className="py-32 md:py-48 px-6 bg-white border-t border-alabaster-grey">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-black leading-[0.9]">
                Themes.
              </h2>
              <p className="text-xl text-prussian-blue-600 font-medium max-w-md">
                Carefully curated palettes. Start with a foundation, customize every variable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {themes.map((theme, idx) => (
                <div
                  key={theme.id}
                  className={`group cursor-pointer ${idx % 2 === 1 ? 'lg:mt-24' : ''}`}
                >
                  <div className="aspect-[4/5] bg-alabaster-grey-900 border border-alabaster-grey mb-6 relative overflow-hidden transition-all duration-500 group-hover:border-black">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 flex flex-col justify-end p-6 gap-2">
                      {theme.previewColors.map((color, i) => (
                        <div
                          key={i}
                          className="h-8 w-full transition-transform duration-700 group-hover:translate-x-2"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-2 tracking-tight">
                    {theme.name}
                  </h3>
                  <p className="text-base text-prussian-blue-600 leading-relaxed font-medium">
                    {theme.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section: Minimalist Line-Art ──────────────────────── */}
        <section id="faq" className="py-32 md:py-48 px-6">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-black mb-24 leading-[0.9]">
              Questions.
            </h2>

            <div className="border-t border-alabaster-grey">
              {[
                { q: "Is Gridworks completely free?", a: "Yes. Gridworks is entirely free to use. No subscriptions, no hidden fees, and no paywalls. Built by students, for students." },
                { q: "Does Gridworks store my class schedule?", a: "No. Our architecture is privacy-first by design. All parsing and rendering executes entirely within your local browser environment. We never see, transmit, or store your data." },
                { q: "What formats can I upload?", a: "You can drop PDF registration files downloaded from most standard university portals, or simply paste the raw text payload directly into the intake engine." },
              ].map((faq, i) => (
                <details key={i} className="group border-b border-alabaster-grey py-8 open:pb-12 transition-all cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between text-2xl md:text-3xl font-bold tracking-tight text-black outline-none hover:text-orange transition-colors">
                    {faq.q}
                    <div className="text-prussian-blue-600 font-normal group-open:rotate-45 transition-transform duration-300">+</div>
                  </summary>
                  <p className="mt-8 text-xl text-prussian-blue-600 leading-relaxed font-medium max-w-3xl">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA: The Contrast Void ──────────────────────────── */}
        <section className="bg-prussian-blue pt-48 pb-32 px-6">
          <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center">
            <h2 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter text-white leading-[0.9] mb-12">
              Build your grid.
            </h2>
            <p className="text-xl md:text-2xl text-prussian-blue-900 mb-20 max-w-2xl font-medium">
              Experience the difference of a tool crafted specifically for design-conscious students.
            </p>
            <Link
              href="/app"
              className="bg-orange text-white px-12 py-6 rounded-full text-2xl font-bold hover:bg-white hover:text-black transition-all shadow-[0_0_60px_rgba(252,163,17,0.3)] hover:shadow-none hover:scale-105"
            >
              Start Building Now
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer: Clean & Typographic ─────────────────────────────── */}
      <footer className="bg-white pt-32 pb-16 px-6">
        <div className="max-w-[1400px] mx-auto border-t border-alabaster-grey pt-16">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
            
            <div className="max-w-xs">
              <div className="font-bold text-3xl tracking-tighter text-black mb-6">
                Gridworks.
              </div>
              <p className="text-prussian-blue-600 font-medium leading-relaxed">
                The premium schedule builder for modern students. Private, instant, beautifully crafted.
              </p>
            </div>

            <div className="flex gap-16 md:gap-32">
              <div>
                <h4 className="font-bold text-black mb-6 tracking-tight">Product</h4>
                <ul className="space-y-4 font-medium">
                  <li><Link href="/app" className="text-prussian-blue-600 hover:text-orange transition-colors">App</Link></li>
                  <li><Link href="#features" className="text-prussian-blue-600 hover:text-orange transition-colors">Features</Link></li>
                  <li><Link href="#themes" className="text-prussian-blue-600 hover:text-orange transition-colors">Themes</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-black mb-6 tracking-tight">Legal</h4>
                <ul className="space-y-4 font-medium">
                  <li><a href="#" className="text-prussian-blue-600 hover:text-orange transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-prussian-blue-600 hover:text-orange transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>

          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-prussian-blue-600">
            <p>
              © {new Date().getFullYear()} Gridworks. All rights reserved.
            </p>
            <p>
              Handcrafted in the browser.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
