export const BANNER_HERO_SCHEMA = {
	name: 'Banner Hero',
	tag: 'section',
	class: 'hero-banner',
	settings: [
		{
			type: 'checkbox',
			id: 'autoplay',
			label: 'Ativar autoplay',
			default: true,
		},
		{
			type: 'range',
			id: 'autoplay_speed',
			label: 'Velocidade (segundos)',
			min: 2,
			max: 10,
			step: 1,
			default: 5,
		},
	],
	blocks: [
		{
			type: 'slider',
			name: 'Slide',
			settings: [
				{
					type: 'image_picker',
					id: 'image',
					label: 'Imagem',
				},
				{
					type: 'text',
					id: 'heading',
					label: 'Título',
				},
				{
					type: 'text',
					id: 'button_label',
					label: 'Texto do botão',
				},
				{
					type: 'url',
					id: 'button_link',
					label: 'Link do botão',
				},
			],
		},
	],
	max_blocks: 10,
	presets: [
		{
			name: 'Banner Hero',
			blocks: [{ type: 'slider' }],
		},
	],
}
