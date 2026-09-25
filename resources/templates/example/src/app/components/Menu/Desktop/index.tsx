'use snippets'

import type { LinksType } from '../../../../types/components/menu'

export const MenuDesktop = ({ options }: { options: LinksType }) => {
	return (
		<>
			{options.length > 3 ? (
				options.map((link) =>
					link.links.length > 0 ? (
						<details className='nav-dropdown' data-menu-item>
							<summary>
								{link.title}
								<span className='nav-chevron' aria-hidden='true'></span>
							</summary>
							<div className='nav-submenu'>
								<a className='nav-overview' data-menu-overview href={link.url}>
									{link.title} ↗
								</a>
								{link.links.map((child) => (
									<div>
										<a data-menu-child href={child.url}>
											{child.title}
										</a>
										{child.links.map((grandchild) => (
											<a className='nav-grandchild' href={grandchild.url}>
												{grandchild.title}
											</a>
										))}
									</div>
								))}
							</div>
						</details>
					) : (
						<a data-menu-item href={link.url}>
							{link.title}
						</a>
					),
				)
			) : (
				<>
					<a data-menu-item href='{{ routes.root_url }}collections/all?sort_by=created-descending'>
						{"'header.new' | t"}
					</a>
					<details className='nav-dropdown' data-menu-item>
						<summary>
							{"'header.women' | t"}
							<span className='nav-chevron' aria-hidden='true'></span>
						</summary>
						<div className='nav-submenu'>
							<a className='nav-overview' data-menu-overview href='/collections/feminino'>
								{"'header.view_women' | t"}
							</a>
							<a data-menu-child href='/collections/all/feminino+blusas'>
								{"'header.women_tops' | t"}
							</a>
							<a data-menu-child href='/collections/all/feminino+jaquetas'>
								{"'header.women_jackets' | t"}
							</a>
							<a data-menu-child href='/collections/all/feminino+saias'>
								{"'header.women_skirts' | t"}
							</a>
						</div>
					</details>
					<details className='nav-dropdown' data-menu-item>
						<summary>
							{"'header.men' | t"}
							<span className='nav-chevron' aria-hidden='true'></span>
						</summary>
						<div className='nav-submenu'>
							<a className='nav-overview' data-menu-overview href='/collections/masculino'>
								{"'header.view_men' | t"}
							</a>
							<a data-menu-child href='/collections/all/masculino+camisas'>
								{"'header.men_shirts' | t"}
							</a>
							<a data-menu-child href='/collections/all/masculino+jaquetas'>
								{"'header.men_jackets' | t"}
							</a>
							<a data-menu-child href='/collections/all/masculino+alfaiataria'>
								{"'header.men_tailoring' | t"}
							</a>
						</div>
					</details>
					<details className='nav-dropdown' data-menu-item>
						<summary>
							{"'header.accessories' | t"}
							<span className='nav-chevron' aria-hidden='true'></span>
						</summary>
						<div className='nav-submenu'>
							<a className='nav-overview' data-menu-overview href='/collections/all'>
								{"'header.view_accessories' | t"}
							</a>
							<a data-menu-child href='/collections/all/bolsas'>
								{"'header.bags' | t"}
							</a>
							<a data-menu-child href='/collections/all/calcados'>
								{"'header.shoes' | t"}
							</a>
						</div>
					</details>
				</>
			)}
		</>
	)
}
