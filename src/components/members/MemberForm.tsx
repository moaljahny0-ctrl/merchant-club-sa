'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitMemberEnquiry } from '@/lib/actions/member';
import type { MemberEnquiryState } from '@/lib/actions/member';

const initialState: MemberEnquiryState = { success: false, error: null };

export function MemberForm() {
  const t = useTranslations('member');
  const [state, action, pending] = useActionState(submitMemberEnquiry, initialState);

  if (state.success) {
    return (
      <div className="py-8">
        <div className="h-px w-10 bg-gold mb-10" />
        <h2 className="font-display text-3xl font-light text-parchment mb-4">
          {t('success_heading')}
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-sm">
          {t('success_body')}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">

      {state.error === 'required' && (
        <p className="text-xs text-red-400 tracking-[0.1em]">{t('error_required')}</p>
      )}
      {state.error === 'send_failed' && (
        <p className="text-xs text-red-400 tracking-[0.1em]">{t('error_send_failed')}</p>
      )}

      {/* Name */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.name')} <span className="text-gold">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder={t('placeholders.name')}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.type')} <span className="text-gold">*</span>
        </label>
        <select
          name="type"
          required
          defaultValue=""
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 focus:outline-none focus:border-gold transition-colors appearance-none"
        >
          <option value="" disabled className="text-muted/40">
            {t('placeholders.type')}
          </option>
          <option value="Content Creator">{t('types.creator')}</option>
          <option value="Athlete / Sports Personality">{t('types.athlete')}</option>
          <option value="Sports Club / Organization">{t('types.club')}</option>
          <option value="Podcast / YouTube / Media">{t('types.media')}</option>
          <option value="Community Figure">{t('types.community')}</option>
          <option value="Other">{t('types.other')}</option>
        </select>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.platform')} <span className="text-gold">*</span>
        </label>
        <input
          name="platform"
          type="text"
          required
          placeholder={t('placeholders.platform')}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Audience */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.audience')}
        </label>
        <input
          name="audience"
          type="text"
          placeholder={t('placeholders.audience')}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Idea */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.idea')} <span className="text-gold">*</span>
        </label>
        <textarea
          name="idea"
          required
          rows={5}
          placeholder={t('placeholders.idea')}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Instagram */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.instagram')}
        </label>
        <input
          name="instagram"
          type="text"
          placeholder={t('placeholders.instagram')}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.email')} <span className="text-gold">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder={t('placeholders.email')}
          className="w-full bg-surface border border-border text-parchment text-sm px-4 py-3 placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-gold text-ink text-xs font-medium tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? t('submitting') : t('submit')}
      </button>

    </form>
  );
}
