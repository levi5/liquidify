export const HOME_CATEGORIES_SCHEMA = {
	name: 'Categorias',
	tag: 'section',
	settings: [
		{ type: 'text', id: 'eyebrow', label: 'Eyebrow' },
		{ type: 'text', id: 'heading', label: 'Título' },
		{ type: 'text', id: 'intro_1', label: 'Texto (linha 1)' },
		{ type: 'text', id: 'intro_2', label: 'Texto (linha 2)' },
	],
	blocks: [
		{
			type: 'card',
			name: 'Card',
			settings: [
				{ type: 'image_picker', id: 'image', label: 'Imagem' },
				{ type: 'text', id: 'label', label: 'Label (opcional)' },
				{ type: 'text', id: 'title', label: 'Título' },
				{ type: 'url', id: 'url', label: 'Link' },
			],
		},
	],
	max_blocks: 4,
	presets: [
		{
			name: 'Categorias',
			blocks: [{ type: 'card' }, { type: 'card' }, { type: 'card' }],
		},
	],
}
