export type PlaygroundPresetId = "snippets" | "sections" | "react";

export const PLAYGROUND_PRESETS: Record<PlaygroundPresetId, { file: string; out: string; code: string }> = {
  snippets: {
    file: "Badge.tsx",
    out: "badge.liquid (preview)",
    code: `"use snippets"

export function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>
}`,
  },
  sections: {
    file: "Hello.tsx",
    out: "hello.liquid (preview)",
    code: `"use sections"

export const schema = {
  name: "Hello",
  settings: [
    { type: "text", id: "heading", label: "Heading" }
  ]
}

export default function Hello() {
  return (
    <section className="hello">
      <h2>{section.settings.heading}</h2>
    </section>
  )
}`,
  },
  react: {
    file: "Counter.tsx",
    out: "counter.liquid (preview)",
    code: `"use react"

export default function Counter() {
  return (
    <react-island component="Counter">
      <button data-liquidify-on-click="increment">+</button>
    </react-island>
  )
}`,
  },
};
