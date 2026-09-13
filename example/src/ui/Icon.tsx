import React from 'preact/compat'
export const Icon = ({
  name,
  size = 22,
}: {
  name: 'search' | 'bag' | 'user' | 'menu' | 'close' | 'arrow'
  size?: number
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {name === 'search' && (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    )}
    {name === 'bag' && (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    )}
    {name === 'user' && (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    )}
    {name === 'menu' && (
      <>
        <path d="M3 7h18M3 12h18M3 17h18" />
      </>
    )}
    {name === 'close' && <path d="m6 6 12 12M6 18 18 6" />}
    {name === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
  </svg>
)
