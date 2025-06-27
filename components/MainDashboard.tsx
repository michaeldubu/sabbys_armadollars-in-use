"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { CheckCircle, Trophy, Star, Users, Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const supabase = createClientComponentClient()

const AVAILABLE_ROLES = [
  "Server",
  "Host/Hostess",
  "Bartender",
  "Cook",
  "Prep Cook",
  "Dishwasher",
  "Busser",
  "Food Runner",
  "Shift Leader",
  "Assistant Manager",
  "Manager",
  "General Manager",
  "Admin",
  "Key Personnel",
  "Trainer",
  "Maintenance",
  "Security",
  "Other",
]

type Employee = {
  id: string
  name: string
  role: string
  armadollars: number
  email?: string
  password?: string
  active: boolean
  streak: number
}

type Task = {
  id: string
  name: string
  armadollars: number
  description?: string
  category?: string
}

type Achievement = {
  id: string
  employee_id: string
  achievement_type: string
  title: string
  description: string
  armadollars_awarded: number
  created_at: string
  employee_name?: string
}

interface MainDashboardProps {
  user: Employee
  setUser: (user: Employee) => void
  loadInitialData: () => Promise<void>
}

export default function MainDashboard({ user, setUser, loadInitialData }: MainDashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  // Employee Management State
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeRole, setNewEmployeeRole] = useState("")
  const [newEmployeePassword, setNewEmployeePassword] = useState("")
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false)

  // Task Completion State
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

  // Auto-refresh user data every 30 seconds to stay in sync
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user?.id) {
        try {
          const { data: freshUser, error } = await supabase.from("employees").select("*").eq("id", user.id).single()

          if (!error && freshUser) {
            setUser(freshUser)
            localStorage.setItem("armadollars_user", JSON.stringify(freshUser))
          }
        } catch (error) {
          console.error("Error refreshing user data:", error)
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user?.id, setUser])

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("employees").select("*").eq("active", true)
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast({ title: "Error", description: "Failed to load employees.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("tasks").select("*")
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast({ title: "Error", description: "Failed to load tasks.", variant: "destructive" })
      return []
    }
  }, [toast])

  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select(`*, employees (name)`)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error
      return (data || []).map((achievement) => ({
        ...achievement,
        employee_name: achievement.employees ? achievement.employees.name : "Unknown",
      }))
    } catch (error) {
      console.error("Error fetching achievements:", error)
      toast({ title: "Error", description: "Failed to load achievements.", variant: "destructive" })
      return []
    }
  }, [toast])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [employeesData, tasksData, achievementsData] = await Promise.all([
        fetchEmployees(),
        fetchTasks(),
        fetchAchievements(),
      ])
      setEmployees(employeesData)
      setTasks(tasksData)
      setAchievements(achievementsData)
    } catch (err) {
      console.error("Error loading dashboard data:", err)
      setError("Failed to load dashboard data.")
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [fetchEmployees, fetchTasks, fetchAchievements, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCompleteTask = async (task: Task) => {
    if (!user) return

    setCompletingTaskId(task.id)
    try {
      // Update user's Armadollars
      const newArmadollars = user.armadollars + task.armadollars
      const { error: updateError } = await supabase
        .from("employees")
        .update({ armadollars: newArmadollars })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Record achievement
      const { error: achievementError } = await supabase.from("achievements").insert({
        employee_id: user.id,
        achievement_type: "task_completion",
        title: task.name,
        description: task.description || `Completed task: ${task.name}`,
        armadollars_awarded: task.armadollars,
      })

      if (achievementError) throw achievementError

      // Update local user state
      const updatedUser = { ...user, armadollars: newArmadollars }
      setUser(updatedUser)
      localStorage.setItem("armadollars_user", JSON.stringify(updatedUser))

      toast({
        title: "Task Completed!",
        description: `You earned ${task.armadollars} Armadollars for completing "${task.name}"!`,
      })

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E13223", "#FFDD02", "#439539"],
      })

      // Reload data to refresh achievements
      await loadData()
      await loadInitialData()
    } catch (err) {
      console.error("Error completing task:", err)
      toast({
        title: "Error",
        description: `Failed to complete task: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeRole || !newEmployeePassword.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields (name, role, and password).",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            name: newEmployeeName.trim(),
            role: newEmployeeRole,
            password: newEmployeePassword.trim(),
          })
          .eq("id", editingEmployee.id)

        if (error) throw error
        toast({ title: "Success!", description: "Employee updated successfully!" })
        setEditingEmployee(null)
      } else {
        // Add new employee
        const { error } = await supabase.from("employees").insert({
          name: newEmployeeName.trim(),
          role: newEmployeeRole,
          password: newEmployeePassword.trim(),
          armadollars: 0,
          active: true,
          streak: 0,
        })

        if (error) throw error
        toast({ title: "Success!", description: "Employee added successfully!" })
      }

      setNewEmployeeName("")
      setNewEmployeeRole("")
      setNewEmployeePassword("")
      setIsAddEmployeeDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error("Error adding/updating employee:", err)
      toast({
        title: "Error",
        description: `Failed to save employee: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setNewEmployeeName(employee.name)
    setNewEmployeeRole(employee.role)
    setNewEmployeePassword(employee.password || "")
    setIsAddEmployeeDialogOpen(true)
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("employees").update({ active: false }).eq("id", employeeId)
      if (error) throw error
      toast({ title: "Success!", description: "Employee deactivated successfully!" })
      await loadData()
    } catch (err) {
      console.error("Error deactivating employee:", err)
      toast({
        title: "Error",
        description: `Failed to deactivate employee: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full text-roadhouseBlack">Loading Dashboard...</div>
  }

  if (error) {
    return <div className="text-roadhouseRed text-center p-4 font-bold">{error}</div>
  }

  const topPerformers = employees
    .filter((emp) => ["Server", "Bartender", "Cook", "Host/Hostess", "Food Runner"].includes(emp.role))
    .sort((a, b) => b.armadollars - a.armadollars)
    .slice(0, 5)

  const canManageEmployees = user?.role === "admin" || user?.role === "Manager" || user?.role === "General Manager"
  const canCreateTasks = user?.role === "admin" || user?.role === "Manager" || user?.role === "General Manager"

  return (
    <div className="p-4 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-r from-roadhouseRed to-roadhouseYellow text-roadhouseWhite shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Welcome back, {user?.name}! 🤠</CardTitle>
            <p className="text-xl">
              You have <span className="font-bold text-roadhouseWhite">{user?.armadollars?.toFixed(2) || "0.00"}</span>{" "}
              Armadollars! 🪙
            </p>
            <p className="text-sm opacity-90">Role: {user?.role}</p>
          </CardHeader>
        </Card>
      </motion.div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-roadhouseRed/10 text-roadhouseBlack">
          <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="achievements">Recent Achievements</TabsTrigger>
          {canManageEmployees && <TabsTrigger value="employees">Manage Employees</TabsTrigger>}
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed flex items-center gap-2">
                <Star className="h-5 w-5" />
                Available Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-roadhouseBlack">No tasks available at the moment.</p>
                  <p className="text-sm text-gray-600">Check back later for new tasks!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 rounded-lg border-2 border-roadhouseYellow bg-roadhouseWhite/70 shadow-sm"
                    >
                      <h3 className="font-bold text-lg text-roadhouseBlack mb-2">{task.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-roadhouseGreen text-roadhouseWhite">+{task.armadollars} Armadollars</Badge>
                        <Button
                          onClick={() => handleCompleteTask(task)}
                          disabled={completingTaskId === task.id}
                          className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                        >
                          {completingTaskId === task.id ? "Completing..." : "Complete"}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-roadhouseYellow/20">
                    <TableHead className="text-roadhouseBlack">Rank</TableHead>
                    <TableHead className="text-roadhouseBlack">Name</TableHead>
                    <TableHead className="text-roadhouseBlack">Role</TableHead>
                    <TableHead className="text-roadhouseBlack text-right">Armadollars</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.map((employee, index) => (
                    <TableRow key={employee.id} className={index < 3 ? "bg-roadhouseYellow/10" : ""}>
                      <TableCell className="font-medium">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && `#${index + 1}`}
                      </TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell className="text-right font-bold">
                        {employee.name?.toLowerCase().includes("sabrina") &&
                        employee.name?.toLowerCase().includes("wofford")
                          ? "∞"
                          : employee.armadollars.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-roadhouseBlack">No achievements yet.</p>
                  <p className="text-sm text-gray-600">Complete tasks to earn achievements!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-3 bg-roadhouseYellow/10 rounded-lg border border-roadhouseYellow"
                    >
                      <div>
                        <p className="font-medium text-roadhouseBlack">{achievement.title}</p>
                        <p className="text-sm text-gray-600">
                          {achievement.employee_name} • {new Date(achievement.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                      </div>
                      <Badge className="bg-roadhouseGreen text-roadhouseWhite">
                        +{achievement.armadollars_awarded} 🪙
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canManageEmployees && (
          <TabsContent value="employees" className="mt-4">
            <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
              <CardHeader>
                <CardTitle className="text-roadhouseRed flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manage Employees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-roadhouseBlack">Employee List</h3>
                  <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-roadhouseWhite border-2 border-roadhouseRed">
                      <DialogHeader>
                        <DialogTitle className="text-roadhouseRed">
                          {editingEmployee ? "Edit Employee" : "Add New Employee"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="employee-name" className="text-roadhouseBlack">
                            Employee Name
                          </Label>
                          <Input
                            id="employee-name"
                            value={newEmployeeName}
                            onChange={(e) => setNewEmployeeName(e.target.value)}
                            placeholder="Enter employee name"
                            className="border-roadhouseRed focus:border-roadhouseYellow"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employee-role" className="text-roadhouseBlack">
                            Role
                          </Label>
                          <select
                            id="employee-role"
                            value={newEmployeeRole}
                            onChange={(e) => setNewEmployeeRole(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-roadhouseRed bg-roadhouseWhite px-3 py-2 text-sm ring-offset-roadhouseWhite file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-roadhouseBlack/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roadhouseYellow focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">-- Select a role --</option>
                            {AVAILABLE_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employee-password" className="text-roadhouseBlack">
                            Password
                          </Label>
                          <Input
                            id="employee-password"
                            type="password"
                            value={newEmployeePassword}
                            onChange={(e) => setNewEmployeePassword(e.target.value)}
                            placeholder="Enter password"
                            className="border-roadhouseRed focus:border-roadhouseYellow"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddEmployeeDialogOpen(false)
                            setEditingEmployee(null)
                            setNewEmployeeName("")
                            setNewEmployeeRole("")
                            setNewEmployeePassword("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddEmployee}
                          className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                        >
                          {editingEmployee ? "Update Employee" : "Add Employee"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-roadhouseYellow/20">
                      <TableHead className="text-roadhouseBlack">Name</TableHead>
                      <TableHead className="text-roadhouseBlack">Role</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Armadollars</TableHead>
                      <TableHead className="text-roadhouseBlack text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                              className="border-roadhouseYellow text-roadhouseYellow hover:bg-roadhouseYellow/10"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="border-roadhouseRed text-roadhouseRed hover:bg-roadhouseRed/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Deactivate</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
