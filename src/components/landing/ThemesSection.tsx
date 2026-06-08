import { THEME_PRESETS } from "@/lib/themes";

export function ThemesSection() {
  const themes = Object.values(THEME_PRESETS);

  return (
    <section id="themes" className="py-32 md:py-48 px-6 bg-white border-t border-alabaster-grey">
      <div className="max-w-[1400px] mx-auto">
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
              <div className="aspect-[4/5] bg-alabaster-grey-900 border border-alabaster-grey mb-6 relative overflow-hidden transition-all duration-500 group-hover:border-black">
                <div className="absolute inset-x-0 bottom-0 h-1/2 flex flex-col justify-end p-6 gap-2">
                  {theme.previewColors.map((color, i) => (
                    <div
                      key={i}
                      className="h-8 w-full transition-transform duration-700 group-hover:translate-x-2"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
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
