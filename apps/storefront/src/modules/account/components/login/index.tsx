"use client"

import { login } from "@lib/data/customer"
import { sdk } from "@lib/config"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState, useEffect, useState } from "react"

type AuthMethods = {
  google: { enabled: boolean; client_id?: string; redirect_uri?: string }
  phone_otp: { enabled: boolean; otp_length?: number }
}

type Props = {
  setCurrentView: (view: string) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const [authMethods, setAuthMethods] = useState<AuthMethods | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    sdk.client
      .fetch<AuthMethods>("/store/auth-methods")
      .then(setAuthMethods)
      .catch(() => {})
  }, [])

  async function handleGoogleLogin() {
    if (googleLoading) return
    setGoogleLoading(true)
    try {
      const res = await sdk.client.fetch<{ url?: string; error?: string }>(
        "/store/auth/google/initiate",
        { method: "POST" }
      )
      if (res.url) {
        window.location.href = res.url
      }
    } catch {
      setGoogleLoading(false)
    }
  }

  const showGoogle = authMethods?.google?.enabled
  const showPhone = authMethods?.phone_otp?.enabled

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Welcome back</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Sign in
        </SubmitButton>
      </form>

      {(showGoogle || showPhone) && (
        <div className="w-full mt-4 flex flex-col gap-y-2">
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-ui-border-base" />
            <span className="mx-3 text-xs text-ui-fg-muted">or continue with</span>
            <div className="flex-1 border-t border-ui-border-base" />
          </div>

          {showGoogle && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full border border-ui-border-base rounded-md py-2.5 text-sm flex items-center justify-center gap-x-2 hover:bg-ui-bg-subtle disabled:opacity-50 transition-colors"
              data-testid="google-login-button"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Redirecting…" : "Sign in with Google"}
            </button>
          )}

          {showPhone && (
            <button
              type="button"
              onClick={() => setCurrentView(LOGIN_VIEW.PHONE_OTP)}
              className="w-full border border-ui-border-base rounded-md py-2.5 text-sm hover:bg-ui-bg-subtle transition-colors"
              data-testid="phone-otp-button"
            >
              Use phone number
            </button>
          )}
        </div>
      )}

      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Join us
        </button>
        .
      </span>
    </div>
  )
}

export default Login
