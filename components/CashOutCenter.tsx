"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Clock, CheckCircle, XCircle } from "lucide-react"
import confetti from "canvas-confetti"
import { useToast } from "@/hooks/use-toast"

const supabase = createClientComponentClient()

export default function CashOutCenter({ user, setUser }) {
  const [rewards, setRewards] = useState([])
  const [userRedemptions, setUserRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadRewards = async () => {
    try {
      console.log("Loading rewards for user:", user?.id)

      // Load rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .eq("active", true)
        .order("cost")

      if (rewardsError) {
        console.error("Rewards error:", rewardsError)
        throw rewardsError
      }

      console.log("Loaded rewards:", rewardsData)
      setRewards(rewardsData || [])

      // Load user's redemptions
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("redemptions")
        .select("*, rewards(name)")
        .eq("employee_id", user.id)
        .order("redeemed_at", { ascending: false })

      if (redemptionsError) {
        console.error("Redemptions error:", redemptionsError)
        // Don't throw here, just log - redemptions might not exist yet
        console.log("No redemptions found or error loading them")
      } else {
        console.log("Loaded redemptions:", redemptionsData)
        setUserRedemptions(redemptionsData || [])
      }
    } catch (error) {
      console.error("Error loading rewards:", error)
      toast({
        title: "Error",
        description: `Failed to load rewards: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadRewards()
    }
  }, [user])

  const handleCashOut = async (reward) => {
    console.log("Attempting cashout:", reward, "User:", user)

    // Check for Sabrina Wofford - unlimited currency
    const isSabrina = user?.name?.toLowerCase().includes("sabrina") && user?.name?.toLowerCase().includes("wofford")

    if (!isSabrina && (!user || user.armadollars < reward.cost)) {
      toast({
        title: "Not Enough Armadollars!",
        description: `You need ${reward.cost} but only have ${user?.armadollars || 0}. Keep up the great work to earn more, partner!`,
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Processing redemption...")

      // For Sabrina, don't deduct armadollars, for others deduct normally
      let newBalance = user.armadollars
      if (!isSabrina) {
        newBalance = user.armadollars - reward.cost
        const { error: employeeUpdateError } = await supabase
          .from("employees")
          .update({ armadollars: newBalance })
          .eq("id", user.id)

        if (employeeUpdateError) {
          console.error("Employee update error:", employeeUpdateError)
          throw employeeUpdateError
        }
      }

      // Create pending redemption
      const redemptionData = {
        employee_id: user.id,
        reward_id: reward.id,
        reward_name: reward.name,
        cost: reward.cost,
        status: "pending",
        redeemed_at: new Date().toISOString(),
      }

      console.log("Creating redemption:", redemptionData)

      const { data: redemptionResult, error: redemptionError } = await supabase
        .from("redemptions")
        .insert([redemptionData])
        .select()

      if (redemptionError) {
        console.error("Redemption insert error:", redemptionError)
        throw redemptionError
      }

      console.log("Redemption created:", redemptionResult)

      // Update user state
      setUser({ ...user, armadollars: newBalance })

      // Update localStorage to persist the change
      const updatedUser = { ...user, armadollars: newBalance }
      localStorage.setItem("armadollars_user", JSON.stringify(updatedUser))

      toast({
        title: "Redemption Submitted!",
        description: isSabrina
          ? `Admin redemption for ${reward.name} submitted (unlimited currency).`
          : `Your ${reward.name} request is pending admin approval.`,
      })

      // Reload redemptions to show the new pending one
      loadRewards()

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#E13223", "#FFDD02", "#439539"],
      })
    } catch (err) {
      console.error("Error submitting redemption:", err)
      toast({
        title: "Redemption Failed",
        description: `Something went wrong: ${err.message}. Please try again, partner!`,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-32">Loading rewards...</div>
  }

  const isSabrina = user?.name?.toLowerCase().includes("sabrina") && user?.name?.toLowerCase().includes("wofford")

  return (
    <div className="space-y-6">
      <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
        <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-roadhouseRed">
            <Gift className="h-5 w-5" />
            Cash Out Armadollars
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-roadhouseBlack mb-4 font-semibold">
            Your current Armadollars:
            <span className="text-roadhouseRed font-bold">
              {isSabrina ? "∞ (Unlimited)" : `${user?.armadollars || 0}`} 🪙
            </span>
            {isSabrina && <span className="text-xs text-roadhouseGreen ml-2">(Admin Privileges)</span>}
          </p>

          {rewards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-roadhouseBlack">No rewards available yet.</p>
              <p className="text-sm text-gray-600">Admin can add rewards in the Admin Dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 rounded-lg border-2 border-roadhouseRed/40 bg-roadhouseWhite/70 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xl font-bold text-roadhouseBlack flex items-center gap-2">
                      {reward.emoji} {reward.name}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{reward.description}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-roadhouseRed text-lg">{reward.cost} 🪙</span>
                    <Button
                      disabled={!isSabrina && user?.armadollars < reward.cost}
                      onClick={() => handleCashOut(reward)}
                      className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
                    >
                      {isSabrina ? "Admin Redeem" : "Redeem"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Redemption History */}
      {userRedemptions.length > 0 && (
        <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
          <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
            <CardTitle className="text-roadhouseRed">Your Redemption History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {userRedemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between p-3 bg-roadhouseWhite/70 rounded-lg border border-roadhouseRed/20"
                >
                  <div>
                    <p className="font-medium text-roadhouseBlack">{redemption.reward_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(redemption.redeemed_at).toLocaleDateString()} • {redemption.cost} 🪙
                    </p>
                    {redemption.admin_notes && (
                      <p className="text-xs text-gray-500 italic">Note: {redemption.admin_notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {redemption.status === "pending" && (
                      <span className="flex items-center text-roadhouseYellow">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </span>
                    )}
                    {redemption.status === "approved" && (
                      <span className="flex items-center text-roadhouseGreen">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approved
                      </span>
                    )}
                    {redemption.status === "denied" && (
                      <span className="flex items-center text-roadhouseRed">
                        <XCircle className="h-4 w-4 mr-1" />
                        Denied
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
