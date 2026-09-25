export const HOME_INFO_BANNER_SCHEMA = {
	name: 'Info Banner',
	tag: 'section',
	settings: [
		{ type: 'text', id: 'eyebrow', label: 'Eyebrow' },
		{ type: 'text', id: 'heading', label: 'Título' },
		{ type: 'textarea', id: 'description', label: 'Texto' },
		{ type: 'text', id: 'button', label: 'Texto do botão' },
		{ type: 'url', id: 'link', label: 'Link do botão' },
		{ type: 'text', id: 'mark', label: 'Marca d’água', default: 'LQ.' },
		{ type: 'image_picker', id: 'image', label: 'Imagem' },
		{ type: 'text', id: 'caption', label: 'Legenda da imagem' },
	],
	presets: [{ name: 'Info Banner' }],
}
