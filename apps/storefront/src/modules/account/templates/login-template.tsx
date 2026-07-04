"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import PhoneOtpLogin from "@modules/account/components/phone-otp-login"
import { useParams } from "next/navigation"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
  PHONE_OTP = "phone-otp",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<string>("sign-in")
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "us"

  return (
    <div className="w-full flex justify-start px-8 py-8">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : currentView === "register" ? (
        <Register setCurrentView={setCurrentView} />
      ) : (
        <PhoneOtpLogin countryCode={countryCode} />
      )}
    </div>
  )
}

export default LoginTemplate
