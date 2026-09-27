'use snippets'

import classNames from 'classnames'

import styles from './styles.css'

export const SkeletonImage = ({ square = false }: { square?: boolean }) => {
	return (
		<div
			aria-hidden='true'
			className={
				square
					? classNames(styles.skeletonBlock, styles.skeletonMedia, styles.skeletonMediaSquare)
					: classNames(styles.skeletonBlock, styles.skeletonMedia)
			}
		/>
	)
}
