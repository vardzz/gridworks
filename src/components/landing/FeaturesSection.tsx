export function FeaturesSection() {
  return (
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
            <div className="text-sm font-bold text-[#fca311] tracking-widest uppercase mb-4">01 — Intake</div>
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
            <div className="text-sm font-bold text-[#fca311] tracking-widest uppercase mb-4">02 — Review</div>
            <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Edit with precision.</h3>
            <div className="aspect-[4/3] bg-prussian-blue border border-prussian-blue-600 p-8 md:p-16 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]">
              <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-12 border-b border-alabaster-grey flex items-center px-6">
                  <div className="text-sm font-bold text-black">Schedule Data</div>
                </div>
                <div className="p-6 flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 border border-alabaster-grey rounded-lg flex items-center px-4 gap-4">
                      <div className={`w-4 h-4 rounded-full ${i === 1 ? 'bg-[#fca311]' : 'bg-prussian-blue'}`} />
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
            <div className="text-sm font-bold text-[#fca311] tracking-widest uppercase mb-4">03 — Export</div>
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
  );
}
