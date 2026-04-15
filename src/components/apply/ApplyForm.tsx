'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { submitApplication, type ApplicationState } from '@/lib/actions/apply';

const initialState: ApplicationState = { success: false, error: null };

const CATEGORIES = [
  'apparel',
  'fragrance',
  'home',
  'beauty',
  'jewelry',
  'food',
  'art',
  'other',
] as const;

export function ApplyForm() {
  const t = useTranslations('apply');
  const [state, formAction, isPending] = useActionState(submitApplication, initialState);

  if (state.success) {
    return (
      <div className="py-16 space-y-6">
        <div className="h-px w-12 bg-gold" />
        <h3 className="font-display text-4xl font-light text-parchment">
          {t('success_heading')}
        </h3>
        <p className="text-muted leading-relaxed">{t('success_body')}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-10" noValidate>

      {/* Error */}
      {state.error === 'required' && (
        <p className="text-xs text-gold border border-gold/30 bg-gold/5 px-4 py-3">
          {t('error_required')}
        </p>
      )}
      {state.error === 'send_failed' && (
        <p className="text-xs text-gold border border-gold/30 bg-gold/5 px-4 py-3">
          {t('error_send_failed')}
        </p>
      )}

      {/* Brand Name */}
      <Field
        label={t('fields.brand_name')}
        name="brandName"
        placeholder={t('placeholders.brand_name')}
        required
      />

      {/* Category */}
      <div className="space-y-3">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.category')} <span className="text-gold">*</span>
        </label>
        <select
          name="category"
          required
          defaultValue=""
          className="w-full bg-surface border border-border text-parchment px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled>
            {t('placeholders.category')}
          </option>
          {CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {t(`categories.${key}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Story */}
      <div className="space-y-3">
        <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
          {t('fields.story')} <span className="text-gold">*</span>
        </label>
        <textarea
          name="story"
          required
          placeholder={t('placeholders.story')}
          rows={5}
          className="w-full bg-surface border border-border text-parchment px-4 py-3.5 text-sm placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Instagram */}
      <Field
        label={t('fields.instagram')}
        name="instagram"
        placeholder={t('placeholders.instagram')}
      />

      {/* Email */}
      <Field
        label={t('fields.email')}
        name="email"
        type="email"
        placeholder={t('placeholders.email')}
        required
      />

      {/* Website */}
      <Field
        label={t('fields.website')}
        name="website"
        type="url"
        placeholder={t('placeholders.website')}
      />

      {/* Note + Submit */}
      <div className="space-y-6 pt-2">
        <p className="text-[11px] text-muted tracking-wide">{t('note')}</p>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gold text-ink text-xs font-medium tracking-[0.25em] uppercase py-4 hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? t('submitting') : t('submit')}
        </button>
      </div>

    </form>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

function Field({
  label,
  name,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] tracking-[0.25em] uppercase text-muted">
        {label}
        {required && <span className="text-gold ms-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full bg-surface border border-border text-parchment px-4 py-3.5 text-sm placeholder:text-muted/40 focus:outline-none focus:border-gold transition-colors"
      />
    </div>
  );
}
