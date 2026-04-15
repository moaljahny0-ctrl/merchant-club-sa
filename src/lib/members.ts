export type MemberType =
  | 'creator'       // Content creator / influencer
  | 'athlete'       // Athlete / sports personality
  | 'club'          // Sports club / organization
  | 'media'         // Podcast / YouTube / media channel
  | 'community'     // Community figure / cultural entity
  | 'other';

export type Member = {
  id: string;
  name: string;
  nameAr: string;
  type: MemberType;
  typeAr: string;
  platform?: string;       // Primary platform (Instagram, YouTube, etc.)
  audienceSize?: string;   // Approx. following
  imageUrl?: string;       // Profile or lifestyle photo
  profileUrl?: string;     // Link to profile / page
};

export const activeMembers: Member[] = [];

// Placeholder slots for the coming-soon state
export const memberPlaceholderSlots: Member[] = [
  { id: 'slot-1', name: '', nameAr: '', type: 'creator', typeAr: 'صانع محتوى' },
  { id: 'slot-2', name: '', nameAr: '', type: 'athlete', typeAr: 'رياضي' },
  { id: 'slot-3', name: '', nameAr: '', type: 'club', typeAr: 'نادٍ رياضي' },
  { id: 'slot-4', name: '', nameAr: '', type: 'media', typeAr: 'قناة إعلامية' },
];
