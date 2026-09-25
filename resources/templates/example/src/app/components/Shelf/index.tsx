'use sections'

import { RenderSnippet, RenderSvg } from 'liquidex'
import classNames from 'classnames'

import { Card } from '../Card'
import { SwiperSliderArrow } from '../Swiper/Arrow'
import { SwiperCarousel } from '../Swiper/Slide'
import { SwiperSliderRoot } from '../Swiper/Root'

import { COLLECTION_SHELF_SCHEMA } from '../../../schemas/Shelf/collection-shelf.schema'
import { SHELF_SLIDER_SETTINGS } from '../../../settings/slider/shelf.settings'

import styles from './styles.css'

export const Shelf = () => {
	// O handle configurado pode nao existir na loja. A colecao do proprio produto
	// nao serve como fallback: ela costuma ter um unico item e encolheria a
	// prateleira, entao o catalogo completo e quem garante o limite preenchido.
	const picked = collections[section.settings.collection]
	const selectedCollection = picked || collections['all']

	// `slice` sem comprimento devolve 1 item em Liquid, entao um limite vazio
	// encolheria a prateleira para um unico cartao em vez de usar o padrao.
	const limit = section.settings.limite || 4
	// Sem fallback literal: `[]` viraria `{% assign %}` de array, que nao e
	// Liquid valido e derrubaria a section. `selectedCollection` ja tem fallback
	// (catalogo completo) e no Liquid o acesso em nil devolve nil, sem erro.
	const candidates = selectedCollection.products
	// Drops sem id nao sao produtos: renderizados viram cartao sem imagem, titulo
	// nem preco. Fora da pagina de produto vale um e a prateleira inteira.
	const other = candidates.filter((item: any) => item.id !== product.id)
	const valid = other.filter((item: any) => item.id)
	const products = valid.slice(0, limit)
	const shelfTitle = section.settings.title || selectedCollection?.title || 'Produtos em destaque'

	const carouselId = `shelf-${section.id}`
	const arrowId = `shelf-arrow-${section.id}`
	const arrowLeftId = `${arrowId}-left`
	const arrowRightId = `${arrowId}-right`
	const slideId = `${carouselId}-slide`

	return (
		<article className={styles.shelf} data-shelf-id={section.id}>
			<div className={classNames(styles.header, 'container')}>
				<div className={styles.headingGroup}>
					{section.settings.eyebrow && section.settings.eyebrow !== 'blank' && (
						<p className='eyebrow'>{section.settings.eyebrow}</p>
					)}
					{shelfTitle !== 'blank' && <h2>{shelfTitle}</h2>}
					{section.settings.subtitle && section.settings.subtitle !== 'blank' && (
						<p className='section-subtitle'>{section.settings.subtitle}</p>
					)}
				</div>

				{section.settings.view_all_label && section.settings.view_all_label !== 'blank' && (
					<a className='text-link' href='{{ section.settings.view_all_link | default: routes.all_products_collection_url }}'>
						{section.settings.view_all_label}
						<span aria-hidden='true'>↗</span>
					</a>
				)}
			</div>

			{products.length === 0 ? (
				<p className={styles.empty}>Nenhum produto nesta prateleira por enquanto.</p>
			) : (
				<div className={classNames(styles.cards, 'container')}>
					<SwiperSliderRoot elementId={carouselId}>
						<SwiperSliderArrow className={styles.arrowLeft} type='left' id={arrowId} elementId={arrowLeftId} enable>
							<RenderSvg name='left-arrow.svg' />
						</SwiperSliderArrow>

						<SwiperCarousel className={styles.carousel} id={carouselId} elementId={slideId} settings={SHELF_SLIDER_SETTINGS}>
							{products.map((item: any) => (
								<RenderSnippet key={item.id} slot={Card} item={item} />
							))}
						</SwiperCarousel>

						<SwiperSliderArrow className={styles.arrowRight} type='right' id={arrowId} elementId={arrowRightId} enable>
							<RenderSvg name='right-arrow.svg' />
						</SwiperSliderArrow>
					</SwiperSliderRoot>
				</div>
			)}
		</article>
	)
}

export default (Shelf.schema = COLLECTION_SHELF_SCHEMA)
