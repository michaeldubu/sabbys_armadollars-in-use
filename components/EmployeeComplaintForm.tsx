"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Send } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import confetti from "canvas-confetti"

const supabase = createClientComponentClient()

export default function EmployeeComplaintForm({ user }) {
  const [complaint, setComplaint] = useState("")
  const [category, setCategory] = useState("general")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submitComplaint = async () => {
    if (!complaint.trim()) {
      alert("Please enter your complaint details.")
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("complaints").insert([
        {
          employee_id: user.id,
          description: complaint,
          category: category,
          status: "open",
        },
      ])

      if (error) throw error

      setComplaint("")
      setCategory("general")
      setSubmitted(true)

      // Show success confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#E13223", "#FFDD02", "#439539"],
      })

      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error("Error submitting complaint:", error)
      alert("Failed to submit complaint. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="bg-roadhouseGreen/10 border-2 border-roadhouseGreen shadow-lg">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold text-roadhouseGreen mb-2">✅ Complaint Submitted Successfully!</h2>
          <p className="text-roadhouseBlack">
            Thank you for your feedback. Management will review your complaint and follow up as needed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
      <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-roadhouseRed">
          <AlertTriangle className="h-5 w-5" />
          Submit Feedback or Complaint
        </CardTitle>
        <p className="text-sm text-roadhouseBlack">
          Your voice matters! Let management know about any concerns or suggestions.
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label className="text-roadhouseBlack font-bold">Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-roadhouseRed rounded px-3 py-2 h-10 bg-roadhouseWhite/50 text-roadhouseBlack"
          >
            <option value="general">General Feedback</option>
            <option value="workplace">Workplace Issue</option>
            <option value="scheduling">Scheduling Concern</option>
            <option value="equipment">Equipment/Maintenance</option>
            <option value="training">Training Request</option>
            <option value="safety">Safety Concern</option>
            <option value="suggestion">Suggestion for Improvement</option>
          </select>
        </div>
        <div>
          <Label className="text-roadhouseBlack font-bold">Details</Label>
          <Textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Please describe your concern, suggestion, or feedback in detail..."
            className="bg-roadhouseWhite/50 border-roadhouseRed min-h-[120px]"
          />
        </div>
        <Button
          onClick={submitComplaint}
          disabled={submitting}
          className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow text-lg py-3"
        >
          <Send className="h-5 w-5 mr-2" />
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
        <p className="text-xs text-gray-600 text-center">
          All submissions are confidential and will be reviewed by management.
        </p>
      </CardContent>
    </Card>
  )
}
