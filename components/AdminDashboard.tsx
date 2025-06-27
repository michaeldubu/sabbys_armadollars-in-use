"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Edit, Trash2, Eye, Bell, Plus, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const supabase = createClientComponentClient()

type Employee = {
  id: string
  name: string
  role: string
  armadollars: number
  email?: string
}

type Task = {
  id: string
  name: string
  armadollars: number
  description?: string
  category?: string
}

type Complaint = {
  id: string
  employee_id: string
  description: string
  category: string
  status: "open" | "in-progress" | "resolved"
  admin_notes?: string
  created_at: string
  employee_name?: string
  subject?: string
  details?: string
  employees: { name: string }
}

type Reward = {
  id: string
  name: string
  description: string
  cost: number
  emoji: string
  active: boolean
}

type Redemption = {
  id: string
  employee_id: string
  reward_id: string
  reward_name: string
  cost: number
  status: "pending" | "approved" | "denied"
  redeemed_at: string
  approved_at?: string
  admin_notes?: string
  employee_name?: string
  employees?: { name: string }
  rewards?: { name: string }
}

type PasswordResetRequest = {
  id: string
  employee_id: string
  employee_name: string
  requested_at: string
  status: "pending" | "processed"
  admin_notes?: string
}

interface AdminDashboardProps {
  user: Employee
  loadInitialData: () => Promise<void>
}

