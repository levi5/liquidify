export class CssInjector {
	build(): string {
		return `
      if (typeof window.__react_css_inject__ === 'undefined') {
        window.__react_css_inject__ = function(cssText, id) {
          if (document.getElementById(id)) return;

          const style = document.createElement('style');
          style.id = id;
          style.textContent = cssText;
          document.head.appendChild(style);
        }
      }
    `
	}

	escape(css: string): string {
		return css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
	}
}
