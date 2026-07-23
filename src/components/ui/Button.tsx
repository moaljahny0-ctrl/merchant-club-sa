import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from 'react';
import { Link } from '@/i18n/navigation';

type Variant = 'primary' | 'secondary' | 'back';

type CommonProps = {
  variant?: Variant;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Render a plain <a> instead of the i18n-aware Link — for routes outside
   *  the [locale] segment (e.g. /dashboard/*) where locale-prefixing would
   *  be wrong. */
  native?: boolean;
};

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style' | 'children'> & {
    href?: undefined;
  };

type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'style' | 'children' | 'href'> & {
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

const shapeByVariant: Record<Variant, string> = {
  primary: 'px-8 py-4 text-[13px] font-medium rounded-lg shadow-sm',
  secondary: 'px-8 py-4 text-[13px] font-medium border rounded-lg',
  back: 'px-4 py-2 min-h-11 text-[13px] font-medium border border-current/15 bg-transparent hover:border-current/35 rounded-full',
};

const liftByVariant: Record<Variant, string> = {
  primary: 'hover:-translate-y-[1px] hover:shadow-md active:translate-y-0',
  secondary: 'hover:-translate-y-[1px] hover:shadow-md active:translate-y-0',
  back: 'hover:opacity-80',
};

/**
 * Single source of truth for button/link shape across the site.
 * Colors stay caller-driven (className bg/text/border utilities, or `style`
 * for per-brand accent colors on storefronts) — this component only owns
 * padding, type scale, tracking, and the interaction affordance.
 */
export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  style,
  children,
  href,
  native,
  ...rest
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 tracking-[0.2em] uppercase transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
    shapeByVariant[variant],
    liftByVariant[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    const isExternal = native || /^(mailto:|tel:|https?:\/\/|#)/.test(href);
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          style={style}
          {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={classes}
        style={style}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      style={style}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
