import Link from "next/link";
import { 
  ArrowRight, 
  UploadCloud, 
  Zap, 
  Shield, 
  Palette, 
  Layout, 
  Lock, 
  CheckCircle2, 
  Download, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { THEME_PRESETS } from "@/lib/themes";

export default function LandingPage() {
  const themes = Object.values(THEME_PRESETS);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      
      {/* ── Premium Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-neutral-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Layout size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight font-display">
              Gridworks
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
            <Link href="#features" className="hover:text-neutral-900 transition-colors">Features</Link>
            <Link href="#themes" className="hover:text-neutral-900 transition-colors">Themes</Link>
            <Link href="#faq" className="hover:text-neutral-900 transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="hidden md:inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-neutral-800 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
            >
              Start Building <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        
        {/* ── Hero Section ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-32 px-6">
          {/* Background glow effects */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-100 to-purple-50 rounded-full blur-[100px] opacity-60 -z-10" />
          
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-semibold text-neutral-600 mb-8 shadow-sm">
              <Sparkles size={14} className="text-amber-500" />
              <span>Gridworks 2.0 is now live</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold font-display tracking-tight text-neutral-900 leading-[1.05] max-w-4xl">
              Transform your schedule into a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500">
                masterpiece.
              </span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed">
              Gridworks instantly reads your university registration PDF and renders it as a print-ready, beautifully styled grid. 
              <br className="hidden md:block" /> No sign-up. No servers. 100% private.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                href="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-neutral-800 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
              >
                Try Gridworks for free
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-neutral-900 border border-neutral-200 px-8 py-4 rounded-full text-base font-medium hover:bg-neutral-50 transition-all"
              >
                See how it works
              </Link>
            </div>

            {/* Premium UI Mockup */}
            <div className="mt-20 w-full max-w-5xl perspective-[2000px]">
              <div className="relative aspect-[16/10] md:aspect-[21/9] bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-neutral-200/50 transform-gpu rotate-x-[2deg] hover:rotate-x-0 transition-transform duration-700 ease-out">
                {/* macOS style header */}
                <div className="h-12 bg-white/60 border-b border-neutral-200/50 flex items-center px-4 gap-2 backdrop-blur-md">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="ml-4 h-6 w-48 bg-white rounded-md border border-neutral-200/50 flex items-center px-2">
                    <Lock size={10} className="text-neutral-400 mr-2" />
                    <span className="text-[10px] text-neutral-400 font-medium">gridworks.app</span>
                  </div>
                </div>
                
                {/* Inner app mockup */}
                <div className="absolute inset-0 top-12 p-6 flex bg-neutral-50/50">
                  <div className="w-12 flex flex-col justify-between py-8 text-[10px] font-medium text-neutral-400">
                    <span>8 AM</span><span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span>
                  </div>
                  <div className="flex-1 grid grid-cols-5 gap-2 h-full">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, di) => (
                      <div key={day} className="flex flex-col gap-2 relative">
                        <div className="text-xs text-neutral-500 font-semibold text-center pb-2 border-b border-neutral-200/50">
                          {day}
                        </div>
                        {/* Mock Blocks */}
                        {[
                          { top: "10%", h: "20%", bg: "bg-blue-100", border: "border-blue-200", text: "text-blue-700", label: "CS 101" },
                          { top: "40%", h: "15%", bg: "bg-purple-100", border: "border-purple-200", text: "text-purple-700", label: "MATH 202" },
                          { top: "65%", h: "25%", bg: "bg-emerald-100", border: "border-emerald-200", text: "text-emerald-700", label: "ENG 105" },
                        ].filter((_, i) => (di + i) % 2 === 0).map((block, bi) => (
                          <div
                            key={bi}
                            className={`absolute w-full rounded-lg border p-3 shadow-sm ${block.bg} ${block.border} transition-all hover:scale-[1.02] cursor-pointer`}
                            style={{ top: block.top, height: block.h }}
                          >
                            <div className={`text-xs font-bold ${block.text}`}>{block.label}</div>
                            <div className={`text-[10px] ${block.text} opacity-80 mt-1`}>Lecture Hall A</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* ── Logos / Social Proof ──────────────────────────────────── */}
        <section className="py-10 border-y border-neutral-200/50 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
            <p className="text-sm font-medium text-neutral-400 mb-6 uppercase tracking-widest">
              Trusted by students worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale">
              {/* Abstract logo shapes representing universities */}
              <div className="flex items-center gap-2 font-display font-bold text-xl"><div className="w-6 h-6 rounded-sm bg-neutral-900" /> University</div>
              <div className="flex items-center gap-2 font-display font-bold text-xl"><div className="w-6 h-6 rounded-full bg-neutral-900" /> College</div>
              <div className="flex items-center gap-2 font-display font-bold text-xl"><div className="w-6 h-6 rotate-45 bg-neutral-900" /> Institute</div>
              <div className="hidden md:flex items-center gap-2 font-display font-bold text-xl"><div className="w-6 h-6 rounded-tl-lg rounded-br-lg bg-neutral-900" /> Academy</div>
            </div>
          </div>
        </section>

        {/* ── Benefits Section ──────────────────────────────────────── */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-neutral-900 mb-4">
                Why choose Gridworks?
              </h2>
              <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
                We replaced clunky spreadsheets and manual data entry with intelligent parsing and premium design.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="text-amber-500" size={24} />,
                  title: "Lightning Fast Parsing",
                  desc: "Drop your registration PDF and watch as Gridworks instantly extracts your classes, times, and locations."
                },
                {
                  icon: <Shield className="text-emerald-500" size={24} />,
                  title: "Privacy First Architecture",
                  desc: "Everything runs securely in your browser. We never upload, store, or see your personal schedule data."
                },
                {
                  icon: <Palette className="text-purple-500" size={24} />,
                  title: "Print-Ready Aesthetics",
                  desc: "Export beautiful, high-resolution PNGs or vector PDFs that look incredible on your lock screen or printed out."
                }
              ].map((benefit, i) => (
                <div key={i} className="p-8 rounded-3xl bg-neutral-50 border border-neutral-100 hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center mb-6">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{benefit.title}</h3>
                  <p className="text-neutral-500 leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Bento Box ────────────────────────────────────── */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-neutral-900 mb-4">
                Three steps to perfection.
              </h2>
              <p className="text-neutral-500 text-lg max-w-2xl">
                No complex forms or tedious manual entry. Our workflow is designed to get you from raw data to a beautiful schedule in seconds.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Bento Card 1 */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-8 md:p-12 border border-neutral-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10 max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                    <UploadCloud size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">1. Upload your registration form</h3>
                  <p className="text-neutral-500 leading-relaxed">
                    Simply drag and drop your university PDF or paste text. Our advanced regex engine handles messy layouts, blurry scans, and inconsistent formatting with ease.
                  </p>
                </div>
                {/* Decorative graphic */}
                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-80 h-80 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700" />
              </div>

              {/* Bento Card 2 */}
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-neutral-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">2. Review & Edit</h3>
                  <p className="text-neutral-500 leading-relaxed">
                    Your parsed classes appear in an elegant, editable table. Quickly adjust colors, fix typos, or add custom events manually before rendering.
                  </p>
                </div>
              </div>

              {/* Bento Card 3 */}
              <div className="lg:col-span-3 bg-neutral-900 rounded-3xl p-8 md:p-12 border border-neutral-800 shadow-xl relative overflow-hidden group text-white flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="relative z-10 max-w-xl">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center mb-6 border border-white/20">
                    <Download size={24} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">3. Export your masterpiece</h3>
                  <p className="text-neutral-400 leading-relaxed">
                    Download your schedule as a crisp, high-resolution PNG for your lock screen, or a vector PDF for pristine printing. Your schedule has never looked this good.
                  </p>
                  <Link href="/app" className="inline-flex items-center gap-2 mt-8 text-sm font-semibold hover:text-neutral-300 transition-colors">
                    Try it now <ChevronRight size={16} />
                  </Link>
                </div>
                
                {/* Mini mock export UI */}
                <div className="w-full md:w-auto flex-1 max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 opacity-80" />
                    <div className="flex-1 h-20 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 opacity-80" />
                    <div className="flex-1 h-20 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-80" />
                  </div>
                  <div className="h-10 w-full bg-white text-neutral-900 rounded-lg flex items-center justify-center font-bold text-sm">
                    Download HD PNG
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Themes Showcase ───────────────────────────────────────── */}
        <section id="themes" className="py-24 px-6 bg-white border-y border-neutral-200/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-neutral-900 mb-4">
                Tailored to your aesthetic.
              </h2>
              <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
                Start with a carefully curated premium theme, then customize every detail to match your exact style.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="group rounded-2xl border border-neutral-200 bg-neutral-50 p-6 hover:shadow-xl hover:border-neutral-300 transition-all duration-300 cursor-pointer"
                >
                  {/* Color swatch strip */}
                  <div className="flex gap-1.5 mb-6 h-20 rounded-xl overflow-hidden shadow-sm">
                    {theme.previewColors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {theme.name}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ───────────────────────────────────────────── */}
        <section id="faq" className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-neutral-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { q: "Is Gridworks completely free?", a: "Yes. Gridworks is entirely free to use. No subscriptions, no hidden fees, and no paywalls." },
                { q: "Does Gridworks store my class schedule?", a: "No. Gridworks is designed with a privacy-first architecture. All parsing and rendering happens locally in your browser. We never see or store your data." },
                { q: "What formats can I upload?", a: "You can upload PDF registration files from most university portals, or simply paste the raw text from your portal into the app." },
                { q: "Can I use it on my phone?", a: "While you can view the landing page on mobile, the core app is optimized for desktop and tablet screens to give you the best editing and exporting experience." },
              ].map((faq, i) => (
                <details key={i} className="group bg-white border border-neutral-200 rounded-2xl p-6 open:shadow-md transition-all duration-300 cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between font-semibold text-lg text-neutral-900 outline-none">
                    {faq.q}
                    <ChevronRight size={20} className="text-neutral-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-4 text-neutral-500 leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-neutral-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Dark background subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-white/10 to-transparent opacity-20 pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-white mb-6">
                Ready to elevate your schedule?
              </h2>
              <p className="text-neutral-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join thousands of students turning plain text into beautiful, organized, print-ready schedules in seconds. No account required.
              </p>
              
              <Link
                href="/app"
                className="inline-flex items-center gap-2 bg-white text-neutral-900 px-10 py-5 rounded-full text-lg font-bold hover:bg-neutral-100 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Get Started Now <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Premium Footer ──────────────────────────────────────────── */}
      <footer className="bg-white border-t border-neutral-200/50 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <Layout size={16} className="text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight font-display text-neutral-900">
                  Gridworks
                </span>
              </div>
              <p className="text-neutral-500 max-w-sm leading-relaxed mb-6">
                The premium schedule builder for modern students. Private, instant, and beautifully designed.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/app" className="text-neutral-500 hover:text-neutral-900 transition-colors">App</Link></li>
                <li><Link href="#features" className="text-neutral-500 hover:text-neutral-900 transition-colors">Features</Link></li>
                <li><Link href="#themes" className="text-neutral-500 hover:text-neutral-900 transition-colors">Themes</Link></li>
                <li><Link href="#faq" className="text-neutral-500 hover:text-neutral-900 transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>

          </div>
          
          <div className="pt-8 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-400">
              © {new Date().getFullYear()} Gridworks. All rights reserved.
            </p>
            <p className="text-sm text-neutral-400 flex items-center gap-1">
              Built with <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mx-1" /> Next.js & Tailwind
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
