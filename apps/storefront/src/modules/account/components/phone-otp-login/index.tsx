"use client"

import { loginWithToken } from "@lib/data/customer"
import { sdk } from "@lib/config"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

type Props = {
  countryCode: string
}

export default function PhoneOtpLogin({ countryCode }: Props) {
  const router = useRouter()

  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function startCooldown(seconds: number) {
    setCooldown(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await sdk.client.fetch<{ success?: boolean; cooldown_seconds?: number; error?: string; cooldown_remaining?: number }>(
        "/store/auth/phone/send-otp",
        { method: "POST", body: { phone } }
      )
      startCooldown(res.cooldown_seconds ?? 60)
      setStep("otp")
      setAttemptsRemaining(null)
    } catch (err: any) {
      const msg = err?.message || "Failed to send code"
      // Parse cooldown_remaining from error body if available
      try {
        const parsed = JSON.parse(err?.message || "{}")
        if (parsed.cooldown_remaining) {
          startCooldown(parsed.cooldown_remaining)
        }
      } catch {}
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await sdk.client.fetch<{ token?: string; error?: string; attempts_remaining?: number }>(
        "/store/auth/phone/verify-otp",
        { method: "POST", body: { phone, code } }
      )
      if (res.token) {
        await loginWithToken(res.token)
        router.push(`/${countryCode}/account`)
        router.refresh()
      } else {
        setError(res.error || "Verification failed")
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed")
      try {
        const parsed = JSON.parse(err?.message || "{}")
        if (parsed.attempts_remaining !== undefined) setAttemptsRemaining(parsed.attempts_remaining)
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return
    setError(null)
    setLoading(true)
    setCode("")
    setAttemptsRemaining(null)

    try {
      const res = await sdk.client.fetch<{ success?: boolean; cooldown_seconds?: number }>(
        "/store/auth/phone/send-otp",
        { method: "POST", body: { phone } }
      )
      startCooldown(res.cooldown_seconds ?? 60)
    } catch (err: any) {
      setError(err?.message || "Failed to resend code")
    } finally {
      setLoading(false)
    }
  }

  if (step === "phone") {
    return (
      <div className="max-w-sm w-full flex flex-col items-center" data-testid="phone-otp-page">
        <h1 className="text-large-semi uppercase mb-6">Sign in with Phone</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Enter your phone number and we'll send you a verification code.
        </p>
        <form className="w-full" onSubmit={handleSendOtp}>
          <div className="flex flex-col w-full gap-y-2">
            <label className="text-small-semi" htmlFor="phone">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+8801712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              className="w-full border border-ui-border-base rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ui-border-interactive"
            />
            <p className="text-xs text-ui-fg-muted">Use E.164 format with country code, e.g. +8801712345678</p>
          </div>

          {error && (
            <p className="mt-2 text-sm text-rose-500" data-testid="phone-otp-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !phone}
            className="mt-6 w-full bg-ui-button-neutral text-ui-fg-on-color py-3 rounded-md text-sm font-medium disabled:opacity-50 hover:bg-ui-button-neutral-hover transition-colors"
          >
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="phone-otp-verify-page">
      <h1 className="text-large-semi uppercase mb-6">Enter your code</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        We sent a verification code to <strong>{phone}</strong>.
      </p>
      <form className="w-full" onSubmit={handleVerifyOtp}>
        <div className="flex flex-col w-full gap-y-2">
          <label className="text-small-semi" htmlFor="otp-code">
            Verification Code
          </label>
          <input
            id="otp-code"
            type="text"
            name="code"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
            autoComplete="one-time-code"
            className="w-full border border-ui-border-base rounded-md px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-ui-border-interactive"
          />
          {attemptsRemaining !== null && (
            <p className="text-xs text-amber-600">{attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining</p>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-rose-500" data-testid="otp-verify-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !code}
          className="mt-6 w-full bg-ui-button-neutral text-ui-fg-on-color py-3 rounded-md text-sm font-medium disabled:opacity-50 hover:bg-ui-button-neutral-hover transition-colors"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-x-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
          className="text-sm underline disabled:opacity-40 disabled:no-underline"
        >
          Resend code
        </button>
        {cooldown > 0 && (
          <span className="text-xs text-ui-fg-muted">({cooldown}s)</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => { setStep("phone"); setError(null); setCode("") }}
        className="mt-2 text-sm text-ui-fg-muted underline"
      >
        Change phone number
      </button>
    </div>
  )
}
