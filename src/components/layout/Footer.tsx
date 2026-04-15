import { Link } from '@/i18n/navigation';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <span className="font-display text-gold tracking-[0.25em] uppercase">
          Merchant Club SA
        </span>
        <div className="flex items-center gap-8 text-muted">
          <Link href="/about" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
            About
          </Link>
          <Link href="/brands" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
            Partners
          </Link>
          <Link href="/members" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
            Members
          </Link>
          <Link href="/apply" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
            Apply
          </Link>
          <a
            href="mailto:info@merchantclubsa.com"
            className="hover:text-parchment transition-colors"
          >
            info@merchantclubsa.com
          </a>
          <Link href="/privacy" className="hover:text-parchment transition-colors tracking-[0.15em] uppercase">
            Privacy
          </Link>
        </div>
        <p className="text-muted">
          © {new Date().getFullYear()} Merchant Club SA
        </p>
      </div>
    </footer>
  );
}
