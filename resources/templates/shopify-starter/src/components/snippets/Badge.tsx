"use snippets"

interface BadgeProps {
  text?: string
}

export const Badge = ({ text = 'Liquidify Starter' }: BadgeProps) => {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: '#e0e7ff',
        color: '#4338ca',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginBottom: '1rem',
      }}
    >
      {text}
    </span>
  )
}
