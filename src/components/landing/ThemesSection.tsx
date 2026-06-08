import { THEME_PRESETS } from "@/lib/themes";
import { Palette, Paintbrush, Droplet, Sparkles, Brush } from "lucide-react";

function getContrastTextColor(hexColor: string) {
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "text-black" : "text-white";
}

export function ThemesSection() {
  const themes = Object.values(THEME_PRESETS);

  return (
    <section id="themes" className="relative py-32 md:py-48 px-6 bg-white border-t border-alabaster-grey overflow-hidden">
      
      {/* Floating Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <div className="absolute top-[10%] left-[10%] text-[#fca311] animate-drift-1"><Palette size={80} strokeWidth={1} /></div>
        <div className="absolute top-[30%] right-[10%] text-prussian-blue-300 animate-drift-2"><Paintbrush size={90} strokeWidth={1} /></div>
        <div className="absolute bottom-[20%] left-[20%] text-alabaster-grey-900 animate-drift-3"><Droplet size={100} strokeWidth={1} /></div>
        <div className="absolute bottom-[10%] right-[20%] text-[#fca311] animate-drift-1" style={{animationDelay: '-3s'}}><Sparkles size={70} strokeWidth={1.5} /></div>
        <div className="absolute top-[50%] left-[5%] text-prussian-blue-600 animate-drift-2" style={{animationDelay: '-6s'}}><Brush size={85} strokeWidth={1} /></div>
      </div>

      <div className="relative max-w-[1400px] mx-auto z-10">
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-black leading-[0.9]">
            Themes.
          </h2>
          <p className="text-xl text-prussian-blue-600 font-medium max-w-md">
            Carefully curated palettes. Start with a foundation, customize every variable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {themes.map((theme, idx) => (
            <div
              key={theme.id}
              className={`group cursor-pointer ${idx % 2 === 1 ? 'lg:mt-24' : ''}`}
            >
              <div className="h-24 w-full flex rounded-2xl overflow-hidden mb-6 shadow-md ring-1 ring-inset ring-black/10 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                {theme.previewColors.map((color, i) => (
                  <div
                    key={i}
                    className="group/color relative h-full flex-1 transition-all duration-500 hover:flex-[2] flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <span className={`opacity-0 group-hover/color:opacity-100 transition-opacity duration-300 font-semibold text-sm sm:text-base tracking-widest ${getContrastTextColor(color)}`}>
                      {color.replace('#', '').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-black mb-2 tracking-tight">
                {theme.name}
              </h3>
              <p className="text-base text-prussian-blue-600 leading-relaxed font-medium">
                {theme.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
