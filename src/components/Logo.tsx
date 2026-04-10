import { Link } from '@/i18n/navigation';

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-baseline font-serif text-2xl tracking-tight"
      aria-label="TrendPulse home"
    >
      <span className="font-medium">trendpul</span>
      <span className="rounded-sm bg-pink-300 px-1 text-foreground transition-colors group-hover:bg-pink-400">
        .se
      </span>
    </Link>
  );
}
