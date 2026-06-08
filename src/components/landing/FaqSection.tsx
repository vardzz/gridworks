import { ChevronDown } from "lucide-react";
import Link from "next/link";

export function FaqSection() {
  return (
    <section id="faq" className="py-32 md:py-48 px-6 bg-white">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-black mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg md:text-xl text-prussian-blue-600 font-medium">
            Everything you need to know to get started.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { q: "Is Gridworks completely free?", a: "Yes. Gridworks is entirely free to use. No subscriptions, no hidden fees, and no paywalls. Built by students, for students." },
            { q: "Does Gridworks store my class schedule?", a: "No. Our architecture is privacy-first by design. All parsing and rendering executes entirely within your local browser environment. We never see, transmit, or store your data." },
            { q: "What formats can I upload?", a: "You can drop PDF registration files downloaded from most standard university portals, or simply paste the raw text payload directly into the intake engine." },
          ].map((faq, i) => (
            <details key={i} className="group bg-white border border-alabaster-grey rounded-2xl overflow-hidden transition-all duration-300 hover:border-prussian-blue-300 shadow-sm hover:shadow-md [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 md:p-8 text-lg md:text-xl font-bold tracking-tight text-black outline-none cursor-pointer">
                {faq.q}
                <ChevronDown className="text-prussian-blue-600 transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" size={24} />
              </summary>
              <div className="px-6 md:px-8 pb-6 md:pb-8 text-base md:text-lg text-prussian-blue-600 font-medium leading-relaxed border-t border-transparent group-open:border-alabaster-grey/50 pt-2 md:pt-0">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
