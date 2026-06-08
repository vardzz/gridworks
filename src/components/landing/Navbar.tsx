"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hide navbar when within 600px of the bottom (where the massive footer is)
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 600;
      setIsHidden(isAtBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-alabaster-grey transition-transform duration-500 ease-in-out ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-black">
          <img src="/gridworks-logo.png" alt="Gridworks Logo" className="h-8 w-8 object-contain" />
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
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#fca311] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Start Building
          </Link>
        </div>
      </div>
    </nav>
  );
}
