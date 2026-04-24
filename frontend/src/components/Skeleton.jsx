const Skeleton = ({ className = "" }) => {
  return <div className={`animate-pulse rounded-xl bg-slate-800/80 ${className}`} />;
};

export default Skeleton;
