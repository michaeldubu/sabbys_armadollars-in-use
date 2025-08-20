"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"
import confetti from "canvas-confetti"

const supabase = createClientComponentClient()

export default function CashOutCenter({ user, setUser }) {
  const [selectedReward, setSelectedReward] = useState(null)
  const [cashoutSuccess, setCashoutSuccess] = useState(false)
  const [rewards, setRewards] = useState([
    { id: 1, name: "Free Meal", cost: 50, description: "Enjoy a free staff meal on the house!", emoji: "🍔" },
    { id: 2, name: "Pick Section", cost: 100, description: "Choose your own section for your next shift", emoji: "📍" },
    { id: 3, name: "No Back Work", cost: 150, description: "Skip side work for one shift", emoji: "🧹❌" },
    { id: 4, name: "Off Early Card", cost: 200, description: "Get out early pass, no questions asked", emoji: "🚪🏃‍♂️" },
  ])

  const handleCashOut = async (reward) => {
    if (!user || user.armadollars < reward.cost) {
      alert("Not enough Armadollars, partner!")
      return
    }

    try {
      const newBalance = user.armadollars - reward.cost
      const { error: employeeUpdateError } = await supabase
        .from("employees")
        .update({ armadollars: newBalance })
        .eq("id", user.id)
      if (employeeUpdateError) throw employeeUpdateError

      const { error: redemptionError } = await supabase.from("redemptions").insert([
        {
          employee_id: user.id,
          reward_name: reward.name,
          cost: reward.cost,
        },
      ])
      if (redemptionError) throw redemptionError

      setUser({ ...user, armadollars: newBalance })
      setCashoutSuccess(true)
      setSelectedReward(reward)
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.7 },
        colors: ["#E13223", "#FFDD02", "#439539"], // Texas Roadhouse colors!
      })
    } catch (err) {
      console.error("Error cashing out:", err)
      alert("Something went wrong with your redemption, partner!")
    }
  }

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
            Your current Armadollars: <span className="text-roadhouseRed font-bold">{user?.armadollars || 0} 🪙</span>
          </p>
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
                    disabled={user?.armadollars < reward.cost}
                    onClick={() => handleCashOut(reward)}
                    className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {cashoutSuccess && selectedReward && (
        <Card className="bg-roadhouseGreen/10 border-2 border-roadhouseGreen shadow-md">
          <CardContent className="py-6 text-center">
            <h2 className="text-xl font-bold text-roadhouseGreen">
              🎉 YEEHAW! You redeemed: {selectedReward.name}! 🎉
            </h2>
            <p className="text-sm text-roadhouseBlack">
              Enjoy your reward and keep earning those Armadollars, partner!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
