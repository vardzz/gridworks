import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-white border-t border-alabaster-grey py-32 px-6">
      <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center">
        <h2 className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter text-black leading-[0.9] mb-12">
          Build your grid.
        </h2>
        <p className="text-xl md:text-2xl text-prussian-blue-600 mb-20 max-w-2xl font-medium">
          Experience the difference of a tool crafted specifically for design-conscious students.
        </p>
        <Link
          href="/app"
          className="bg-[#fca311] text-black px-12 py-6 rounded-full text-2xl font-bold transition-all shadow-[0_0_60px_rgba(252,163,17,0.4)] hover:-translate-y-1 hover:scale-105 active:scale-95"
        >
          Start Building Now
        </Link>
      </div>
    </section>
  );
}
