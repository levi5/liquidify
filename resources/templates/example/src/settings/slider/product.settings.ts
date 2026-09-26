export const PRODUCT_PREVIEW_SLIDER_SETTINGS = {
	slidesPerView: 1,
	loop: true,
}

export const PRODUCT_THUMBNAILS_SLIDER_SETTINGS = {
	slidesPerView: 4,
	spaceBetween: 10,
	loop: false,
	observer: true,
	observeParents: true,
	watchOverflow: true,
	direction: 'horizontal',
	breakpoints: {
		680: {
			slidesPerView: 4,
			spaceBetween: 10,
			direction: 'horizontal',
		},
		1024: {
			direction: 'vertical',
			slidesPerView: 'auto',
			spaceBetween: 10,
		},
	},
}
