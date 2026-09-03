import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const Button = forwardRef(({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'cyan' | 'danger' | 'ghost' | 'glass'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const sizeMap = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2 font-semibold',
    lg: 'px-6 py-3.5 text-sm sm:text-base rounded-2xl gap-2.5 font-bold',
  };

  const variantMap = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30',
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 border border-cyan-300/40',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 backdrop-blur',
    glass: 'glass-card hover:border-cyan-500/40 text-slate-200 hover:text-white',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/25 border border-red-400/30',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/50',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeMap[size] || sizeMap.md} ${variantMap[variant] || variantMap.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
