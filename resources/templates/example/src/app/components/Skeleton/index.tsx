'use snippets'

import classNames from 'classnames'

import styles from './styles.css'

export const Skeleton = ({ square = false }: { square?: boolean }) => {
	return (
		<div className={styles.skeleton} aria-hidden='true'>
			<div
				className={
					square
						? classNames(styles.skeletonBlock, styles.skeletonMedia, styles.skeletonMediaSquare)
						: classNames(styles.skeletonBlock, styles.skeletonMedia)
				}
			/>
			<div className={styles.skeletonLines}>
				<span className={styles.skeletonLine} />
				<span className={classNames(styles.skeletonLine, styles.skeletonLineShort)} />
			</div>
		</div>
	)
}
