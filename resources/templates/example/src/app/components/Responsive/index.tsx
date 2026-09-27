'use snippets'

import type { ReactNode } from 'preact/compat'
import styles from './styles.css'

export interface ResponsiveProps {
  showOnMobile?: boolean
  showOnTablet?: boolean
  showOnDesktop?: boolean
  children: ReactNode
  className?: string
}

export const Responsive = ({
  showOnMobile = true,
  showOnTablet = true,
  showOnDesktop = true,
  children,
  className = '',
}: ResponsiveProps) => {
  let responsiveClasses = ''

  if (!showOnMobile) responsiveClasses += ` ${styles.hideMobile}`
  if (!showOnTablet) responsiveClasses += ` ${styles.hideTablet}`
  if (!showOnDesktop) responsiveClasses += ` ${styles.hideDesktop}`

  return (
    <div className={`${responsiveClasses} ${className}`}>
      {children}
    </div>
  )
}
