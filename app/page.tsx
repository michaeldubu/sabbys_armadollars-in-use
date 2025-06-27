"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Login from "@/components/Login"
import MainDashboard from "@/components/MainDashboard"
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration"

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Attempt to load user from localStorage on initial render
    const storedUser = localStorage.getItem("armadollars_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to parse stored user data:", e)
        localStorage.removeItem("armadollars_user") // Clear invalid data
      }
    }
  }, [])

  const handleLogout = () => {
    setUser(null)
    // Clear any persisted user data
    if (typeof window !== "undefined") {
      localStorage.removeItem("armadollars_user")
    }
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-woodBrownLight via-woodBrownMedium to-woodBrownDark">
        {user ? (
          <>
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
              <div className="fixed left-0 top-0 flex w-full justify-center border-b-2 border-roadhouseYellow bg-gradient-to-b from-roadhouseBlack/90 to-roadhouseRed/90 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-roadhouseBlack/80 lg:p-4 text-roadhouseWhite">
                <span className="text-roadhouseYellow font-bold">🤠 Howdy, {user.name}! 🤠</span>&nbsp;
                <code className="font-mono font-bold text-roadhouseWhite">Role: {user.role}</code>
              </div>
            </div>

            <div className="relative flex place-items-center">
              <div className="absolute inset-0 bg-roadhouseYellow/20 rounded-full blur-3xl"></div>
              <Image
                className="relative drop-shadow-2xl"
                src="/sabby-armadollars-logo.png"
                alt="Armadollars Logo"
                width={200}
                height={200}
                priority
              />
            </div>

            <div className="mb-32 grid text-center lg:max-w-5xl w-full lg:mb-0 lg:grid-cols-1 lg:text-left">
              <MainDashboard user={user} onLogout={handleLogout} setUser={setUser} />
            </div>
          </>
        ) : (
          <>
            <div className="mb-32 grid text-center lg:max-w-5xl w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
              <Login setUser={setUser} />
            </div>
          </>
        )}
      </main>
    </>
  )
}
