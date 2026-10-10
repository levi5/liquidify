'use snippets'

import classNames from 'classnames'

import styles from './styles.css'

export const SkeletonText = () => {
	return (
		<div className={styles.skeletonLines} aria-hidden='true'>
			<span className={styles.skeletonLine} />
			<span className={classNames(styles.skeletonLine, styles.skeletonLineShort)} />
		</div>
	)
}
