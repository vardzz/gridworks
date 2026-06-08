import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white pt-32 pb-16 px-6">
      <div className="max-w-[1400px] mx-auto border-t border-alabaster-grey pt-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
          
          <div className="max-w-xs">
            <div className="font-bold text-3xl tracking-tighter text-black mb-6">
              Gridworks.
            </div>
            <p className="text-prussian-blue-600 font-medium leading-relaxed">
              The premium schedule builder for modern students. Private, instant, beautifully crafted.
            </p>
          </div>

          <div className="flex gap-16 md:gap-32">
            <div>
              <h4 className="font-bold text-black mb-6 tracking-tight">Product</h4>
              <ul className="space-y-4 font-medium">
                <li><Link href="/app" className="text-prussian-blue-600 hover:text-[#fca311] transition-colors">App</Link></li>
                <li><Link href="#features" className="text-prussian-blue-600 hover:text-[#fca311] transition-colors">Features</Link></li>
                <li><Link href="#themes" className="text-prussian-blue-600 hover:text-[#fca311] transition-colors">Themes</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-black mb-6 tracking-tight">Legal</h4>
              <ul className="space-y-4 font-medium">
                <li><a href="#" className="text-prussian-blue-600 hover:text-[#fca311] transition-colors">Privacy</a></li>
                <li><a href="#" className="text-prussian-blue-600 hover:text-[#fca311] transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-prussian-blue-600">
          <p>
            © {new Date().getFullYear()} Gridworks. All rights reserved.
          </p>
          <p>
            Handcrafted in the browser.
          </p>
        </div>
      </div>
    </footer>
  );
}
