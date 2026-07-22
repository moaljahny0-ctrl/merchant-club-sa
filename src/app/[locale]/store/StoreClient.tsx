'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/lib/cart/CartContext';
import type { Partner } from '@/lib/brands';

// ─── Store design tokens ──────────────────────────────────────────────────────

const C = {
  bg:        '#F5F0E8',
  card:      '#FFFFFF',
  hero:      '#3D2B1F',
  catBg:     '#F0EBE1',
  catActive: '#E8D5B0',
  text:      '#1A1208',
  text2:     '#6B5B4E',
  gold:      '#B8975A',
  border:    '#E5DDD0',
  promo:     '#E8F0EC',
  promobtn:  '#2D5A3D',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductData = {
  id: string;
  title_en: string;
  title_ar: string | null;
  price: number;
  sale_price: number | null;
  category: string;
  published_at: string | null;
  brand_id: string;
  brands: { name_en: string; name_ar: string | null; slug: string } | null;
  product_images: { url: string; is_primary: boolean }[];
};

type Props = {
  products: ProductData[];
  heroProducts: ProductData[];
  partners: Partner[];
  locale: string;
};

// ─── Category label map ───────────────────────────────────────────────────────

const CAT_MAP: Record<string, { ar: string; en: string; emoji: string }> = {
  apparel:    { ar: 'الملابس',    en: 'Clothing',    emoji: '👗' },
  abaya:      { ar: 'العباية',    en: 'Abaya',       emoji: '🧕' },
  chocolate:  { ar: 'الشاكولات', en: 'Chocolates',  emoji: '🍫' },
  chocolates: { ar: 'الشاكولات', en: 'Chocolates',  emoji: '🍫' },
  food:       { ar: 'الطعام',     en: 'Food',        emoji: '🍫' },
  home:       { ar: 'المنزل',     en: 'Home',        emoji: '🏠' },
  art:        { ar: 'الفنون',     en: 'Arts',        emoji: '🎨' },
  fragrance:  { ar: 'العطور',     en: 'Fragrance',   emoji: '🌺' },
  beauty:     { ar: 'الجمال',     en: 'Beauty',      emoji: '💄' },
  jewelry:    { ar: 'المجوهرات', en: 'Jewelry',     emoji: '💎' },
  other:      { ar: 'أخرى',       en: 'Other',       emoji: '✨' },
};

function catLabel(cat: string, isAr: boolean): { label: string; emoji: string } {
  const mapped = CAT_MAP[cat.toLowerCase()];
  if (mapped) return { label: isAr ? mapped.ar : mapped.en, emoji: mapped.emoji };
  return { label: cat.charAt(0).toUpperCase() + cat.slice(1), emoji: '✨' };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StoreClient({ products, heroProducts, partners, locale }: Props) {
  const isAr = locale === 'ar';
  const [activeCategory, setActiveCategory]     = useState('all');
  const [activePriceRange, setActivePriceRange] = useState('all');
  const [sortOrder, setSortOrder]               = useState('newest');
  const [promoCopied, setPromoCopied]           = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    if (activePriceRange === 'under100') {
      result = result.filter(p => Number(p.price) < 100);
    } else if (activePriceRange === '100_300') {
      result = result.filter(p => Number(p.price) >= 100 && Number(p.price) <= 300);
    } else if (activePriceRange === 'over300') {
      result = result.filter(p => Number(p.price) > 300);
    } else if (activePriceRange === 'sale') {
      result = result.filter(p => p.sale_price !== null);
    }

    if (sortOrder === 'price_asc') {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOrder === 'price_desc') {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [products, activeCategory, activePriceRange, sortOrder]);

  function copyPromoCode() {
    navigator.clipboard.writeText('MERCHANT2026').then(() => {
      setPromoCopied(true);
      setTimeout(() => setPromoCopied(false), 2200);
    });
  }

  const priceTabs = [
    { key: 'all',      ar: 'الكل',              en: 'All' },
    { key: 'under100', ar: 'أقل من ١٠٠ ريال',   en: 'Under 100 SAR' },
    { key: '100_300',  ar: '١٠٠ – ٣٠٠ ريال',   en: '100 – 300 SAR' },
    { key: 'over300',  ar: 'فوق ٣٠٠ ريال',      en: 'Over 300 SAR' },
    { key: 'sale',     ar: 'العروض',             en: 'Sales' },
  ];

  return (
    <main className="flex-1" style={{ background: C.bg }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ background: C.hero, overflow: 'hidden' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">

            {/* Text — right in RTL */}
            <div className="flex-1 max-w-lg">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm mb-6"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}
              >
                + {isAr ? 'منصة العلامات السعودية المنتقاة' : 'Saudi Curated Brands Platform'}
              </div>
              <h1
                className="font-bold leading-tight mb-4"
                style={{ color: '#FFFFFF', fontSize: 'clamp(2rem, 5vw, 3rem)' }}
              >
                {isAr ? (
                  <>اكتشف أفضل<br />العلامات السعودية</>
                ) : (
                  <>Discover the Best<br />Saudi Brands</>
                )}
              </h1>
              <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {isAr
                  ? 'منتجات مختارة بعناية من شركاء موثوقين'
                  : 'Carefully selected products from trusted partners'}
              </p>
              <a
                href="#products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-bold transition-opacity hover:opacity-85"
                style={{ background: C.gold, color: '#FFFFFF' }}
              >
                {isAr ? 'تسوّق الآن ←' : '→ Shop Now'}
              </a>
            </div>

            {/* Floating product cards — left in RTL */}
            {heroProducts.length > 0 && (
              <div className="flex gap-4 flex-shrink-0 hidden md:flex">
                {heroProducts.slice(0, 2).map((product, i) => (
                  <HeroCard key={product.id} product={product} isAr={isAr} offset={i === 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Category Browser ─────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="px-6 md:px-10 py-7" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="max-w-7xl mx-auto">
            <p className="text-base font-semibold mb-4" style={{ color: C.text }}>
              {isAr ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              <CategoryPill
                label={isAr ? 'الكل' : 'All'}
                active={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
              />
              {categories.map(cat => {
                const { label, emoji } = catLabel(cat, isAr);
                return (
                  <CategoryPill
                    key={cat}
                    label={`${emoji} ${label}`}
                    active={activeCategory === cat}
                    onClick={() => setActiveCategory(cat)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Products Grid ────────────────────────────────────────────────── */}
      <section
        id="products"
        className="px-6 md:px-10 py-10"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold" style={{ color: C.text }}>
              {isAr ? 'أحدث المنتجات' : 'Latest Products'}
            </h2>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="text-sm rounded-md px-2 py-1.5 border"
              style={{ color: C.text2, borderColor: C.border, background: C.card, outline: 'none' }}
            >
              <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
              <option value="price_asc">{isAr ? 'السعر: الأقل' : 'Price: Low to High'}</option>
              <option value="price_desc">{isAr ? 'السعر: الأعلى' : 'Price: High to Low'}</option>
            </select>
          </div>

          {/* Price tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {priceTabs.map(tab => {
              const isActive = activePriceRange === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActivePriceRange(tab.key)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors"
                  style={{
                    background: isActive ? C.text : C.catBg,
                    color:      isActive ? '#FFFFFF' : C.text2,
                    border:     `1px solid ${isActive ? C.text : C.border}`,
                  }}
                >
                  {isAr ? tab.ar : tab.en}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          <p className="text-sm mb-5" style={{ color: C.text2 }}>
            {isAr
              ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'منتج' : 'منتجاً'}`
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'}`}
          </p>

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} isAr={isAr} />
              ))}
            </div>
          ) : (
            <p className="text-center py-16 text-base" style={{ color: C.text2 }}>
              {isAr ? 'لا توجد منتجات في هذه الفئة' : 'No products in this category'}
            </p>
          )}
        </div>
      </section>

      {/* ── Promo Banner ─────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-10" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-2xl px-6 md:px-10 py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            style={{ background: C.promo }}
          >
            <div>
              <p className="text-base font-bold mb-1" style={{ color: C.text }}>
                🎁 {isAr ? 'عرض محدود' : 'Limited Offer'}
              </p>
              <p className="text-base leading-relaxed" style={{ color: C.text2 }}>
                {isAr
                  ? 'استخدم الكود أثناء الشحن للحصول على شحن مجاني لأول طلب'
                  : 'Use code at checkout to get free shipping on your first order'}
              </p>
            </div>
            <button
              onClick={copyPromoCode}
              className="shrink-0 px-6 py-3 rounded-lg text-base font-bold tracking-widest transition-opacity hover:opacity-85 active:scale-95"
              style={{
                background: C.promobtn,
                color: '#FFFFFF',
                minWidth: '170px',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
            >
              {promoCopied
                ? (isAr ? '✓ تم النسخ!' : '✓ Copied!')
                : 'MERCHANT2026'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Partners Section ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-base font-bold" style={{ color: C.text }}>
              {isAr ? 'شركاؤنا' : 'Our Partners'}
            </h2>
            <Link
              href="/brands"
              className="text-base transition-opacity hover:opacity-70"
              style={{ color: C.gold }}
            >
              {isAr ? '← عرض الكل' : 'View All →'}
            </Link>
          </div>
          {partners.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {partners.map(partner => (
                <LightPartnerCard key={partner.id} partner={partner} isAr={isAr} />
              ))}
            </div>
          ) : (
            <p className="text-base" style={{ color: C.text2 }}>
              {isAr ? 'لا توجد علامات متاحة بعد.' : 'No brands available yet.'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

// ─── Category pill ────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-4 py-2 rounded-full text-base transition-colors"
      style={{
        background: active ? C.catActive : C.catBg,
        color:      active ? C.text      : C.text2,
        border:     `1px solid ${active ? '#C8B89A' : C.border}`,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

// ─── Hero product card ────────────────────────────────────────────────────────

function HeroCard({
  product,
  isAr,
  offset,
}: {
  product: ProductData;
  isAr: boolean;
  offset: boolean;
}) {
  const images      = product.product_images ?? [];
  const primaryImg  = images.find(i => i.is_primary) ?? images[0];
  const title       = isAr && product.title_ar ? product.title_ar : product.title_en;
  const price       = Number(product.price);
  const salePrice   = product.sale_price ? Number(product.sale_price) : null;
  const brand       = product.brands;
  const href        = brand?.slug ? `/brands/${brand.slug}/products/${product.id}` : '#';

  return (
    <Link
      href={href}
      className={`flex flex-col rounded-xl overflow-hidden transition-transform hover:scale-[1.02] ${offset ? 'mt-8' : ''}`}
      style={{
        width: '10rem',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        flexShrink: 0,
      }}
    >
      <div className="relative w-full aspect-square" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {primaryImg && (
          <Image
            src={primaryImg.url}
            alt={title}
            fill
            className="object-cover"
            sizes="160px"
          />
        )}
      </div>
      <div className="px-3 py-2.5">
        <p
          className="text-sm font-medium leading-snug line-clamp-2 mb-1"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          {title}
        </p>
        <p className="text-sm font-bold" style={{ color: C.gold }}>
          {(salePrice ?? price).toFixed(0)} {isAr ? 'ريال' : 'SAR'}
        </p>
      </div>
    </Link>
  );
}

// ─── Product card (light theme) ───────────────────────────────────────────────

function ProductCard({ product, isAr }: { product: ProductData; isAr: boolean }) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const images     = product.product_images ?? [];
  const primaryImg = images.find(i => i.is_primary) ?? images[0];
  const title      = isAr && product.title_ar ? product.title_ar : product.title_en;
  const brand      = product.brands;
  const brandName  = isAr && brand?.name_ar ? brand.name_ar : (brand?.name_en ?? '');
  const price      = Number(product.price);
  const salePrice  = product.sale_price ? Number(product.sale_price) : null;
  const href       = brand?.slug ? `/brands/${brand.slug}/products/${product.id}` : '#';

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!brand?.slug) return;
    addItem({
      productId:   product.id,
      brandId:     product.brand_id,
      brandSlug:   brand.slug,
      productName: title,
      brandName,
      price:       salePrice ?? price,
      image_url:   primaryImg?.url ?? null,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="group flex flex-col">
      <Link href={href} className="flex flex-col cursor-pointer">
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-lg"
          style={{ background: C.catBg }}
        >
          {primaryImg ? (
            <Image
              src={primaryImg.url}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-8" style={{ background: C.border }} />
            </div>
          )}
        </div>
        <div className="pt-3 space-y-1">
          {brandName && (
            <p
              className="text-[13px] uppercase tracking-wider"
              style={{ color: C.gold, fontFamily: 'var(--font-body)' }}
            >
              {brandName}
            </p>
          )}
          <p className="text-base font-medium leading-snug" style={{ color: C.text }}>
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            {salePrice ? (
              <>
                <span className="text-base font-bold" style={{ color: C.gold }}>
                  {salePrice.toFixed(0)} {isAr ? 'ريال' : 'SAR'}
                </span>
                <span className="text-sm line-through" style={{ color: C.text2 }}>
                  {price.toFixed(0)} {isAr ? 'ريال' : 'SAR'}
                </span>
              </>
            ) : (
              <span className="text-base font-bold" style={{ color: C.gold }}>
                {price.toFixed(0)} {isAr ? 'ريال' : 'SAR'}
              </span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={handleAddToCart}
        className="mt-3 w-full py-2 text-[13px] tracking-[0.2em] uppercase transition-all duration-200"
        style={{
          border:     `1px solid ${added ? '#4A9E6B' : C.border}`,
          background: added ? '#F0F7F3' : 'transparent',
          color:      added ? '#4A9E6B' : C.text2,
          cursor:     'pointer',
          fontFamily: 'inherit',
        }}
      >
        {added
          ? (isAr ? '✓ أضيف للسلة' : '✓ Added')
          : (isAr ? 'أضف للسلة' : 'Add to Cart')}
      </button>
    </div>
  );
}

// ─── Light partner card ───────────────────────────────────────────────────────

function LightPartnerCard({ partner, isAr }: { partner: Partner; isAr: boolean }) {
  const name     = isAr ? partner.nameAr  : partner.name;
  const category = isAr ? partner.categoryAr : partner.category;

  const card = (
    <div className="group flex flex-col cursor-pointer">
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-lg"
        style={{ background: C.catBg, border: `1px solid ${C.border}` }}
      >
        {partner.imageUrl ? (
          <Image
            src={partner.imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: C.gold }}
          >
            <span style={{ color: '#FFFFFF', fontSize: '2rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              {name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '·'}
            </span>
          </div>
        )}
      </div>
      <div className="pt-3 space-y-0.5">
        {name && (
          <p className="text-base font-medium" style={{ color: C.text }}>
            {name}
          </p>
        )}
        {category && (
          <p className="text-[13px] uppercase tracking-wider" style={{ color: C.text2 }}>
            {category}
          </p>
        )}
      </div>
    </div>
  );

  if (partner.slug) {
    return <Link href={`/brands/${partner.slug}`}>{card}</Link>;
  }
  if (partner.storeUrl) {
    return (
      <a href={partner.storeUrl} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );
  }
  return card;
}
