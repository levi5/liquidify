'use snippets'

import classNames from 'classnames'

import styles from './styles.css'

export const BaseBox = ({
	children,
	text,
	background_color,
	text_color,
	padding_top = 0,
	padding_right = 0,
	padding_bottom = 0,
	padding_left = 0,
	border_radius = 0,
	className = '',
}: {
	children?: any
	text?: string
	background_color?: string
	text_color?: string
	padding_top?: number | string
	padding_right?: number | string
	padding_bottom?: number | string
	padding_left?: number | string
	border_radius?: number | string
	className?: string
}) => {
	return (
		<div
			className={classNames(styles.box, className)}
			style={{
				backgroundColor: background_color,
				color: text_color,
				paddingTop: `${padding_top}px`,
				paddingRight: `${padding_right}px`,
				paddingBottom: `${padding_bottom}px`,
				paddingLeft: `${padding_left}px`,
				borderRadius: `${border_radius}px`,
			}}
		>
			{text ? text : children}
		</div>
	)
}
