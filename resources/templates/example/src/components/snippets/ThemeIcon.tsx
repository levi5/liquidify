'use snippets'

export const ThemeIcon = ({ name }: { name: string }) => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
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
      {name === 'menu' && <path d="M3 7h18M3 12h18M3 17h18" />}
      {name === 'truck' && (
        <>
          <path d="M2 5h12v12H2zM14 9h4l4 4v4h-8" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
        </>
      )}
      {name === 'shield' && (
        <>
          <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z" />
          <path d="m8 12 3 3 5-6" />
        </>
      )}
      {name === 'return' && (
        <>
          <path d="M4 9h11a6 6 0 0 1 0 12h-2M8 4 3 9l5 5" />
        </>
      )}
    </svg>
  )
}
