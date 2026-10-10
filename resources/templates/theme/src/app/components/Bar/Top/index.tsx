'use snippets'

import { RenderSvg } from 'liquidex'
import classNames from 'classnames'

import styles from './styles.css'

export const TopBar = ({ blocks }: { blocks?: any[] }) => {
	return (
		<div className={styles.topBar} data-announcement>
			<div className={styles.wrapper}>
				<div className={styles.container}>
					{blocks?.map((block) => (
						block.type === 'message' && (
							<div className={styles.item} data-announcement-message>
								{block.settings.text}
							</div>
						)
					))}
				</div>

				<button
					type='button'
					className={classNames(styles.button, styles.pause)}
					data-announcement-pause
					aria-pressed='false'
					aria-label={"'header.pause_announcements' | t"}
				>
					Ⅱ
				</button>
				<button
					type='button'
					className={classNames(styles.button, styles.prev)}
					data-announcement-prev
					aria-label={"'header.prev_announcement' | t"}
				>
					<RenderSvg name='left-arrow.svg' />
				</button>
				<button
					type='button'
					className={classNames(styles.button, styles.next)}
					data-announcement-next
					aria-label={"'header.next_announcement' | t"}
				>
					<RenderSvg name='right-arrow.svg' />
				</button>
			</div>
		</div>
	)
}
