'use react'

import classNames from 'classnames'
import { createPortal, ReactNode } from 'preact/compat'
import { $DomFind } from '../../../shared/dom/get-element'

const Root = ({ children, onClick, className = 'modalPortalDefault' }: { children: ReactNode; onClick?: () => void; className?: string }) => {
	return (
		<div onClick={onClick && onClick} className={classNames(className)} style={{ width: 'auto' }}>
			{children}
		</div>
	)
}

export const Portal = ({ children, containerRef, onClick, className = '' }: { children: ReactNode; containerRef: string; className?: string; onClick?: () => void }) => {
	if (typeof document === 'undefined') return null
	const container = $DomFind(containerRef, document)

	if (container.isLeft()) return null
	const value = container.value as Element

	return createPortal(
		<Root onClick={onClick} className={className}>
			{children}
		</Root>,
		value,
	)
}
