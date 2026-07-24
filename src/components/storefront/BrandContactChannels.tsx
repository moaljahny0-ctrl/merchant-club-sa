'use client';

import { Camera, Music2, AtSign, Globe, Mail } from 'lucide-react';

type Props = {
  instagram?: string;
  tiktok?: string;
  x?: string;
  website?: string;
  email?: string;
  accentHex: string;
  isAr: boolean;
};

/**
 * Real, clickable contact/social channels for a brand's own store page —
 * only renders channels the brand actually provided, no placeholders.
 */
export function BrandContactChannels({ instagram, tiktok, x, website, email, accentHex, isAr }: Props) {
  const channels = [
    instagram && { href: instagram, icon: Camera, label: 'Instagram' },
    tiktok && { href: tiktok, icon: Music2, label: 'TikTok' },
    x && { href: x, icon: AtSign, label: 'X' },
    website && { href: website, icon: Globe, label: isAr ? 'الموقع' : 'Website' },
    email && { href: `mailto:${email}`, icon: Mail, label: isAr ? 'راسلنا' : 'Email' },
  ].filter((c): c is { href: string; icon: typeof Camera; label: string } => Boolean(c));

  if (channels.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {channels.map(channel => (
        <a
          key={channel.label}
          href={channel.href}
          target={channel.href.startsWith('mailto:') ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="brand-contact-chip group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium tracking-[0.05em] transition-all duration-200"
          style={{ border: `1px solid ${accentHex}55`, color: accentHex }}
        >
          <channel.icon
            width={13}
            height={13}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          {channel.label}
        </a>
      ))}
      <style>{`
        .brand-contact-chip:hover {
          background: ${accentHex}14;
        }
      `}</style>
    </div>
  );
}
