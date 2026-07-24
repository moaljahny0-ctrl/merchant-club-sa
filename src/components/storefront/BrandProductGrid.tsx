'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { LayoutGrid, List, Search, Heart } from 'lucide-react';
import { useCart } from '@/lib/cart/CartContext';
import { toggleFavorite } from '@/lib/actions/favorites';

export type GridProduct = {
  id: string;
  title: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl?: string;
};

type SortOption = 'featured' | 'price_asc' | 'price_desc';

type Props = {
  products: GridProduct[];
  favoriteIds: Set<string>;
  brandId: string;
  brandSlug: string;
  brandName: string;
  accentHex: string;
  isAr: boolean;
  pageSize?: number;
};

export function BrandProductGrid({ products, favoriteIds, brandId, brandSlug, brandName, accentHex, isAr, pageSize = 8 }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortOption>('featured');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map(p => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const matchesQuery = p.title.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = category === 'all' || p.category === category;
      return matchesQuery && matchesCategory;
    });

    if (sort === 'price_asc') result = [...result].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === 'price_desc') result = [...result].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));

    return result;
  }, [products, query, category, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid #E5DDD0' }}>
        <h2 className="text-lg font-semibold" style={{ color: '#1A1208' }}>
          {isAr ? `كل المنتجات (${filtered.length})` : `All Products (${filtered.length})`}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search width={14} height={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" style={{ color: '#6B5B4E' }} />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setVisibleCount(pageSize); }}
              placeholder={isAr ? 'ابحث في هذا المتجر...' : 'Search this brand...'}
              className="w-44 sm:w-56 rounded-lg py-2 ps-8 pe-3 text-sm outline-none transition-colors"
              style={{ border: '1px solid #E5DDD0', background: '#FFFFFF', color: '#1A1208' }}
            />
          </div>

          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setVisibleCount(pageSize); }}
            className="rounded-lg py-2 px-3 text-sm outline-none"
            style={{ border: '1px solid #E5DDD0', background: '#FFFFFF', color: '#1A1208' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? (isAr ? 'الفئة' : 'Category') : c}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="rounded-lg py-2 px-3 text-sm outline-none"
            style={{ border: '1px solid #E5DDD0', background: '#FFFFFF', color: '#1A1208' }}
          >
            <option value="featured">{isAr ? 'مميز' : 'Featured'}</option>
            <option value="price_asc">{isAr ? 'السعر: الأقل' : 'Price: Low to High'}</option>
            <option value="price_desc">{isAr ? 'السعر: الأعلى' : 'Price: High to Low'}</option>
          </select>

          <div className="flex items-center gap-1 rounded-lg p-1" style={{ border: '1px solid #E5DDD0', background: '#FFFFFF' }}>
            <button
              type="button"
              onClick={() => setView('grid')}
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: view === 'grid' ? '#F0EBE1' : 'transparent', color: view === 'grid' ? '#1A1208' : '#6B5B4E' }}
            >
              <LayoutGrid width={14} height={14} />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="List view"
              aria-pressed={view === 'list'}
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: view === 'list' ? '#F0EBE1' : 'transparent', color: view === 'list' ? '#1A1208' : '#6B5B4E' }}
            >
              <List width={14} height={14} />
            </button>
          </div>
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: '#6B5B4E' }}>
          {isAr ? 'لا توجد منتجات مطابقة.' : 'No products match your search.'}
        </p>
      ) : (
        <div className={view === 'grid' ? 'mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8' : 'mt-6 flex flex-col gap-4'}>
          {visibleProducts.map(product => (
            <ProductTile
              key={product.id}
              product={product}
              isFavorite={favoriteIds.has(product.id)}
              listView={view === 'list'}
              brandId={brandId}
              brandSlug={brandSlug}
              brandName={brandName}
              accentHex={accentHex}
              isAr={isAr}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(c => c + pageSize)}
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            style={{ border: '1px solid #D8D0C0', color: '#1A1208' }}
          >
            {isAr ? 'عرض المزيد ⌄' : 'Load more products ⌄'}
          </button>
        </div>
      )}
    </section>
  );
}

function ProductTile({
  product,
  isFavorite,
  listView,
  brandId,
  brandSlug,
  brandName,
  accentHex,
  isAr,
}: {
  product: GridProduct;
  isFavorite: boolean;
  listView: boolean;
  brandId: string;
  brandSlug: string;
  brandName: string;
  accentHex: string;
  isAr: boolean;
}) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleFavorite('product', product.id);
      if (result.requiresAuth) {
        router.push('/store/login');
        return;
      }
      if (!result.error) setFavorite(!!result.following);
    });
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      brandId,
      brandSlug,
      productName: product.title,
      brandName,
      price: product.salePrice ?? product.price,
      image_url: product.imageUrl ?? null,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Link
      href={`/brands/${brandSlug}/products/${product.id}`}
      className={listView ? 'group flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-white' : 'group flex flex-col'}
    >
      <div className={`relative overflow-hidden rounded-xl shrink-0 ${listView ? 'w-24 h-24' : 'aspect-square'}`} style={{ background: '#F0EBE1' }}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes={listView ? '96px' : '(max-width: 768px) 50vw, 25vw'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-px w-8" style={{ background: '#E5DDD0' }} />
          </div>
        )}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={isPending}
          aria-label={favorite ? (isAr ? 'إزالة من المفضلة' : 'Remove from wishlist') : (isAr ? 'أضف للمفضلة' : 'Add to wishlist')}
          aria-pressed={favorite}
          className="absolute top-2 end-2 flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-60"
          style={{ background: 'rgba(255,255,255,0.92)' }}
        >
          <Heart width={15} height={15} style={{ color: favorite ? accentHex : '#6B5B4E', fill: favorite ? accentHex : 'none' }} />
        </button>
      </div>

      <div className={listView ? 'flex-1 flex items-center justify-between gap-3' : 'pt-3 space-y-1'}>
        <div>
          <p className="text-sm font-medium leading-snug" style={{ color: '#1A1208' }}>{product.title}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            {product.salePrice ? (
              <>
                <span className="text-sm font-bold" style={{ color: accentHex }}>{product.salePrice.toFixed(0)} {isAr ? 'ريال' : 'SAR'}</span>
                <span className="text-[13px] line-through" style={{ color: '#6B5B4E' }}>{product.price.toFixed(0)} {isAr ? 'ريال' : 'SAR'}</span>
              </>
            ) : (
              <span className="text-sm font-bold" style={{ color: accentHex }}>{product.price.toFixed(0)} {isAr ? 'ريال' : 'SAR'}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className="text-[11px] font-medium tracking-[0.08em] uppercase rounded-lg px-3 py-2 transition-all shrink-0"
          style={{
            border: `1px solid ${added ? '#4A9E6B' : '#E5DDD0'}`,
            background: added ? '#F0F7F3' : '#FFFFFF',
            color: added ? '#4A9E6B' : '#1A1208',
          }}
        >
          {added ? (isAr ? '✓ أضيف' : '✓ Added') : (isAr ? 'أضف للسلة' : 'Add to Cart')}
        </button>
      </div>
    </Link>
  );
}
