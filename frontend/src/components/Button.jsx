const variants = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-600/50 shadow-indigo-500/20",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:bg-slate-800/50 border border-slate-700",
  ghost: "bg-transparent text-slate-300 hover:bg-slate-800 border border-slate-700",
  danger: "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-600/50",
};

const sizes = {
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

const Button = ({
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
};

export default Button;
