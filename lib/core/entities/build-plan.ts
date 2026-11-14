export interface BuildPlan {
  changed: Set<string>
  dependencies: Set<string>
  commit(): void
}
