export const HOME_CATEGORIES_SCHEMA = {
	name: 't:sections.categories.name',
	tag: 'section',
	settings: [
		{ type: 'text', id: 'eyebrow', label: 't:sections.categories.settings.eyebrow.label' },
		{ type: 'text', id: 'heading', label: 't:sections.categories.settings.heading.label' },
		{ type: 'text', id: 'intro_1', label: 't:sections.categories.settings.intro_1.label' },
		{ type: 'text', id: 'intro_2', label: 't:sections.categories.settings.intro_2.label' },
	],
	blocks: [
		{
			type: 'card',
			name: 't:sections.categories.blocks.card.name',
			settings: [
				{ type: 'image_picker', id: 'image', label: 't:sections.categories.blocks.card.settings.image.label' },
				{ type: 'text', id: 'label', label: 't:sections.categories.blocks.card.settings.label.label' },
				{ type: 'text', id: 'title', label: 't:sections.categories.blocks.card.settings.title.label' },
				{ type: 'url', id: 'url', label: 't:sections.categories.blocks.card.settings.url.label' },
			],
		},
	],
	max_blocks: 4,
	presets: [
		{
			name: 't:sections.categories.presets.default',
			blocks: [{ type: 'card' }, { type: 'card' }, { type: 'card' }],
		},
	],
}
