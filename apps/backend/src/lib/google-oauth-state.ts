import { randomUUID } from "node:crypto"

const stateMap = new Map<string, number>()
const TTL_MS = 10 * 60 * 1000

export function createState(): string {
  const now = Date.now()
  for (const [k, v] of stateMap) {
    if (now - v > TTL_MS) stateMap.delete(k)
  }
  const state = randomUUID()
  stateMap.set(state, now)
  return state
}

export function validateAndConsumeState(state: string): boolean {
  const created = stateMap.get(state)
  if (!created || Date.now() - created > TTL_MS) return false
  stateMap.delete(state)
  return true
}
