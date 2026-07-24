'use client';

import { useRef } from 'react';
import type { Partner } from '@/lib/brands';
import { PartnerShowcaseRing } from './PartnerShowcaseRing';

const GOLD = '#D4AF37';
const PANEL_BG = '#0F0B06';
const POSTER_BG = '#F5F0E8';

const MAX_TILT = 14;

type Props = {
  partners: Partner[];
  isAr: boolean;
  size?: 'md' | 'lg';
};

export function PartnerTiltPoster({ partners, isAr, size = 'md' }: Props) {
  const posterRef = useRef<HTMLDivElement>(null);
  const maxWidth = size === 'lg' ? 300 : 240;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = posterRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateY = (x - 0.5) * MAX_TILT * 2;
    const rotateX = (0.5 - y) * MAX_TILT * 2;

    el.classList.remove('poster-settled');
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  }

  function handleLeave() {
    const el = posterRef.current;
    if (!el) return;
    el.classList.add('poster-settled');
    el.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
  }

  function handleTouchStart() {
    const el = posterRef.current;
    if (!el) return;
    el.classList.remove('poster-settled');
    el.style.transform = 'rotateX(4deg) rotateY(-6deg) scale(1.02)';
    setTimeout(handleLeave, 500);
  }

  return (
    <div style={{ perspective: 1200 }}>
      <div
        ref={posterRef}
        className="partner-poster poster-settled relative cursor-pointer"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onTouchStart={handleTouchStart}
        style={{
          width: `min(72vw, ${maxWidth}px)`,
          aspectRatio: '1 / 1',
          background: POSTER_BG,
          borderRadius: 6,
          padding: 16,
          boxShadow: '0 30px 60px -20px rgba(20,15,5,0.45), 0 10px 20px -10px rgba(20,15,5,0.3)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            background: `linear-gradient(135deg, #F0D888 0%, ${GOLD} 40%, #A6801F 70%, #E0C158 100%)`,
            borderRadius: 3,
            padding: 12,
            transform: 'translateZ(20px)',
          }}
        >
          <div
            className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
            style={{ background: PANEL_BG, borderRadius: 2 }}
          >
            <div className="partner-spotlight absolute inset-0 pointer-events-none" style={{ zIndex: 2 }} />
            <div className="partner-shine absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />
            <span className="partner-corner" style={{ top: 8, left: 8, borderInlineEnd: 'none', borderBottom: 'none' }} />
            <span className="partner-corner" style={{ top: 8, right: 8, borderInlineStart: 'none', borderBottom: 'none' }} />
            <span className="partner-corner" style={{ bottom: 8, left: 8, borderInlineEnd: 'none', borderTop: 'none' }} />
            <span className="partner-corner" style={{ bottom: 8, right: 8, borderInlineStart: 'none', borderTop: 'none' }} />
            <div className="relative" style={{ zIndex: 2 }}>
              <PartnerShowcaseRing partners={partners} isAr={isAr} size={size} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .partner-poster {
          transition: transform 0.15s ease-out, box-shadow 0.3s ease;
        }
        .partner-poster.poster-settled {
          transition: transform 0.6s cubic-bezier(0.2, 0.9, 0.25, 1), box-shadow 0.4s ease;
        }
        .partner-shine {
          background: linear-gradient(115deg, transparent 35%, #ffffff55 48%, #ffffffaa 50%, #ffffff55 52%, transparent 65%);
          transform: translateX(-140%);
          mix-blend-mode: screen;
        }
        .partner-poster:hover .partner-shine {
          animation: partner-poster-sweep 1.1s ease forwards;
        }
        @keyframes partner-poster-sweep {
          to { transform: translateX(140%); }
        }
        .partner-spotlight {
          background: radial-gradient(circle 160px at var(--mx, 50%) var(--my, 50%), #ffffff22, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .partner-poster:hover .partner-spotlight {
          opacity: 1;
        }
        .partner-corner {
          position: absolute;
          width: 10px;
          height: 10px;
          border: 1.5px solid ${GOLD};
          opacity: 0.85;
          z-index: 2;
        }
        @media (prefers-reduced-motion: reduce) {
          .partner-poster, .partner-poster.poster-settled { transition: none; }
          .partner-poster:hover .partner-shine { animation: none; }
        }
      `}</style>
    </div>
  );
}
