"use sections"

export const Footer = () => {
  return (
    <footer
      style={{
        padding: '3rem 2rem',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
          &copy; {shop.name}. All rights reserved.
        </p>
        <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.75rem' }}>
          Powered by Liquidify
        </p>
      </div>
    </footer>
  )
}

export const schema = {
  name: 'Footer',
  settings: [],
}
