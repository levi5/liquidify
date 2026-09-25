'use snippets'

import { TBadgesMetaField } from '../../../types/meta/badges'

import styles from './styles.css'

export const Badges = ({ badges }: { badges?: TBadgesMetaField[] }) => {
	return (
		<div className={styles.badges}>
			{badges && (
				<div className={styles.wrapper}>
					{badges.slice(0, 3).map(({ text, color, background }, index: number) => {
						return (
							<span class={styles.badge} style={{ background, color }}>
								{text}
							</span>
						)
					})}
				</div>
			)}
		</div>
	)
}
