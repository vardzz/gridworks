export function FaqSection() {
  return (
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
              <summary className="flex items-center justify-between text-2xl md:text-3xl font-bold tracking-tight text-black outline-none hover:text-[#fca311] transition-colors">
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
  );
}
