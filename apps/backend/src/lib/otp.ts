import { createHash, randomInt } from "node:crypto"

export function generateOtp(length: number): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return randomInt(min, max + 1).toString().padStart(length, "0")
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

export function normalizePhone(phone: string): string {
  return phone.trim()
}

export function isValidPhone(phone: string): boolean {
  return /^\+\d{7,15}$/.test(phone)
}
