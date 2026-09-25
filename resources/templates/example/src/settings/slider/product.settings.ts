export const PRODUCT_PREVIEW_SLIDER_SETTINGS = {
	slidesPerView: 1,
	loop: true,
}

export const PRODUCT_THUMBNAILS_SLIDER_SETTINGS = {
	slidesPerView: 4,
	spaceBetween: 10,
	loop: true,
	observer: true,
	observeParents: true,
	direction: 'horizontal',
	breakpoints: {
		1024: {
			direction: 'vertical',
		}
	}
}
