import styles from '@/components/AILayout.module.css';

export default function AIPage() {
  return (
    <>
      {/* Center Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>AI Assistant</h2>
          <div style={{ fontSize: '0.85rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%' }}></span>
            Connected to Analytics Engine
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0D6EFD, #00d2df)', borderRadius: '10px', marginBottom: '1rem' }}></div>
          <h1 style={{ fontSize: '2rem', fontWeight: 400, color: '#111827', letterSpacing: '-0.5px' }}>What would you<br/>like to analyze today?</h1>
        </div>

        {/* Input Area */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
            {['Analyze revenue trends', 'Identify churn risk', 'Forecast next quarter'].map(txt => (
              <button key={txt} style={{ background: '#F3F4F6', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                <span style={{fontWeight: 800, marginRight: '0.5rem'}}>N</span> {txt}
              </button>
            ))}
          </div>
          <div style={{ background: '#F3F4F6', borderRadius: '999px', display: 'flex', alignItems: 'center', padding: '0.5rem 1rem' }}>
            <span style={{ fontSize: '1.2rem', color: '#9CA3AF', marginRight: '0.5rem' }}>+</span>
            <input type="text" aria-label="Type a message" placeholder="Type a message..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem' }} />
            <span style={{ fontSize: '1.2rem', color: '#4B5563', cursor: 'pointer', marginLeft: '0.5rem' }}>🎤</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Timeline) */}
      <div className={styles.rightSidebar}>
        <div className={styles.rightHeader}>AI Insights Timeline</div>
        <div className={styles.filterTabs}>
          <span className={`${styles.filterTab} ${styles.active}`}>All</span>
          <span className={styles.filterTab}>Alerts</span>
          <span className={styles.filterTab}>Forecast</span>
          <span className={styles.filterTab}>Automation</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { icon: '🔴', title: 'Revenue anomaly detected', time: '2h ago', color: '#EF4444' },
            { icon: '⚠️', title: 'Churn risk increased', desc: 'for 14 users', time: '5h ago', color: '#F59E0B' },
            { icon: '🔄', title: 'Automation rule optimized', time: '9h ago', color: '#3B82F6' },
            { icon: '📈', title: 'Forecast model updated', desc: '(v2.4)', time: 'Yesterday', color: '#10B981' }
          ].map((item) => (
            <div key={item.title} style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#111827' }}>{item.title}</div>
                {item.desc && <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{item.desc}</div>}
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>{item.time}</div>
              </div>
              <div style={{ width: 6, height: 6, background: item.color, borderRadius: '50%', marginTop: '0.3rem' }}></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
