'use snippets'

import styles from './styles.css'

export const FooterMenu = ({ blocks }: { blocks: any }) => {
	return (
		<nav className={styles.footerMenu}>
			{blocks.map(({ type, settings: { column_key, title } }: { type: string; settings: { title: string; column_key: string } }) => {
				return (
					type === 'column' && (
						<div>
							{title !== 'blank' && (
								<h3 style='color:{{ block.settings.title_color }};font-size:{{ block.settings.title_size }}px;font-weight:{{ block.settings.title_weight }};'>{title}</h3>
							)}
							<div>
								{blocks.map(({ type, settings: { parent, text } }: any) => {
									return type === 'item' && column_key === parent && <div>{text}</div>
								})}
							</div>
						</div>
					)
				)
			})}
		</nav>
	)
}
