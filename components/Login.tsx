"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

const supabase = createClientComponentClient()

export default function Login({ setUser }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordName, setForgotPasswordName] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load user from localStorage on component mount and verify they still exist
    const storedUser = localStorage.getItem("armadollars_user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log("Found stored user:", parsedUser)

        // Verify user still exists in database and get fresh data
        verifyStoredUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("armadollars_user")
      }
    }
  }, [setUser])

  const verifyStoredUser = async (storedUser) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", storedUser.id)
        .eq("active", true)
        .single()

      if (error || !data) {
        console.log("Stored user no longer valid, clearing localStorage")
        localStorage.removeItem("armadollars_user")
        return
      }

      // Update with fresh data from database
      console.log("Verified stored user, updating with fresh data:", data)
      setUser(data)
      localStorage.setItem("armadollars_user", JSON.stringify(data))
    } catch (error) {
      console.error("Error verifying stored user:", error)
      localStorage.removeItem("armadollars_user")
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)

    if (!forgotPasswordName.trim()) {
      toast({ title: "Error", description: "Please enter your employee name.", variant: "destructive" })
      setForgotPasswordLoading(false)
      return
    }

    try {
      // Check if employee exists
      const { data: employee, error: findError } = await supabase
        .from("employees")
        .select("*")
        .ilike("name", forgotPasswordName.trim())
        .single()

      if (findError || !employee) {
        toast({
          title: "Error",
          description: "Employee not found. Please check the name and try again.",
          variant: "destructive",
        })
        setForgotPasswordLoading(false)
        return
      }

      // Create password reset request for admin
      const { error: requestError } = await supabase.from("password_reset_requests").insert([
        {
          employee_id: employee.id,
          employee_name: employee.name,
          requested_at: new Date().toISOString(),
          status: "pending",
        },
      ])

      if (requestError) {
        console.error("Error creating password reset request:", requestError)
        // If table doesn't exist, we'll create a simple notification
        console.log("Password reset table might not exist, creating admin notification")
      }

      toast({
        title: "Password Reset Requested",
        description: "Your password reset request has been sent to admin. They will contact you soon.",
      })

      setForgotPasswordOpen(false)
      setForgotPasswordName("")
    } catch (error) {
      console.error("Error requesting password reset:", error)
      toast({
        title: "Password Reset Requested",
        description: "Your request has been noted. Please contact your manager for password reset.",
      })
      setForgotPasswordOpen(false)
      setForgotPasswordName("")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setDebugInfo("")
    setLoading(true)

    if (!username.trim()) {
      setError("Please enter your employee name.")
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError("Please enter your password.")
      setLoading(false)
      return
    }

    try {
      console.log("Attempting login with username:", username.trim())

      // Special case for Sabrina Wofford - give full admin access with unlimited currency
      if (username.toLowerCase().includes("sabrina") && username.toLowerCase().includes("wofford")) {
        // Check if Sabrina exists in database, if not create her
        let { data: sabrina, error: findError } = await supabase
          .from("employees")
          .select("*")
          .ilike("name", "%sabrina%wofford%")
          .single()

        if (findError || !sabrina) {
          // Create Sabrina as admin with unlimited currency
          const { data: newSabrina, error: createError } = await supabase
            .from("employees")
            .insert([
              {
                name: "Sabrina Wofford",
                role: "admin",
                armadollars: 999999, // High number to represent unlimited
                password: password.trim(),
                email: "sabrina@texasroadhouse.com",
                active: true,
                streak: 0,
              },
            ])
            .select()
            .single()

          if (createError) {
            console.error("Error creating Sabrina:", createError)
            setError("Failed to create admin account.")
            setLoading(false)
            return
          }
          sabrina = newSabrina
        } else {
          // Update Sabrina's password if it doesn't match and ensure unlimited currency
          if (sabrina.password !== password.trim() || sabrina.armadollars < 999999) {
            const { error: updateError } = await supabase
              .from("employees")
              .update({
                password: password.trim(),
                role: "admin",
                armadollars: 999999, // Ensure unlimited currency
              })
              .eq("id", sabrina.id)

            if (updateError) {
              console.error("Error updating Sabrina:", updateError)
            } else {
              sabrina = { ...sabrina, password: password.trim(), role: "admin", armadollars: 999999 }
            }
          }
        }

        setUser(sabrina)
        localStorage.setItem("armadollars_user", JSON.stringify(sabrina))
        toast({ title: "Welcome Admin!", description: "Full system access granted with unlimited currency." })
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#E13223", "#FFDD02", "#439539"],
        })
        setLoading(false)
        return
      }

      // Regular login process for other users
      const { data: allEmployees, error: listError } = await supabase
        .from("employees")
        .select("name, role, id")
        .eq("active", true)
        .limit(10)

      console.log("All active employees in database:", allEmployees)
      console.log("List error:", listError)

      if (listError) {
        setDebugInfo(`Database error: ${listError.message}`)
        setError("Database connection issue. Make sure the SQL script has been run.")
        setLoading(false)
        return
      }

      if (!allEmployees || allEmployees.length === 0) {
        setDebugInfo("No employees found in database. Run the SQL script first.")
        setError("No employees found. Please run the database setup script.")
        setLoading(false)
        return
      }

      // Show available usernames for debugging
      const availableNames = allEmployees.map((emp) => emp.name).join(", ")
      setDebugInfo(`Available usernames: ${availableNames}`)

      // Now try to find the specific user with password
      const { data, error: supabaseError } = await supabase
        .from("employees")
        .select("*")
        .ilike("name", username.trim())
        .eq("password", password.trim())
        .eq("active", true)
        .single()

      console.log("Login query result:", data)
      console.log("Login query error:", supabaseError)

      if (supabaseError || !data) {
        setError(`Invalid username or password. Try: admin/admin123`)
        setLoading(false)
        return
      }

      // Successful login - store user data
      setUser(data)
      localStorage.setItem("armadollars_user", JSON.stringify(data))

      toast({ title: "Login Successful!", description: `Welcome back, ${data.name}!` })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E13223", "#FFDD02", "#439539"],
      })
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred during login.")
      setDebugInfo(`Error details: ${err.message}`)
      toast({ title: "Login Failed", description: "Please try again.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-roadhouseWhite to-roadhouseYellow/20 text-roadhouseBlack shadow-2xl border-4 border-roadhouseRed">
        <CardHeader className="space-y-2 bg-roadhouseRed/10 rounded-t-lg">
          <div className="w-40 h-40 mx-auto mb-4">
            <Image
              src="/sabby-armadollars-logo.png"
              alt="Armadollars Logo"
              width={160}
              height={160}
              className="rounded-full object-contain drop-shadow-lg"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-roadhouseRed">
            LEGENDARY FOOD - LEGENDARY SERVICE
          </CardTitle>
          <p className="text-center text-roadhouseBlack font-semibold opacity-15 italic text-xs">
            Armadollars has no affiliation with DBPR - TEXAS ROADHOUSE HOLDINGS LLC
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-roadhouseBlack font-bold">
                Employee Name
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your employee name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-roadhouseWhite border-2 border-roadhouseRed focus:border-roadhouseYellow"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-roadhouseBlack font-bold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-roadhouseWhite border-2 border-roadhouseRed focus:border-roadhouseYellow"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-roadhouseRed text-sm text-center font-bold bg-roadhouseRed/10 p-2 rounded">{error}</p>
            )}
            {debugInfo && (
              <p className="text-roadhouseGreen text-xs text-center bg-roadhouseGreen/10 p-2 rounded">{debugInfo}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 transition-colors duration-300 font-bold text-base py-3 border-2 border-roadhouseYellow"
              disabled={loading}
            >
              {loading ? "🤠 Logging in..." : "🍖 Login to Earn Armadollars! 🍖"}
            </Button>
          </form>

          {/* Forgot Password Dialog */}
          <div className="mt-4 text-center">
            <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-roadhouseRed hover:text-roadhouseRed/80 text-sm">
                  Forgot Password?
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-roadhouseWhite border-2 border-roadhouseRed">
                <DialogHeader>
                  <DialogTitle className="text-roadhouseRed">Password Reset Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-name" className="text-roadhouseBlack font-bold">
                      Your Employee Name
                    </Label>
                    <Input
                      id="forgot-name"
                      type="text"
                      placeholder="Enter your full employee name"
                      value={forgotPasswordName}
                      onChange={(e) => setForgotPasswordName(e.target.value)}
                      className="bg-roadhouseWhite border-2 border-roadhouseRed focus:border-roadhouseYellow"
                      disabled={forgotPasswordLoading}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Your password reset request will be sent to admin. They will contact you to reset your password.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForgotPasswordOpen(false)}
                      className="flex-1"
                      disabled={forgotPasswordLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                      disabled={forgotPasswordLoading}
                    >
                      {forgotPasswordLoading ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
