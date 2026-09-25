export const SHELF_SLIDER_SETTINGS = {
	slidesPerView: 2,
	loop: true,
	observer: true,
	spaceBetween: 16,
	observeParents: true,
	breakpoints: {
		200: {
			slidesPerView: 1.5,
			spaceBetween: 10,
		},
		420: {
			slidesPerView: 2,
			spaceBetween: 10,
		},
		680: {
			slidesPerView: 3,
		},

		768: {
			slidesPerView: 3,
		},

		1024: {
			slidesPerView: 4,
			spaceBetween: 20,
		},
	},
}
