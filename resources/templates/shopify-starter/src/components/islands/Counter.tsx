"use react"
import { useState } from 'preact/hooks'

interface CounterProps {
  initialCount?: number
}

export const Counter = ({ initialCount = 0 }: CounterProps) => {
  const [count, setCount] = useState(initialCount)

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1rem',
        background: '#ffffff',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <button
        type="button"
        onClick={() => setCount((c) => c - 1)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#f8fafc',
          cursor: 'pointer',
          fontSize: '1.25rem',
          fontWeight: 'bold',
        }}
      >
        -
      </button>

      <span style={{ fontSize: '1.25rem', fontWeight: '700', minWidth: '48px', textAlign: 'center' }}>
        {count}
      </span>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--primary-color, #6366f1)',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: '1.25rem',
          fontWeight: 'bold',
        }}
      >
        +
      </button>
    </div>
  )
}
