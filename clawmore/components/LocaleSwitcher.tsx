'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LocaleSwitcher() {
  const handleLocaleChange = (newLocale: string) => {
    // Set cookie and reload to apply locale change
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    window.location.reload();
  };

  // Function to get cookie value client-side
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return 'en';
  };

  const currentLocale = getCookie('NEXT_LOCALE') || 'en';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-mono">
      <Globe className="w-3.5 h-3.5 text-cyber-blue" />
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="bg-transparent text-[10px] uppercase tracking-widest text-white/70 outline-none cursor-pointer focus:text-white"
      >
        <option value="en" className="bg-[#0a0a0a]">
          EN
        </option>
        <option value="zh" className="bg-[#0a0a0a]">
          ZH
        </option>
      </select>
    </div>
  );
}
