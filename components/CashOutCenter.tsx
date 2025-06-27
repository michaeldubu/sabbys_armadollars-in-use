"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { useToast } from "@/hooks/use-toast"

const supabase = createClientComponentClient()

type Reward = {
  id: string
  name: string
  description: string
  cost: number
  emoji: string
  active: boolean
}

interface CashOutCenterProps {
  user: any
  setUser: (user: any) => void
}

export default function CashOutCenter({ user, setUser }: CashOutCenterProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchRewards = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("rewards").select("*").eq("active", true).order("cost")

      if (error) throw error
      setRewards(data || [])
    } catch (error) {
      console.error("Error fetching rewards:", error)
      toast({ title: "Error", description: "Failed to load rewards.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  const handleRedemption = async (reward: Reward) => {
    if (user.armadollars < reward.cost) {
      toast({
        title: "Insufficient Armadollars",
        description: `You need ${reward.cost} Armadollars but only have ${user.armadollars}.`,
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Redeem "${reward.name}" for ${reward.cost} Armadollars?`)) return

    setLoading(true)
    try {
      // Deduct Armadollars immediately
      const newArmadollars = user.armadollars - reward.cost
      const { error: updateError } = await supabase
        .from("employees")
        .update({ armadollars: newArmadollars })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Create redemption record with pending status
      const { error: redemptionError } = await supabase.from("redemptions").insert({
        employee_id: user.id,
        reward_id: reward.id,
        reward_name: reward.name,
        cost: reward.cost,
        status: "pending",
      })

      if (redemptionError) throw redemptionError

      setUser({ ...user, armadollars: newArmadollars })

      toast({
        title: "Redemption Submitted!",
        description: `Your request for "${reward.name}" has been submitted for admin approval.`,
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E13223", "#FFDD02", "#439539"],
      })
    } catch (error) {
      console.error("Error processing redemption:", error)
      toast({
        title: "Error",
        description: "Failed to process redemption. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-roadhouseBlack">Loading rewards...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
        <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
          <CardTitle className="text-roadhouseRed text-center">🎁 Armadollars Cash Out Center</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-roadhouseBlack">
              Your Balance: <span className="text-roadhouseGreen">{user?.armadollars?.toFixed(2) || "0.00"}</span> 🪙
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Redeem your Armadollars for awesome rewards! All redemptions require admin approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-roadhouseBlack">No rewards available at the moment.</p>
                <p className="text-sm text-gray-600">Check back later for new rewards!</p>
              </div>
            ) : (
              rewards.map((reward) => (
                <motion.div
                  key={reward.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-roadhouseWhite/70 border-2 border-roadhouseRed rounded-lg p-4 shadow-sm"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{reward.emoji}</div>
                    <h3 className="font-bold text-lg text-roadhouseBlack mb-2">{reward.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-roadhouseRed">{reward.cost} 🪙</span>
                      <Button
                        onClick={() => handleRedemption(reward)}
                        disabled={user?.armadollars < reward.cost || loading}
                        className={`${
                          user?.armadollars >= reward.cost
                            ? "bg-roadhouseGreen text-roadhouseWhite hover:bg-roadhouseGreen/80"
                            : "bg-gray-400 text-gray-600 cursor-not-allowed"
                        } border-2 border-roadhouseBlack`}
                      >
                        {user?.armadollars >= reward.cost ? "Redeem" : "Need More"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-8 p-4 bg-roadhouseYellow/20 rounded-lg border border-roadhouseYellow">
            <h4 className="font-bold text-roadhouseBlack mb-2">📋 How It Works:</h4>
            <ul className="text-sm text-roadhouseBlack space-y-1">
              <li>• Choose a reward you want to redeem</li>
              <li>• Your Armadollars will be deducted immediately</li>
              <li>• Your request goes to admin for approval</li>
              <li>• Once approved, you'll receive your reward!</li>
              <li>• If denied, your Armadollars will be refunded</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
