export default function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  if (!children) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} data-app />
      <div className="sheet" role="dialog" aria-modal="true" data-app>
        <div className="sheet-handle" />
        {children}
      </div>
    </>
  );
}
