'use snippets'

import { RenderSvg } from 'liquidex'

import { MiniCart } from '../../../components/MiniCart'
import { SearchDrawer } from '../../../components/Search/Drawer'

export const HeaderUserOptions = () => {
	return (
		<div className='icon-button-group'>
			<SearchDrawer />

			<a href={routes.account_login_url} className='icon-button' aria-label={"'header.account_login' | t"}>
				<RenderSvg name='avatar-icon.svg' />
			</a>

			<MiniCart elementId='mini-cart' />
		</div>
	)
}
