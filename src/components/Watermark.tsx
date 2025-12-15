const Watermark = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-16 opacity-[0.03] rotate-[-15deg] scale-150">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="text-foreground text-2xl font-bold whitespace-nowrap">
            NEXUS STUDY
          </span>
        ))}
      </div>
    </div>
  );
};

export default Watermark;