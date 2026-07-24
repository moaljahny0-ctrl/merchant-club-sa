import { Shield, Award, Handshake, ShoppingBag } from 'lucide-react';
import type { Partner } from '@/lib/brands';
import { PartnerTiltPoster } from './PartnerTiltPoster';

const C = {
  cream:  '#F5F0E8',
  cream2: '#F0EBE1',
  ink:    '#1A1208',
  gold:   '#B8975A',
  text2:  '#4A4038',
} as const;

const BADGES_EN = [
  { icon: Shield,      label: 'Trusted\nPartners' },
  { icon: Award,       label: 'Premium\nQuality' },
  { icon: Handshake,   label: 'Reliable\nCollaboration' },
  { icon: ShoppingBag, label: 'Better Value\nfor You' },
];

const BADGES_AR = [
  { icon: Shield,      label: 'شركاء\nموثوقون' },
  { icon: Award,       label: 'جودة\nعالية' },
  { icon: Handshake,   label: 'تعاون\nموثوق' },
  { icon: ShoppingBag, label: 'قيمة أفضل\nلك' },
];

export function PartnersHero({ isAr, partners }: { isAr: boolean; partners: Partner[] }) {
  const badges = isAr ? BADGES_AR : BADGES_EN;

  return (
    <section
      className="relative overflow-hidden rounded-3xl grid grid-cols-1 md:grid-cols-[1fr_0.85fr]"
      style={{
        background: `radial-gradient(ellipse at 20% 0%, #fff8ea 0%, transparent 55%), linear-gradient(135deg, ${C.cream}, ${C.cream2})`,
        boxShadow: '0 40px 80px -30px rgba(28,20,12,0.25)',
        border: `1px solid ${C.cream2}`,
      }}
    >
      <div className="p-6 sm:p-8 md:p-10 relative z-10">
        <p
          className="text-[12px] font-bold uppercase mb-2.5"
          style={{ color: C.gold, letterSpacing: isAr ? 0 : '0.18em' }}
        >
          {isAr ? 'شركاؤنا' : 'Our Partners'}
        </p>
        <h1
          className={isAr ? 'font-bold' : 'font-display italic font-semibold'}
          style={{ fontSize: isAr ? '2.1rem' : '2.6rem', lineHeight: 1.05, color: C.ink, marginBottom: '14px' }}
        >
          {isAr ? 'معاً أقوى' : 'Stronger Together'}
        </h1>
        <p className="text-[14px] leading-relaxed max-w-[420px] mb-6" style={{ color: C.text2 }}>
          {isAr
            ? 'نتعاون مع علامات تجارية ومتاجر موثوقة لنقدّم لكم أفضل جودة وأفضل قيمة.'
            : 'We partner with trusted brands and stores to bring you the best quality and value.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-2 text-center p-1.5 rounded-2xl transition-colors duration-200"
              style={{ cursor: 'default' }}
            >
              <span
                className="flex items-center justify-center rounded-full transition-transform duration-700 group-hover:rotate-[360deg]"
                style={{ width: 44, height: 44, background: C.ink, border: `2px solid ${C.gold}`, color: C.gold }}
              >
                <badge.icon width={18} height={18} strokeWidth={1.6} />
              </span>
              <span className="text-[11px] font-semibold leading-tight whitespace-pre-line" style={{ color: C.text2 }}>
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative flex items-center justify-center py-6 md:py-0"
        style={{ background: 'radial-gradient(circle at 65% 40%, #fbf3e0 0%, #ecdfc4 55%, #ddcda3 100%)' }}
      >
        <PartnerTiltPoster partners={partners} isAr={isAr} />
      </div>
    </section>
  );
}
