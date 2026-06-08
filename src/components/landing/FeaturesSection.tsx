import { UploadCloud, FileText, CheckCircle2, ChevronRight, Settings, Grid as GridIcon, Download, Zap, FileCheck, Rocket } from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="relative max-w-[1400px] mx-auto px-6 py-32 md:py-48">
      
      {/* Floating Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <div className="absolute top-[10%] left-[5%] text-prussian-blue-300 animate-drift-1"><Zap size={80} strokeWidth={1} /></div>
        <div className="absolute top-[40%] right-[5%] text-[#fca311] animate-drift-2"><Settings size={100} strokeWidth={1} /></div>
        <div className="absolute bottom-[20%] left-[10%] text-alabaster-grey-900 animate-drift-3"><GridIcon size={120} strokeWidth={1} /></div>
        <div className="absolute bottom-[10%] right-[15%] text-prussian-blue-300 animate-drift-1" style={{animationDelay: '-2s'}}><FileCheck size={70} strokeWidth={1.5} /></div>
        <div className="absolute top-[60%] left-[15%] text-alabaster-grey-900 animate-drift-2" style={{animationDelay: '-5s'}}><Rocket size={90} strokeWidth={1} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24 relative items-start z-10">
        
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
          
          {/* Feature 1: Intake */}
          <div className="group">
            <div className="text-sm font-bold text-[#fca311] tracking-widest uppercase mb-4">01 — Intake</div>
            <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Drop your raw data.</h3>
            <div className="aspect-[4/3] bg-alabaster-grey-900 border border-alabaster-grey p-8 md:p-16 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02] overflow-hidden rounded-3xl">
              
              <div className="w-full max-w-md bg-white border border-alabaster-grey shadow-2xl rounded-2xl p-2 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#fca311] to-prussian-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Drag and Drop Zone */}
                <div className="border-2 border-dashed border-alabaster-grey-900 rounded-xl bg-alabaster-grey/20 flex flex-col items-center justify-center p-12 relative group-hover:border-prussian-blue-300 transition-colors duration-500 overflow-hidden">
                  
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-500 relative z-10">
                    <UploadCloud className="text-prussian-blue-600 group-hover:text-[#fca311] transition-colors" size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-black mb-2">Upload Schedule PDF</h4>
                  <p className="text-sm text-prussian-blue-600 font-medium text-center max-w-[200px]">Drag and drop your university schedule here</p>
                  
                  {/* Floating Document Mock 1 */}
                  <div className="absolute top-6 left-6 w-12 h-16 bg-white shadow-lg rounded border border-alabaster-grey flex flex-col items-center justify-center -rotate-12 opacity-0 group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-700 delay-100 z-0">
                    <FileText className="text-[#fca311]" size={20} />
                  </div>
                  {/* Floating Document Mock 2 */}
                  <div className="absolute bottom-6 right-8 w-10 h-14 bg-white shadow-lg rounded border border-alabaster-grey flex flex-col items-center justify-center rotate-12 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-700 delay-200 z-0">
                    <FileText className="text-prussian-blue-300" size={16} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Feature 2: Review */}
          <div className="group">
            <div className="text-sm font-bold text-[#fca311] tracking-widest uppercase mb-4">02 — Review</div>
            <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Edit with precision.</h3>
            <div className="aspect-[4/3] bg-prussian-blue border border-prussian-blue-600 p-8 md:p-12 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02] rounded-3xl overflow-hidden relative">
              
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:2rem_2rem]" />

              <div className="w-full h-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-alabaster-grey translate-y-4 group-hover:translate-y-0 transition-transform duration-700 relative z-10">
                <div className="h-16 border-b border-alabaster-grey flex items-center justify-between px-6 bg-alabaster-grey/30">
                  <div className="text-base font-bold text-black flex items-center gap-2">
                    <CheckCircle2 className="text-[#fca311]" size={20} />
                    14 Items Parsed
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-full bg-white border border-alabaster-grey flex items-center justify-center shadow-sm hover:bg-alabaster-grey-900 transition-colors">
                      <Settings size={14} className="text-prussian-blue-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-6 flex flex-col gap-3 flex-1 overflow-hidden">
                  {[
                    { color: "bg-[#fca311]", title: "Advanced Design Studio", time: "1:00 PM - 3:00 PM", room: "Studio A" },
                    { color: "bg-prussian-blue", title: "Computer Science 101", time: "9:00 AM - 10:30 AM", room: "Lecture Hall 3" },
                    { color: "bg-prussian-blue-300", title: "Physics II: Electromagnetism", time: "3:30 PM - 5:00 PM", room: "Laboratory 4" }
                  ].map((item, i) => (
                    <div key={i} className="group/item flex items-center p-3 sm:p-4 rounded-xl border border-transparent hover:border-alabaster-grey hover:bg-alabaster-grey/30 hover:shadow-sm transition-all cursor-pointer">
                      <div className={`w-3 h-3 rounded-full ${item.color} mr-4 shadow-sm`} />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-black truncate">{item.title}</div>
                        <div className="text-xs font-medium text-prussian-blue-600 mt-1">{item.time} • {item.room}</div>
                      </div>
                      <ChevronRight size={16} className="text-prussian-blue-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Feature 3: Export */}
          <div className="group">
            <div className="text-sm font-bold text-[#fca311] tracking-widest uppercase mb-4">03 — Export</div>
            <h3 className="text-4xl font-bold tracking-tight text-black mb-8">Print-ready aesthetics.</h3>
            <div className="aspect-[4/3] bg-alabaster-grey-900 border border-alabaster-grey p-8 md:p-12 flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02] rounded-3xl">
              
              <div className="w-full h-full bg-[#f8f9fa] border border-alabaster-grey shadow-2xl rounded-2xl flex flex-col overflow-hidden relative transition-transform duration-700 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                {/* Toolbar */}
                <div className="h-12 bg-white border-b border-alabaster-grey flex items-center px-4 justify-between shrink-0">
                   <div className="flex items-center gap-2">
                     <GridIcon size={16} className="text-black" />
                     <span className="text-xs font-bold text-black uppercase tracking-wider">Preview Canvas</span>
                   </div>
                   <button className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#fca311] hover:text-black transition-colors">
                     <Download size={12} />
                     Export
                   </button>
                </div>
                
                {/* Grid Canvas */}
                <div className="flex-1 p-4 sm:p-6 flex bg-white/50">
                  {/* Time Column */}
                  <div className="w-10 sm:w-12 flex flex-col justify-between py-6 text-[9px] sm:text-[10px] font-bold text-prussian-blue-300 text-right pr-3 shrink-0">
                    <span>9 AM</span>
                    <span>12 PM</span>
                    <span>3 PM</span>
                    <span>6 PM</span>
                  </div>
                  
                  {/* Grid Area */}
                  <div className="flex-1 border-l border-t border-alabaster-grey flex relative bg-white shadow-sm rounded-br-lg">
                    {/* Columns */}
                    <div className="flex-1 border-r border-alabaster-grey/50 relative group/col">
                       <div className="absolute top-0 inset-x-0 h-full bg-alabaster-grey-900/0 group-hover/col:bg-alabaster-grey-900/50 transition-colors" />
                       <div className="absolute top-[15%] left-1.5 right-1.5 sm:left-2 sm:right-2 h-20 bg-prussian-blue rounded-md sm:rounded-lg p-2 shadow-md border border-prussian-blue-600 transform transition-transform group-hover:-translate-y-1 hover:scale-105 cursor-pointer z-10">
                          <div className="w-1/2 h-1.5 bg-white/40 rounded-full mb-1.5" />
                          <div className="w-3/4 h-1 bg-white/20 rounded-full" />
                       </div>
                    </div>
                    <div className="flex-1 border-r border-alabaster-grey/50 relative group/col">
                       <div className="absolute top-0 inset-x-0 h-full bg-alabaster-grey-900/0 group-hover/col:bg-alabaster-grey-900/50 transition-colors" />
                       <div className="absolute top-[45%] left-1.5 right-1.5 sm:left-2 sm:right-2 h-24 bg-[#fca311] rounded-md sm:rounded-lg p-2 shadow-md transform transition-transform group-hover:-translate-y-1 delay-75 hover:scale-105 cursor-pointer z-10">
                          <div className="w-1/2 h-1.5 bg-black/40 rounded-full mb-1.5" />
                          <div className="w-3/4 h-1 bg-black/20 rounded-full" />
                       </div>
                    </div>
                    <div className="flex-1 border-r border-alabaster-grey/50 relative group/col">
                       <div className="absolute top-0 inset-x-0 h-full bg-alabaster-grey-900/0 group-hover/col:bg-alabaster-grey-900/50 transition-colors" />
                       <div className="absolute top-[25%] left-1.5 right-1.5 sm:left-2 sm:right-2 h-16 bg-prussian-blue-300 rounded-md sm:rounded-lg p-2 shadow-md transform transition-transform group-hover:-translate-y-1 delay-150 hover:scale-105 cursor-pointer z-10">
                          <div className="w-1/2 h-1.5 bg-white/60 rounded-full mb-1.5" />
                          <div className="w-3/4 h-1 bg-white/40 rounded-full" />
                       </div>
                    </div>
                    
                    {/* Horizontal Lines (Background) */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-0">
                      <div className="border-b border-alabaster-grey/30 w-full h-1/4" />
                      <div className="border-b border-alabaster-grey/30 w-full h-1/4" />
                      <div className="border-b border-alabaster-grey/30 w-full h-1/4" />
                      <div className="border-b border-alabaster-grey/30 w-full h-1/4" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
