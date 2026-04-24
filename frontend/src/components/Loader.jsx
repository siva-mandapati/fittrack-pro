const Loader = ({ label = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-slate-300">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default Loader;
