// src/app/page.tsx — Landing page (Phase 10)
import Link from "next/link";
import { ArrowRight, Upload, CheckCircle, Download } from "lucide-react";
import { THEME_PRESETS } from "@/lib/themes";

export default function LandingPage() {
  const themes = Object.values(THEME_PRESETS);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
        <div className="font-bold text-xl tracking-tight font-display">
          Gridworks
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
        >
          Try Gridworks <ArrowRight size={14} />
        </Link>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 md:pt-32 md:pb-24">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display max-w-4xl leading-[1.1] tracking-tight text-neutral-900">
            Drop your registration form.
            <br />
            <span className="text-neutral-400">Get a beautiful schedule.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-neutral-500 max-w-2xl leading-relaxed">
            Gridworks reads your university schedule PDF and renders it as a
            print-ready, styled grid — instantly, entirely in your browser. No
            sign-up. No server. Just results.
          </p>

          <Link
            href="/app"
            className="mt-10 inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Try Gridworks for free <ArrowRight size={18} />
          </Link>

          {/* Hero preview mockup */}
          <div className="mt-16 md:mt-20 w-full max-w-5xl">
            <div className="relative aspect-[16/9] bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden shadow-2xl">
              {/* Simplified schedule grid preview */}
              <div className="absolute inset-0 p-6 flex">
                {/* Time column */}
                <div className="w-12 flex flex-col justify-between py-8 text-[9px] text-neutral-400">
                  <span>7 AM</span>
                  <span>9 AM</span>
                  <span>11 AM</span>
                  <span>1 PM</span>
                  <span>3 PM</span>
                  <span>5 PM</span>
                </div>
                {/* Day columns */}
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, di) => (
                  <div key={day} className="flex-1 flex flex-col gap-1 px-0.5">
                    <div className="text-[10px] text-neutral-500 font-medium text-center py-1 bg-neutral-100 rounded-sm">
                      {day}
                    </div>
                    {/* Mock blocks */}
                    {[
                      { h: "20%", top: "15%", color: "#E3F2FD" },
                      { h: "15%", top: "45%", color: "#FCE4EC" },
                      { h: "18%", top: "70%", color: "#E8F5E9" },
                    ]
                      .filter((_, i) => (di + i) % 2 === 0)
                      .map((block, bi) => (
                        <div
                          key={bi}
                          className="rounded-md border border-neutral-200/50"
                          style={{
                            backgroundColor: block.color,
                            height: block.h,
                            marginTop: bi === 0 ? block.top : "4px",
                          }}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works Section ─────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-neutral-50 border-t border-neutral-100">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center font-display tracking-tight mb-16">
              Three steps. That&apos;s it.
            </h2>

            <div className="grid md:grid-cols-3 gap-10 md:gap-12">
              {[
                {
                  icon: <Upload size={24} />,
                  step: "01",
                  title: "Drop your registration form",
                  desc: "PDF or screenshot — Gridworks reads both. Our parser handles messy layouts and blurry scans.",
                },
                {
                  icon: <CheckCircle size={24} />,
                  step: "02",
                  title: "Review and confirm",
                  desc: "Your parsed entries appear in an editable table. Fix anything our parser missed, then confirm.",
                },
                {
                  icon: <Download size={24} />,
                  step: "03",
                  title: "Export your schedule",
                  desc: "Download as a print-ready PDF or an HD PNG wallpaper. Pick a theme. Make it yours.",
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-xs font-mono text-neutral-400 tracking-wider">
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Theme Preview Section ────────────────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center font-display tracking-tight mb-4">
              Four themes. Your style.
            </h2>
            <p className="text-center text-neutral-500 mb-16 max-w-2xl mx-auto">
              Pick a visual style that matches your aesthetic. Override colors
              and fonts to make it fully yours.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="rounded-xl border border-neutral-200 p-4 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  {/* Color swatch strip */}
                  <div className="flex gap-1 mb-3 h-16 rounded-lg overflow-hidden">
                    {theme.previewColors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="text-sm font-medium text-neutral-800">
                    {theme.name}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {theme.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="py-20 text-center border-t border-neutral-100 bg-neutral-50">
          <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-4">
            Ready to build your schedule?
          </h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">
            No sign-up required. Your data never leaves your browser.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-neutral-800 transition-all shadow-lg"
          >
            Get started <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-8 text-center text-sm text-neutral-400 border-t border-neutral-100">
        <p>
          Built with Next.js •{" "}
          <span className="font-medium text-neutral-500">Gridworks</span>{" "}
          © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
