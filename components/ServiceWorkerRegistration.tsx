"use client"

import { useEffect } from "react"

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope)
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed: ", err)
        })
    }
  }, [])

  return null // This component doesn't render anything
}