export default function AdminDashboard({ user, loadInitialData }: AdminDashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [passwordResets, setPasswordResets] = useState<PasswordResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  // Bonus State
  const [bonusAmount, setBonusAmount] = useState("")
  const [bonusReason, setBonusReason] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")

  // Task State
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskArmadollars, setNewTaskArmadollars] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Reward State
  const [newRewardName, setNewRewardName] = useState("")
  const [newRewardDescription, setNewRewardDescription] = useState("")
  const [newRewardCost, setNewRewardCost] = useState("")
  const [newRewardEmoji, setNewRewardEmoji] = useState("")
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

  // Dialog States
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null)
  const [isViewComplaintDialogOpen, setIsViewComplaintDialogOpen] = useState(false)
  const [viewingRedemption, setViewingRedemption] = useState<Redemption | null>(null)
  const [isViewRedemptionDialogOpen, setIsViewRedemptionDialogOpen] = useState(false)

  const fetchEmployees = useCallback(async () => {
    try {
      console.log("Fetching employees...")
      const { data, error } = await supabase.from("employees").select("*").eq("active", true)
      if (error) {
        console.error("Error fetching employees:", error)
        throw error
      }
      console.log("Employees fetched:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error in fetchEmployees:", error)
      toast({ title: "Error", description: "Failed to load employees.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchTasks = useCallback(async () => {
    try {
      console.log("Fetching tasks...")
      const { data, error } = await supabase.from("tasks").select("*")
      if (error) {
        console.error("Error fetching tasks:", error)
        throw error
      }
      console.log("Tasks fetched:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error in fetchTasks:", error)
      toast({ title: "Error", description: "Failed to load tasks.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchComplaints = useCallback(async () => {
    try {
      console.log("Fetching complaints...")
      const { data, error } = await supabase.from("complaints").select(`*, employees (name)`)
      if (error) {
        console.error("Error fetching complaints:", error)
        throw error
      }
      console.log("Complaints fetched:", data?.length || 0)
      return (data || []).map((complaint) => ({
        ...complaint,
        employee_name: complaint.employees ? complaint.employees.name : "Unknown",
      }))
    } catch (error) {
      console.error("Error in fetchComplaints:", error)
      toast({ title: "Error", description: "Failed to load complaints.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchRewards = useCallback(async () => {
    try {
      console.log("Fetching rewards...")
      const { data, error } = await supabase.from("rewards").select("*").order("cost")
      if (error) {
        console.error("Error fetching rewards:", error)
        throw error
      }
      console.log("Rewards fetched:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error in fetchRewards:", error)
      toast({ title: "Error", description: "Failed to load rewards.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchRedemptions = useCallback(async () => {
    try {
      console.log("Fetching redemptions...")

      // First, let's check if the redemptions table exists and has data
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("redemptions")
        .select("*")
        .order("redeemed_at", { ascending: false })

      if (redemptionsError) {
        console.error("Error fetching redemptions:", redemptionsError)
        // If table doesn't exist, return empty array instead of throwing
        if (redemptionsError.code === "42P01") {
          console.log("Redemptions table doesn't exist yet")
          return []
        }
        throw redemptionsError
      }

      console.log("Raw redemptions data:", redemptionsData)

      if (!redemptionsData || redemptionsData.length === 0) {
        console.log("No redemptions found")
        return []
      }

      // Now fetch employee names for each redemption
      const redemptionsWithNames = await Promise.all(
        redemptionsData.map(async (redemption) => {
          try {
            const { data: employee, error: empError } = await supabase
              .from("employees")
              .select("name")
              .eq("id", redemption.employee_id)
              .single()

            if (empError) {
              console.error("Error fetching employee for redemption:", empError)
            }

            return {
              ...redemption,
              employee_name: employee?.name || "Unknown Employee",
            }
          } catch (error) {
            console.error("Error processing redemption:", error)
            return {
              ...redemption,
              employee_name: "Unknown Employee",
            }
          }
        }),
      )

      console.log("Redemptions with names:", redemptionsWithNames)
      return redemptionsWithNames
    } catch (error) {
      console.error("Error in fetchRedemptions:", error)
      toast({ title: "Error", description: "Failed to load redemptions.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchPasswordResets = useCallback(async () => {
    try {
      console.log("Fetching password reset requests...")
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("*")
        .eq("status", "pending")
        .order("requested_at", { ascending: false })

      if (error) {
        console.error("Error fetching password resets:", error)
        // If table doesn't exist, return empty array
        if (error.code === "42P01") {
          console.log("Password reset requests table doesn't exist yet")
          return []
        }
        throw error
      }
      console.log("Password resets fetched:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("Error in fetchPasswordResets:", error)
      return []
    }
  }, [])

  const loadData = useCallback(async () => {
    console.log("Starting to load admin dashboard data...")
    setLoading(true)
    setError("")

    try {
      const [employeesData, tasksData, complaintsData, rewardsData, redemptionsData, passwordResetsData] =
        await Promise.all([
          fetchEmployees(),
          fetchTasks(),
          fetchComplaints(),
          fetchRewards(),
          fetchRedemptions(),
          fetchPasswordResets(),
        ])

      console.log("All data loaded successfully")
      setEmployees(employeesData)
      setTasks(tasksData)
      setComplaints(complaintsData)
      setRewards(rewardsData)
      setRedemptions(redemptionsData)
      setPasswordResets(passwordResetsData)
    } catch (err) {
      console.error("Error loading admin data:", err)
      setError(`Failed to load dashboard data: ${err.message}`)
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [fetchEmployees, fetchTasks, fetchComplaints, fetchRewards, fetchRedemptions, fetchPasswordResets, toast])

  useEffect(() => {
    if (user?.role === "admin") {
      loadData()
    }
  }, [loadData, user])

  const handleGiveBonus = async () => {
    if (!selectedEmployeeId || !bonusAmount || !bonusReason) {
      toast({ title: "Missing Information", description: "Please fill all bonus fields.", variant: "destructive" })
      return
    }
    const amount = Number.parseFloat(bonusAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Bonus amount must be a positive number.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data: employee, error: fetchError } = await supabase
        .from("employees")
        .select("armadollars")
        .eq("id", selectedEmployeeId)
        .single()

      if (fetchError || !employee) throw new Error("Employee not found or error fetching employee.")

      const newArmadollars = employee.armadollars + amount
      const { error: updateError } = await supabase
        .from("employees")
        .update({ armadollars: newArmadollars })
        .eq("id", selectedEmployeeId)
      if (updateError) throw updateError

      const { error: achievementError } = await supabase.from("achievements").insert({
        employee_id: selectedEmployeeId,
        achievement_type: "bonus",
        title: "Admin Bonus",
        description: bonusReason,
        armadollars_awarded: amount,
      })
      if (achievementError) throw achievementError

      setBonusAmount("")
      setBonusReason("")
      setSelectedEmployeeId("")
      await loadData()
      loadInitialData()
      toast({ title: "Success!", description: "Bonus successfully awarded!" })
    } catch (err) {
      console.error("Error giving bonus:", err)
      toast({ title: "Error", description: `Failed to award bonus: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskName || !newTaskDescription || !newTaskArmadollars) {
      toast({ title: "Missing Information", description: "Please fill all task fields.", variant: "destructive" })
      return
    }
    const armadollars = Number.parseFloat(newTaskArmadollars)
    if (isNaN(armadollars) || armadollars <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Task Armadollars must be a positive number.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (editingTask) {
        const { error } = await supabase
          .from("tasks")
          .update({ name: newTaskName, description: newTaskDescription, armadollars: armadollars })
          .eq("id", editingTask.id)
        if (error) throw error
        toast({ title: "Success!", description: "Task updated successfully!" })
        setEditingTask(null)
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert({ name: newTaskName, description: newTaskDescription, armadollars: armadollars })
        if (error) throw error
        toast({ title: "Success!", description: "Task added successfully!" })
      }

      setNewTaskName("")
      setNewTaskDescription("")
      setNewTaskArmadollars("")
      await loadData()
    } catch (err) {
      console.error("Error adding/updating task:", err)
      toast({ title: "Error", description: `Failed to save task: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTaskName(task.name)
    setNewTaskDescription(task.description || "")
    setNewTaskArmadollars(task.armadollars.toString())
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)
      if (error) throw error
      toast({ title: "Success!", description: "Task deleted successfully!" })
      await loadData()
    } catch (err) {
      console.error("Error deleting task:", err)
      toast({ title: "Error", description: `Failed to delete task: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddReward = async () => {
    if (!newRewardName || !newRewardDescription || !newRewardCost) {
      toast({ title: "Missing Information", description: "Please fill all reward fields.", variant: "destructive" })
      return
    }
    const cost = Number.parseInt(newRewardCost)
    if (isNaN(cost) || cost <= 0) {
      toast({
        title: "Invalid Cost",
        description: "Reward cost must be a positive number.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (editingReward) {
        const { error } = await supabase
          .from("rewards")
          .update({
            name: newRewardName,
            description: newRewardDescription,
            cost: cost,
            emoji: newRewardEmoji || "🎁",
          })
          .eq("id", editingReward.id)
        if (error) throw error
        toast({ title: "Success!", description: "Reward updated successfully!" })
        setEditingReward(null)
      } else {
        const { error } = await supabase.from("rewards").insert({
          name: newRewardName,
          description: newRewardDescription,
          cost: cost,
          emoji: newRewardEmoji || "🎁",
          created_by: user.id,
        })
        if (error) throw error
        toast({ title: "Success!", description: "Reward added successfully!" })
      }

      setNewRewardName("")
      setNewRewardDescription("")
      setNewRewardCost("")
      setNewRewardEmoji("")
      await loadData()
    } catch (err) {
      console.error("Error adding/updating reward:", err)
      toast({ title: "Error", description: `Failed to save reward: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward)
    setNewRewardName(reward.name)
    setNewRewardDescription(reward.description)
    setNewRewardCost(reward.cost.toString())
    setNewRewardEmoji(reward.emoji)
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("rewards").update({ active: false }).eq("id", rewardId)
      if (error) throw error
      toast({ title: "Success!", description: "Reward deactivated successfully!" })
      await loadData()
    } catch (err) {
      console.error("Error deactivating reward:", err)
      toast({ title: "Error", description: `Failed to deactivate reward: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRedemption = async (redemptionId: string, adminNotes = "") => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("redemptions")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", redemptionId)
      if (error) throw error

      toast({ title: "Success!", description: "Redemption approved!" })
      await loadData()
    } catch (err) {
      console.error("Error approving redemption:", err)
      toast({ title: "Error", description: `Failed to approve redemption: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDenyRedemption = async (redemptionId: string, adminNotes = "") => {
    setLoading(true)
    try {
      // Get the redemption details to refund the Armadollars
      const { data: redemption, error: fetchError } = await supabase
        .from("redemptions")
        .select("employee_id, cost")
        .eq("id", redemptionId)
        .single()

      if (fetchError) throw fetchError

      // Refund the Armadollars (unless it's Sabrina with unlimited currency)
      const { data: employee, error: employeeFetchError } = await supabase
        .from("employees")
        .select("armadollars, name")
        .eq("id", redemption.employee_id)
        .single()

      if (employeeFetchError) throw employeeFetchError

      // Check if it's Sabrina (unlimited currency)
      const isSabrina =
        employee.name?.toLowerCase().includes("sabrina") && employee.name?.toLowerCase().includes("wofford")

      if (!isSabrina) {
        const { error: refundError } = await supabase
          .from("employees")
          .update({ armadollars: employee.armadollars + redemption.cost })
          .eq("id", redemption.employee_id)

        if (refundError) throw refundError
      }

      // Update redemption status
      const { error } = await supabase
        .from("redemptions")
        .update({
          status: "denied",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", redemptionId)
      if (error) throw error

      toast({
        title: "Success!",
        description: isSabrina
          ? "Redemption denied (no refund needed for unlimited currency)!"
          : "Redemption denied and Armadollars refunded!",
      })
      await loadData()
      loadInitialData() // Refresh user data
    } catch (err) {
      console.error("Error denying redemption:", err)
      toast({ title: "Error", description: `Failed to deny redemption: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplaintResolved = async (complaintId: string) => {
    if (!confirm("Are you sure you want to mark this complaint as resolved?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("complaints").update({ status: "resolved" }).eq("id", complaintId)
      if (error) throw error
      toast({ title: "Success!", description: "Complaint marked as resolved!" })
      await loadData()
    } catch (err) {
      console.error("Error resolving complaint:", err)
      toast({ title: "Error", description: `Failed to resolve complaint: ${err.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleViewComplaint = (complaint: Complaint) => {
    setViewingComplaint(complaint)
    setIsViewComplaintDialogOpen(true)
  }

  const handleViewRedemption = (redemption: Redemption) => {
    setViewingRedemption(redemption)
    setIsViewRedemptionDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full text-roadhouseBlack">Loading Admin Dashboard...</div>
  }

  if (error) {
    return (
      <div className="text-roadhouseRed text-center p-4 font-bold">
        <p>{error}</p>
        <Button onClick={loadData} className="mt-4 bg-roadhouseRed text-roadhouseWhite">
          Retry Loading
        </Button>
      </div>
    )
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-roadhouseRed text-center p-4 font-bold">
        Access Denied: You must be an admin to view this page.
      </div>
    )
  }

  const pendingRedemptions = redemptions.filter((r) => r.status === "pending").length
  const pendingPasswordResets = passwordResets.length

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-roadhouseRed text-center">Admin Dashboard</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-roadhouseRed/10 text-roadhouseBlack">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bonus">Give Bonus</TabsTrigger>
          <TabsTrigger value="tasks">Manage Tasks</TabsTrigger>
          <TabsTrigger value="rewards">Manage Rewards</TabsTrigger>
          <TabsTrigger value="redemptions">
            <Bell className="mr-2 h-4 w-4" />
            Redemptions {pendingRedemptions > 0 && `(${pendingRedemptions})`}
          </TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="password-resets">
            Password Resets {pendingPasswordResets > 0 && `(${pendingPasswordResets})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
              <h4 className="font-bold mb-2 text-roadhouseBlack">👥 Total Employees</h4>
              <p className="text-3xl font-bold text-roadhouseRed">{employees.length}</p>
            </Card>
            <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
              <h4 className="font-bold mb-2 text-roadhouseBlack">🎯 Active Tasks</h4>
              <p className="text-3xl font-bold text-roadhouseRed">{tasks.length}</p>
            </Card>
            <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
              <h4 className="font-bold mb-2 text-roadhouseBlack">🎁 Active Rewards</h4>
              <p className="text-3xl font-bold text-roadhouseRed">{rewards.filter((r) => r.active).length}</p>
            </Card>
            <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
              <h4 className="font-bold mb-2 text-roadhouseBlack">⏳ Pending Approvals</h4>
              <p className="text-3xl font-bold text-roadhouseRed">{pendingRedemptions}</p>
            </Card>
          </div>

          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Employee Overview</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Current Armadollars balance for all employees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-roadhouseYellow/20">
                    <TableHead className="text-roadhouseBlack">Name</TableHead>
                    <TableHead className="text-roadhouseBlack">Role</TableHead>
                    <TableHead className="text-roadhouseBlack text-right">Armadollars</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell className="text-right">
                        {employee.name?.toLowerCase().includes("sabrina") &&
                        employee.name?.toLowerCase().includes("wofford")
                          ? "∞ (Unlimited)"
                          : employee.armadollars.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonus" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Award Bonus Armadollars</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Quickly give Armadollars to an employee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-select" className="text-roadhouseBlack">
                  Select Employee
                </Label>
                <select
                  id="employee-select"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-roadhouseRed bg-roadhouseWhite px-3 py-2 text-sm ring-offset-roadhouseWhite file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-roadhouseBlack/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roadhouseYellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus-amount" className="text-roadhouseBlack">
                  Amount
                </Label>
                <Input
                  id="bonus-amount"
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="e.g., 10.00"
                  className="border-roadhouseRed focus:border-roadhouseYellow"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus-reason" className="text-roadhouseBlack">
                  Reason
                </Label>
                <Textarea
                  id="bonus-reason"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="e.g., Excellent customer service"
                  className="border-roadhouseRed focus:border-roadhouseYellow"
                />
              </div>
              <Button
                onClick={handleGiveBonus}
                className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
              >
                Give Bonus
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Manage Tasks</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Add, edit, or delete tasks available for employees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-roadhouseBlack">
                  {editingTask ? "Edit Task" : "Add New Task"}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="task-name" className="text-roadhouseBlack">
                    Task Name
                  </Label>
                  <Input
                    id="task-name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="e.g., Clean restrooms"
                    className="border-roadhouseRed focus:border-roadhouseYellow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description" className="text-roadhouseBlack">
                    Description
                  </Label>
                  <Textarea
                    id="task-description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Detailed description of the task"
                    className="border-roadhouseRed focus:border-roadhouseYellow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-armadollars" className="text-roadhouseBlack">
                    Armadollars Awarded
                  </Label>
                  <Input
                    id="task-armadollars"
                    type="number"
                    value={newTaskArmadollars}
                    onChange={(e) => setNewTaskArmadollars(e.target.value)}
                    placeholder="e.g., 5.00"
                    className="border-roadhouseRed focus:border-roadhouseYellow"
                  />
                </div>
                <Button
                  onClick={handleAddTask}
                  className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                >
                  {editingTask ? "Update Task" : "Add Task"}
                </Button>
                {editingTask && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTask(null)
                      setNewTaskName("")
                      setNewTaskDescription("")
                      setNewTaskArmadollars("")
                    }}
                    className="w-full mt-2 border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-roadhouseBlack">Existing Tasks</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-roadhouseYellow/20">
                      <TableHead className="text-roadhouseBlack">Name</TableHead>
                      <TableHead className="text-roadhouseBlack">Armadollars</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>{task.armadollars.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="border-roadhouseYellow text-roadhouseYellow hover:bg-roadhouseYellow/10"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Manage Rewards</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Add, edit, or remove rewards that employees can redeem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-roadhouseBlack">
                  {editingReward ? "Edit Reward" : "Add New Reward"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reward-name" className="text-roadhouseBlack">
                      Reward Name
                    </Label>
                    <Input
                      id="reward-name"
                      value={newRewardName}
                      onChange={(e) => setNewRewardName(e.target.value)}
                      placeholder="e.g., Free Meal"
                      className="border-roadhouseRed focus:border-roadhouseYellow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward-cost" className="text-roadhouseBlack">
                      Cost (Armadollars)
                    </Label>
                    <Input
                      id="reward-cost"
                      type="number"
                      value={newRewardCost}
                      onChange={(e) => setNewRewardCost(e.target.value)}
                      placeholder="e.g., 50"
                      className="border-roadhouseRed focus:border-roadhouseYellow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reward-emoji" className="text-roadhouseBlack">
                      Emoji
                    </Label>
                    <Input
                      id="reward-emoji"
                      value={newRewardEmoji}
                      onChange={(e) => setNewRewardEmoji(e.target.value)}
                      placeholder="e.g., 🍔"
                      className="border-roadhouseRed focus:border-roadhouseYellow"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reward-description" className="text-roadhouseBlack">
                    Description
                  </Label>
                  <Textarea
                    id="reward-description"
                    value={newRewardDescription}
                    onChange={(e) => setNewRewardDescription(e.target.value)}
                    placeholder="Detailed description of the reward"
                    className="border-roadhouseRed focus:border-roadhouseYellow"
                  />
                </div>
                <Button
                  onClick={handleAddReward}
                  className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {editingReward ? "Update Reward" : "Add Reward"}
                </Button>
                {editingReward && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingReward(null)
                      setNewRewardName("")
                      setNewRewardDescription("")
                      setNewRewardCost("")
                      setNewRewardEmoji("")
                    }}
                    className="w-full mt-2 border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-roadhouseBlack">Existing Rewards</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-roadhouseYellow/20">
                      <TableHead className="text-roadhouseBlack">Reward</TableHead>
                      <TableHead className="text-roadhouseBlack">Cost</TableHead>
                      <TableHead className="text-roadhouseBlack">Status</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell className="font-medium">
                          {reward.emoji} {reward.name}
                        </TableCell>
                        <TableCell>{reward.cost} 🪙</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              reward.active
                                ? "bg-roadhouseGreen/20 text-roadhouseGreen"
                                : "bg-roadhouseRed/20 text-roadhouseRed"
                            }`}
                          >
                            {reward.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditReward(reward)}
                              className="border-roadhouseYellow text-roadhouseYellow hover:bg-roadhouseYellow/10"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {reward.active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteReward(reward.id)}
                                className="border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Deactivate</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redemptions" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Reward Redemptions</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Approve or deny employee reward redemptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {redemptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-roadhouseBlack">No redemptions yet.</p>
                  <p className="text-sm text-gray-600">Redemptions will appear here when employees cash out rewards.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-roadhouseYellow/20">
                      <TableHead className="text-roadhouseBlack">Employee</TableHead>
                      <TableHead className="text-roadhouseBlack">Reward</TableHead>
                      <TableHead className="text-roadhouseBlack">Cost</TableHead>
                      <TableHead className="text-roadhouseBlack">Status</TableHead>
                      <TableHead className="text-roadhouseBlack">Date</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redemptions.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell className="font-medium">{redemption.employee_name}</TableCell>
                        <TableCell>{redemption.reward_name}</TableCell>
                        <TableCell>{redemption.cost} 🪙</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{new Date(redemption.redeemed_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewRedemption(redemption)}
                              className="border-roadhouseYellow text-roadhouseYellow hover:bg-roadhouseYellow/10"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            {redemption.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveRedemption(redemption.id)}
                                  className="border-roadhouseGreen text-roadhouseGreen hover:bg-roadhouseGreen/10"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDenyRedemption(redemption.id)}
                                  className="border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="sr-only">Deny</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Employee Complaints</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Review and manage complaints submitted by employees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-roadhouseBlack">No complaints submitted.</p>
                  <p className="text-sm text-gray-600">Employee complaints will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-roadhouseYellow/20">
                      <TableHead className="text-roadhouseBlack">Employee</TableHead>
                      <TableHead className="text-roadhouseBlack">Category</TableHead>
                      <TableHead className="text-roadhouseBlack">Subject</TableHead>
                      <TableHead className="text-roadhouseBlack">Status</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">{complaint.employee_name}</TableCell>
                        <TableCell>{complaint.category}</TableCell>
                        <TableCell>{complaint.subject}</TableCell>
                        <TableCell>
                          {complaint.status === "resolved" ? (
                            <span className="text-roadhouseGreen flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" /> Resolved
                            </span>
                          ) : (
                            <span className="text-roadhouseRed flex items-center">
                              <XCircle className="h-4 w-4 mr-1" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewComplaint(complaint)}
                              className="border-roadhouseYellow text-roadhouseYellow hover:bg-roadhouseYellow/10"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            {complaint.status !== "resolved" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkComplaintResolved(complaint.id)}
                                className="border-roadhouseGreen text-roadhouseGreen hover:bg-roadhouseGreen/10"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Resolve</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password-resets" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Password Reset Requests</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Handle employee password reset requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordResets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-roadhouseBlack">No password reset requests.</p>
                  <p className="text-sm text-gray-600">Employee password reset requests will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-roadhouseYellow/20">
                      <TableHead className="text-roadhouseBlack">Employee</TableHead>
                      <TableHead className="text-roadhouseBlack">Requested</TableHead>
                      <TableHead className="text-roadhouseBlack">Status</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passwordResets.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.employee_name}</TableCell>
                        <TableCell>{new Date(request.requested_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-roadhouseYellow flex items-center">
                            <Clock className="h-4 w-4 mr-1" /> Pending
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Password Reset",
                                description: `Contact ${request.employee_name} to reset their password manually.`,
                              })
                            }}
                            className="border-roadhouseGreen text-roadhouseGreen hover:bg-roadhouseGreen/10"
                          >
                            Contact Employee
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Complaint Dialog */}
      <Dialog open={isViewComplaintDialogOpen} onOpenChange={setIsViewComplaintDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-roadhouseWhite text-roadhouseBlack border-roadhouseRed">
          <DialogHeader>
            <DialogTitle className="text-roadhouseRed">Complaint Details</DialogTitle>
            <DialogDescription className="text-roadhouseBlack">
              Review the full details of the complaint.
            </DialogDescription>
          </DialogHeader>
          {viewingComplaint && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Employee:</Label>
                <span className="col-span-3">{viewingComplaint.employee_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Category:</Label>
                <span className="col-span-3">{viewingComplaint.category}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Subject:</Label>
                <span className="col-span-3">{viewingComplaint.subject}</span>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right font-bold">Details:</Label>
                <span className="col-span-3 whitespace-pre-wrap">{viewingComplaint.details}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Status:</Label>
                <span className="col-span-3 capitalize">{viewingComplaint.status}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Date:</Label>
                <span className="col-span-3">{new Date(viewingComplaint.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setIsViewComplaintDialogOpen(false)}
              className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Redemption Dialog */}
      <Dialog open={isViewRedemptionDialogOpen} onOpenChange={setIsViewRedemptionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-roadhouseWhite text-roadhouseBlack border-roadhouseRed">
          <DialogHeader>
            <DialogTitle className="text-roadhouseRed">Redemption Details</DialogTitle>
            <DialogDescription className="text-roadhouseBlack">
              Review and manage this redemption request.
            </DialogDescription>
          </DialogHeader>
          {viewingRedemption && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Employee:</Label>
                <span className="col-span-3">{viewingRedemption.employee_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Reward:</Label>
                <span className="col-span-3">{viewingRedemption.reward_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Cost:</Label>
                <span className="col-span-3">{viewingRedemption.cost} 🪙</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Status:</Label>
                <span className="col-span-3 capitalize">{viewingRedemption.status}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold">Requested:</Label>
                <span className="col-span-3">{new Date(viewingRedemption.redeemed_at).toLocaleString()}</span>
              </div>
              {viewingRedemption.approved_at && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-bold">Processed:</Label>
                  <span className="col-span-3">{new Date(viewingRedemption.approved_at).toLocaleString()}</span>
                </div>
              )}
              {viewingRedemption.admin_notes && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-bold">Admin Notes:</Label>
                  <span className="col-span-3 whitespace-pre-wrap">{viewingRedemption.admin_notes}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {viewingRedemption?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    handleApproveRedemption(viewingRedemption.id)
                    setIsViewRedemptionDialogOpen(false)
                  }}
                  className="bg-roadhouseGreen text-roadhouseWhite hover:bg-roadhouseGreen/80"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    handleDenyRedemption(viewingRedemption.id)
                    setIsViewRedemptionDialogOpen(false)
                  }}
                  className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny & Refund
                </Button>
              </>
            )}
            <Button
              onClick={() => setIsViewRedemptionDialogOpen(false)}
              variant="outline"
              className="border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
