import type { Locale } from "../i18n.tsx";

export const PLUGIN_INTERFACE = `// lib/core/protocols/plugin.ts
export interface LiquidifyPlugin {
  name: string
  setup(ctx: PluginContext): void
}

export interface PluginContext {
  onBuildEnd(callback: (stats: PluginStats) => void): void
}

export interface PluginStats {
  total: number
  tsx: number
  jsx: number
  ts: number
  js: number
  byDirective: Record<string, number>
}`;

export const PLUGIN_EXAMPLE = `// .plugins/my-plugin.ts
import type { LiquidifyPlugin } from 'liquidify'

export const myPlugin: LiquidifyPlugin = {
  name: 'my-plugin',
  setup(ctx) {
    ctx.onBuildEnd((stats) => {
      console.log(\`Build complete: \${stats.total} files processed\`)
      console.log(\`Directives: \${JSON.stringify(stats.byDirective)}\`)
    })
  },
}`;

export const PLUGIN_CONFIG = `// liquidify.config.json
{
  "componentsDir": "src/app",
  "output": ".",
  "plugins": ["tsx-stats", "my-plugin"]
}`;

export const PLUGIN_BUILTIN = `// tsx-stats: built-in plugin
import type { LiquidifyPlugin, PluginStats } from 'liquidify'

export const tsxStatsPlugin: LiquidifyPlugin = {
  name: 'tsx-stats',
  setup(ctx) {
    ctx.onBuildEnd((stats: PluginStats) => {
      console.log('\\n📊 TSX Statistics:')
      console.log(\`   Total files: \${stats.total}\`)
      console.log(\`   .tsx: \${stats.tsx}  .jsx: \${stats.jsx}  .ts: \${stats.ts}  .js: \${stats.js}\`)
      const directives = Object.entries(stats.byDirective)
      if (directives.length > 0) {
        console.log('   Directives:')
        directives.forEach(([name, count]) => console.log(\`     \${name}: \${count}\`))
      }
    });
  },
}`;

export const PLUGIN_PROGRAMMATIC = `// Programmatic usage
import { makeLiquidifyBuilder } from 'liquidify'
import { tsxStatsPlugin } from 'liquidify/plugins/tsx-stats'

const builder = makeLiquidifyBuilder({
  componentsDir: 'src/app',
  output: '.',
  plugins: [tsxStatsPlugin],
})

await builder.build()`;

export type PluginCopy = {
  title: string;
  intro: string;
  interface: string;
  interfaceText: string;
  builtin: string;
  builtinText: string;
  custom: string;
  customText: string;
  config: string;
  configText: string;
  stats: string;
  statsHeaders: string[];
  statsRows: string[][];
  useCases: string;
  useItems: string[];
  limitations: string;
  limitItems: string[];
};

export const PLUGIN_COPY: Record<Locale, PluginCopy> = {
  "pt-BR": {
    title: "Plugins",
    intro: "Estenda o Liquidify com plugins. Eles rodam ao final de cada build e recebem estatísticas completas do que foi compilado.",
    interface: "Interface LiquidifyPlugin",
    interfaceText: "Um plugin é um objeto com nome e função setup. O contexto fornece onBuildEnd para registrar callbacks.",
    builtin: "Plugin built-in: tsx-stats",
    builtinText: "O plugin tsx-stats já vem com o Liquidify. Ative-o no config para ver estatísticas de compilação no terminal.",
    custom: "Criando um plugin local",
    customText: "Crie uma pasta .plugins/ ao lado do config. Cada arquivo .js/.ts exporta um plugin válido.",
    config: "Ativando plugins",
    configText: "Liste os plugins no array plugins do config. Eles são resolvidos nesta ordem: built-in → local (.plugins/) → npm.",
    stats: "PluginStats",
    statsHeaders: ["Campo", "Tipo", "Descrição"],
    statsRows: [
      ["total", "number", "Total de arquivos processados no build."],
      ["tsx", "number", "Arquivos .tsx encontrados."],
      ["jsx", "number", "Arquivos .jsx encontrados."],
      ["ts", "number", "Arquivos .ts encontrados."],
      ["js", "number", "Arquivos .js encontrados."],
      ["byDirective", "Record<string, number>", "Contagem por diretiva (use sections, use snippets, use react, etc.)."],
    ],
    useCases: "Casos de uso",
    useItems: [
      "Gerar relatório de build com métricas customizadas",
      "Enviar estatísticas para serviço de monitoramento",
      "Validar que certas diretivas não foram usadas por engano",
      "Gerar documentação automática a partir do build",
      "Integrar com CI para falhar o build se certos limites forem excedidos",
    ],
    limitations: "Limites",
    limitItems: [
      "Plugins rodam apenas no build, não no watch incremental",
      "onBuildEnd é chamado uma vez por build completo",
      "Plugins não podem modificar o output — apenas observar",
      "Erros em plugins propagam como ValidationError",
    ],
  },
  en: {
    title: "Plugins",
    intro: "Extend Liquidify with plugins. They run at the end of each build and receive complete statistics about what was compiled.",
    interface: "LiquidifyPlugin interface",
    interfaceText: "A plugin is an object with a name and setup function. The context provides onBuildEnd to register callbacks.",
    builtin: "Built-in plugin: tsx-stats",
    builtinText: "The tsx-stats plugin comes with Liquidify. Enable it in the config to see compilation statistics in the terminal.",
    custom: "Creating a local plugin",
    customText: "Create a .plugins/ folder next to the config. Each .js/.ts file exports a valid plugin.",
    config: "Enabling plugins",
    configText: "List plugins in the config plugins array. They resolve in this order: built-in → local (.plugins/) → npm.",
    stats: "PluginStats",
    statsHeaders: ["Field", "Type", "Description"],
    statsRows: [
      ["total", "number", "Total files processed in the build."],
      ["tsx", "number", "Number of .tsx files found."],
      ["jsx", "number", "Number of .jsx files found."],
      ["ts", "number", "Number of .ts files found."],
      ["js", "number", "Number of .js files found."],
      ["byDirective", "Record<string, number>", "Count per directive (use sections, use snippets, use react, etc.)."],
    ],
    useCases: "Use cases",
    useItems: [
      "Generate build reports with custom metrics",
      "Send statistics to monitoring services",
      "Validate that certain directives were not used by mistake",
      "Generate automatic documentation from the build",
      "Integrate with CI to fail the build if certain limits are exceeded",
    ],
    limitations: "Limitations",
    limitItems: [
      "Plugins only run on full builds, not incremental watch",
      "onBuildEnd is called once per complete build",
      "Plugins cannot modify output — only observe",
      "Plugin errors propagate as ValidationError",
    ],
  },
};
