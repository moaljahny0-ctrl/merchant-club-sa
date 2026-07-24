'use client';

type Props = {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

export function QuantityStepper({ quantity, onChange, min = 1, max = 10 }: Props) {
  return (
    <div className="flex items-center gap-1" style={{ border: '1px solid #E5DDD0', borderRadius: '9999px', padding: '4px' }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
        style={{ width: '28px', height: '28px', color: '#6B5B4E' }}
      >
        −
      </button>
      <span className="text-sm font-medium text-center" style={{ width: '20px', color: '#1A1208' }}>{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
        style={{ width: '28px', height: '28px', color: '#6B5B4E' }}
      >
        +
      </button>
    </div>
  );
}
