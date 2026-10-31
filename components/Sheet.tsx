export default function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  if (!children) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        {children}
      </div>
    </>
  );
}
