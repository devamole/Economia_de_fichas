"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const { replace } = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    replace(pathname, { locale: next });
  }

  if (routing.locales.length <= 1) return null;

  return (
    <select
      value={locale}
      onChange={(e) => switchLocale(e.target.value)}
      className="rounded border px-2 py-1 text-sm"
      aria-label="Idioma"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
