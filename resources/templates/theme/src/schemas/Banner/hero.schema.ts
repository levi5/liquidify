export const BANNER_HERO_SCHEMA = {
	name: 't:sections.banner_hero.name',
	tag: 'section',
	class: 'hero-banner',
	settings: [
		{
			type: 'checkbox',
			id: 'autoplay',
			label: 't:sections.banner_hero.settings.autoplay.label',
			default: true,
		},
		{
			type: 'range',
			id: 'autoplay_speed',
			label: 't:sections.banner_hero.settings.autoplay_speed.label',
			min: 2,
			max: 10,
			step: 1,
			default: 5,
		},
	],
	blocks: [
		{
			type: 'slider',
			name: 't:sections.banner_hero.blocks.slider.name',
			settings: [
				{
					type: 'image_picker',
					id: 'image',
					label: 't:sections.banner_hero.blocks.slider.settings.image.label',
				},
				{
					type: 'text',
					id: 'heading',
					label: 't:sections.banner_hero.blocks.slider.settings.heading.label',
				},
				{
					type: 'text',
					id: 'button_label',
					label: 't:sections.banner_hero.blocks.slider.settings.button_label.label',
				},
				{
					type: 'url',
					id: 'button_link',
					label: 't:sections.banner_hero.blocks.slider.settings.button_link.label',
				},
			],
		},
	],
	max_blocks: 10,
	presets: [
		{
			name: 't:sections.banner_hero.presets.default',
			blocks: [{ type: 'slider' }],
		},
	],
}
