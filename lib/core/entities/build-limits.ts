export interface BuildLimits {
  maxFiles: number
  maxDependencies: number
  maxSourceBytes: number
  maxDependencyDepth: number
}

export const DEFAULT_BUILD_LIMITS: Readonly<BuildLimits> = {
  maxFiles: 10000,
  maxDependencies: 50000,
  maxSourceBytes: 5 * 1024 * 1024,
  maxDependencyDepth: 256,
}

export function resolveBuildLimits(overrides: Partial<BuildLimits> = {}): BuildLimits {
  for (const [name, value] of Object.entries(overrides)) {
    if (!(name in DEFAULT_BUILD_LIMITS) || !Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Build limit "${name}" must be a supported positive safe integer.`)
    }
  }
  return { ...DEFAULT_BUILD_LIMITS, ...overrides }
}
