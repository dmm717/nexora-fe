export default function DashboardPage() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { title: 'All Time', val: '1.457%', color: '#E0F2FE', border: '#BAE6FD' },
          { title: 'Sent Emails', val: '1.457%', color: '#F3E8FF', border: '#E9D5FF' },
          { title: 'Open Rate', val: '1.457%', color: '#D1FAE5', border: '#A7F3D0' },
          { title: 'Click Rate', val: '1.457%', color: '#FFEDD5', border: '#FDBA74' },
        ].map((card) => (
          <div key={card.title} style={{
            background: card.color,
            border: `1px solid ${card.border}`,
            padding: '1.5rem',
            borderRadius: '12px',
          }}>
            <div style={{ color: '#4B5563', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{card.title}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{card.val}</div>
            <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>X-Ray Leads Captured</div>
          </div>
        ))}
      </div>

      {/* Action Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Connect Email Outreach</h3>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1rem' }}>Connect your accounts to our deliverability tools.</p>
          <button style={{ width: '100%', padding: '0.5rem', background: '#fff', border: '1px solid #0D6EFD', color: '#0D6EFD', borderRadius: '6px', fontWeight: 500 }}>Connect Email</button>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Create a new Automation</h3>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1rem' }}>Use our outreach automation to contact leads.</p>
          <button style={{ width: '100%', padding: '0.5rem', background: '#fff', border: '1px solid #0D6EFD', color: '#0D6EFD', borderRadius: '6px', fontWeight: 500 }}>Create Automation</button>
        </div>
      </div>

    </div>
  );
}
