import Image from 'next/image';
import type { Member } from '@/lib/members';

type Props = {
  member: Member;
  locale: string;
};

export function MemberCard({ member, locale }: Props) {
  const isAr = locale === 'ar';
  const name = isAr ? member.nameAr : member.name;
  const type = isAr ? member.typeAr : member.type;
  const hasImage = !!member.imageUrl;
  const hasName  = !!name;

  const card = (
    <div className="group flex flex-col">

      {/* Image area — 3:4 portrait */}
      <div className="relative aspect-[3/4] bg-surface border border-border overflow-hidden">
        {hasImage ? (
          <Image
            src={member.imageUrl!}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
            <div className="h-px w-5 bg-gold" />
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted">
              {isAr ? 'يُختار قريباً' : 'Coming soon'}
            </p>
          </div>
        )}
      </div>

      {/* Member info */}
      {(hasName || type) && (
        <div className="pt-3 space-y-0.5">
          {hasName && (
            <p className="text-xs text-parchment font-medium tracking-wide leading-snug">
              {name}
            </p>
          )}
          {type && (
            <p className="text-[10px] text-muted tracking-[0.15em] uppercase">
              {type}
            </p>
          )}
        </div>
      )}

    </div>
  );

  if (member.profileUrl) {
    return (
      <a href={member.profileUrl} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );
  }

  return card;
}
