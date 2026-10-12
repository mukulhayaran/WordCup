import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center gap-4">
      <Link
        href="/play"
        aria-label="Back"
        className="h-14 w-14 shrink-0 rounded-full bg-accent-soft flex items-center justify-center text-ink"
      >
        <ChevronLeft className="h-7 w-7" strokeWidth={2.4} />
      </Link>
      <div>
        <h1 className="text-[32px] font-bold leading-none text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[16px] text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
