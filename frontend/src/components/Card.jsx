const Card = ({ title, children, action }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-5 shadow-sm shadow-black/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/30">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
