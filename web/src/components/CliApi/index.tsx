import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import "./style.css";

const CLI = `liquidify [options]
liquidify init [dir] [--template example]

--watch, -w     watch and rebuild
--config        config path
--no-banner     hide banner
--version       version

aliases: liquidx, liquidx-watch`;

const API = `import { makeLiquidifyBuilder } from 'liquidify'

const builder = makeLiquidifyBuilder({
  componentsDir: 'src/components',
  output: '.',
})

builder.on('build:start', () => console.log('Building…'))
builder.on('build:end', () => console.log('Done!'))
builder.on('error', (err) => console.error(err.message))

await builder.build()
builder.watch() // optional`;

export default function CliApi() {
  const { locale } = useLocale();
  return (
    <section id="cli" className="wrap section">
      <p className="kicker">Automation</p>
      <h2>{locale === "pt-BR" ? "CLI e API programática" : "CLI and programmatic API"}</h2>
      <div className="cols">
        <div>
          <Snippet title="CLI" code={CLI} language="plain" />
        </div>
        <div>
          <Snippet title="API" code={API} language="tsx" />
        </div>
      </div>
    </section>
  );
}
