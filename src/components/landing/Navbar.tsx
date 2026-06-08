import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-alabaster-grey transition-all">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="font-bold text-2xl tracking-tighter text-black">
          Gridworks.
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-prussian-blue-600">
            <Link href="#features" className="hover:text-[#fca311] transition-colors">Features</Link>
            <Link href="#themes" className="hover:text-[#fca311] transition-colors">Themes</Link>
            <Link href="#faq" className="hover:text-[#fca311] transition-colors">FAQ</Link>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Start Building
          </Link>
        </div>
      </div>
    </nav>
  );
}
