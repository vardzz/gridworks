"use client";

import { useEffect, useRef, useState } from "react";
import { Table, Clock, Swords, Diamond, Calendar } from "lucide-react";

export function ProblemSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  
  const fullText1 = "Stop fighting with spreadsheets.";
  const fullText2 = "Your time is too valuable.";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let currentIndex1 = 0;
    let currentIndex2 = 0;
    
    const typeText = () => {
      if (currentIndex1 < fullText1.length) {
        setText1(fullText1.slice(0, currentIndex1 + 1));
        currentIndex1++;
        setTimeout(typeText, 35);
      } else if (currentIndex2 < fullText2.length) {
        setText2(fullText2.slice(0, currentIndex2 + 1));
        currentIndex2++;
        setTimeout(typeText, 35);
      }
    };
    
    setTimeout(typeText, 300); // Small delay before starting
  }, [isVisible]);

  return (
    <section 
      ref={sectionRef} 
      className="relative py-48 px-6 bg-alabaster-grey-900 border-y border-alabaster-grey overflow-hidden"
    >
      {/* Floating Icons Background */}
      <div className="absolute inset-0 pointer-events-none opacity-10 md:opacity-20">
        <div className="absolute top-[20%] left-[10%] animate-drift-1 text-prussian-blue-600">
          <Table size={64} />
        </div>
        <div className="absolute bottom-[20%] right-[15%] animate-drift-2 text-prussian-blue-600">
          <Clock size={56} />
        </div>
        <div className="absolute top-[30%] right-[25%] animate-drift-3 text-[#fca311]">
          <Swords size={72} />
        </div>
        <div className="absolute bottom-[30%] left-[20%] animate-drift-1 text-[#fca311]" style={{ animationDelay: '-5s' }}>
          <Diamond size={48} />
        </div>
        <div className="absolute top-[15%] right-[10%] animate-drift-2 text-prussian-blue-600" style={{ animationDelay: '-10s' }}>
          <Calendar size={60} />
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto text-center relative z-10 min-h-[160px] flex flex-col items-center justify-center">
        <h2 className="text-[28px] sm:text-4xl md:text-6xl font-bold tracking-tighter text-black leading-tight flex flex-col items-center max-sm:w-full">
          <span className="relative max-sm:w-full">
            <span className="opacity-0 block max-sm:whitespace-normal">{fullText1}</span>
            <span className="absolute top-0 left-0 w-full text-center sm:text-left whitespace-nowrap max-sm:whitespace-normal">
              {text1}
              {isVisible && text1.length < fullText1.length && (
                <span className="inline-block w-[3px] sm:w-[4px] h-[30px] sm:h-[40px] md:h-[60px] bg-[#fca311] ml-1 animate-pulse align-middle -mt-1 md:-mt-4"></span>
              )}
            </span>
          </span>
          <span className="relative text-prussian-blue-600 mt-2 max-sm:w-full">
            <span className="opacity-0 block max-sm:whitespace-normal">{fullText2}</span>
            <span className="absolute top-0 left-0 w-full text-center sm:text-left whitespace-nowrap max-sm:whitespace-normal text-prussian-blue-600">
              {text2}
              {isVisible && text1.length === fullText1.length && text2.length < fullText2.length && (
                <span className="inline-block w-[3px] sm:w-[4px] h-[30px] sm:h-[40px] md:h-[60px] bg-[#fca311] ml-1 animate-pulse align-middle -mt-1 md:-mt-4"></span>
              )}
            </span>
          </span>
        </h2>
      </div>
    </section>
  );
}
