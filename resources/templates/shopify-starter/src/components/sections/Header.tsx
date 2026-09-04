"use sections"

export const Header = () => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <a
          href="/"
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#0f172a',
            textDecoration: 'none',
          }}
        >
          {shop.name}
        </a>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <a
          href="/"
          style={{
            fontSize: '0.95rem',
            color: '#475569',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Home
        </a>
      </nav>
    </header>
  )
}

export const schema = {
  name: 'Header',
  settings: [],
}
