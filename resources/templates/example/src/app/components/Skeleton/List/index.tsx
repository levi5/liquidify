'use snippets'

import styles from './styles.css'

export const SkeletonList = () => {
	return (
		<ul className={styles.skeletonList} aria-hidden='true'>
			<li className={styles.skeletonRow}>
				<span className={styles.skeletonThumb} />
				<span className={styles.skeletonRowText} />
			</li>
			<li className={styles.skeletonRow}>
				<span className={styles.skeletonThumb} />
				<span className={styles.skeletonRowText} />
			</li>
			<li className={styles.skeletonRow}>
				<span className={styles.skeletonThumb} />
				<span className={styles.skeletonRowText} />
			</li>
		</ul>
	)
}
