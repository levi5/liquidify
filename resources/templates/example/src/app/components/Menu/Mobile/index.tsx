'use snippets'

import { Raw, RenderSvg } from 'liquidex'
import type { LinksType } from '../../../../types/components/menu'

import { MenuMobileModal } from './modal'

import styles from './styles.css'

export const MenuMobile = ({ options }: { options: LinksType }) => {
	return (
		<div className={styles.menuMobile}>
			<button
				type='button'
				aria-haspopup='dialog'
				aria-controls='menu-mobile-dialog'
				aria-label={"'header.open_menu' | t"}
				onClick={() => window.LiquidifyEmitEvent('message::menu-mobile', true)}
			>
				<RenderSvg name='menu.svg' />
			</button>

			{/* Shopify's `json` filter does not expose link titles/children consistently, so the
			    nested payload is built here from the link list itself. */}
			<Raw html={'{%- capture menu_json -%}[{%- for link in options -%}{"title":{{ link.title | json }},"url":{{ link.url | json }},"links":[{%- for child in link.links -%}{"title":{{ child.title | json }},"url":{{ child.url | json }},"links":[{%- for grandchild in child.links -%}{"title":{{ grandchild.title | json }},"url":{{ grandchild.url | json }},"links":[]}{%- unless forloop.last -%},{%- endunless -%}{%- endfor -%}]}{%- unless forloop.last -%},{%- endunless -%}{%- endfor -%}]}{%- unless forloop.last -%},{%- endunless -%}{%- endfor -%}]{%- endcapture -%}'} />

			<MenuMobileModal options={menu_json} />
		</div>
	)
}
