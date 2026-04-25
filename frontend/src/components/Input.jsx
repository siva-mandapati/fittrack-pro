const Input = ({
  label,
  error,
  className = "",
  as = "input",
  options = [],
  ...props
}) => {
  const baseClass =
    "w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 pl-4 text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.22)]";

  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-slate-300">{label}</label>}
      {as === "select" ? (
        <select className={`${baseClass} ${className}`} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input className={`${baseClass} ${className}`} {...props} />
      )}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
};

export default Input;
