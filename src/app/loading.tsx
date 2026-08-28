export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 156, 166, 0.2)', borderTopColor: '#009ca6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
