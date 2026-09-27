export const HOME_INFO_BANNER_SCHEMA = {
	name: 't:sections.info_banner.name',
	tag: 'section',
	settings: [
		{ type: 'text', id: 'eyebrow', label: 't:sections.info_banner.settings.eyebrow.label' },
		{ type: 'text', id: 'heading', label: 't:sections.info_banner.settings.heading.label' },
		{ type: 'textarea', id: 'description', label: 't:sections.info_banner.settings.description.label' },
		{ type: 'text', id: 'button', label: 't:sections.info_banner.settings.button.label' },
		{ type: 'url', id: 'link', label: 't:sections.info_banner.settings.link.label' },
		{ type: 'text', id: 'mark', label: 't:sections.info_banner.settings.mark.label', default: 'LQ.' },
		{ type: 'image_picker', id: 'image', label: 't:sections.info_banner.settings.image.label' },
		{ type: 'text', id: 'caption', label: 't:sections.info_banner.settings.caption.label' },
	],
	presets: [{ name: 't:sections.info_banner.presets.default' }],
}
