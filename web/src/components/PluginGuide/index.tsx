import { useLocale } from "../../i18n.tsx";
import Snippet from "../Snippet/index.tsx";
import {
  PLUGIN_INTERFACE,
  PLUGIN_EXAMPLE,
  PLUGIN_CONFIG,
  PLUGIN_BUILTIN,
  PLUGIN_PROGRAMMATIC,
  PLUGIN_COPY,
} from "../../cms/plugins.ts";

export default function PluginGuide() {
  const { locale } = useLocale();
  const copy = PLUGIN_COPY[locale];

  return (
    <section className="wrap section">
      <h2>{copy.title}</h2>
      <p className="section-sub">{copy.intro}</p>

      <div className="ref-block">
        <h3 id="plugin-interface">{copy.interface}</h3>
        <p className="ref-note">{copy.interfaceText}</p>
        <Snippet code={PLUGIN_INTERFACE} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="plugin-builtin">{copy.builtin}</h3>
        <p className="ref-note">{copy.builtinText}</p>
        <Snippet code={PLUGIN_BUILTIN} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="plugin-custom">{copy.custom}</h3>
        <p className="ref-note">{copy.customText}</p>
        <Snippet code={PLUGIN_EXAMPLE} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="plugin-config">{copy.config}</h3>
        <p className="ref-note">{copy.configText}</p>
        <Snippet code={PLUGIN_CONFIG} language="json" />
      </div>

      <div className="ref-block">
        <h3 id="plugin-programmatic">Programmatic</h3>
        <Snippet code={PLUGIN_PROGRAMMATIC} language="tsx" />
      </div>

      <div className="ref-block">
        <h3 id="plugin-stats">{copy.stats}</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {copy.statsHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copy.statsRows.map((row) => (
                <tr key={row[0]}>
                  <td>
                    <code>{row[0]}</code>
                  </td>
                  <td>
                    <code>{row[1]}</code>
                  </td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="docs-deep-grid">
        <article className="docs-deep-card">
          <h3>{copy.useCases}</h3>
          <ul>
            {copy.useItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="docs-deep-card">
          <h3>{copy.limitations}</h3>
          <ul>
            {copy.limitItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
