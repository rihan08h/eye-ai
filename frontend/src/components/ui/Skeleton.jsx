export default function Skeleton({
  className = '',
  variant = 'rectangular', // 'text' | 'rectangular' | 'circular' | 'card'
  count = 1,
}) {
  const baseClasses = 'animate-pulse bg-slate-800/60 rounded-xl';

  const variantMap = {
    text: 'h-4 w-full rounded',
    rectangular: 'h-24 w-full',
    circular: 'h-10 w-10 rounded-full',
    card: 'h-36 w-full glass-card border border-slate-800/80',
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((key) => (
        <div
          key={key}
          className={`${baseClasses} ${variantMap[variant] || ''} ${className}`}
        />
      ))}
    </>
  );
}
