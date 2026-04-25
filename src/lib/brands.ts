// ─── Partner ──────────────────────────────────────────────────────────────────
// "Partners" is the term used across Merchant Club SA to refer to
// independent businesses on the platform. Not brands. Not listings. Partners.

export type Partner = {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  imageUrl?: string;    // product / lifestyle photo from the partner
  storeUrl?: string;    // external link (Instagram, etc.) — only used if no slug
  slug?: string;        // internal brand slug → /brands/[slug]
};

// ─── Placeholder slots ────────────────────────────────────────────────────────
// Shown while partner onboarding is in progress.
// Replace with real Partner entries in activePartners[] below.
export const placeholderSlots: Partner[] = [
  { id: 'slot-1', name: '', nameAr: '', category: 'Fragrance',    categoryAr: 'عطور'          },
  { id: 'slot-2', name: '', nameAr: '', category: 'Apparel',      categoryAr: 'أزياء'         },
  { id: 'slot-3', name: '', nameAr: '', category: 'Home & Living', categoryAr: 'منزل وديكور'  },
  { id: 'slot-4', name: '', nameAr: '', category: 'Beauty',       categoryAr: 'تجميل'         },
];

// ─── Active partners ──────────────────────────────────────────────────────────
// Add confirmed partners here. Each entry with an imageUrl will show
// the partner's product photo in the showcase and partner grid.
//
// Example:
// {
//   id: 'partner-001',
//   name: 'Nabta',
//   nameAr: 'نبتة',
//   category: 'Fragrance',
//   categoryAr: 'عطور',
//   imageUrl: '/partners/nabta-hero.jpg',
//   storeUrl: 'https://instagram.com/nabta',
// },

export const activePartners: Partner[] = [];
