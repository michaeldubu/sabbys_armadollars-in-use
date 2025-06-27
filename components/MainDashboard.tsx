"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Users, Trophy, Calendar, Plus, Target, CheckCircle, XCircle, DollarSign } from "lucide-react"
import confetti from "canvas-confetti"
import { useToast } from "@/hooks/use-toast"
import AdminDashboard from "./AdminDashboard"
import { motion } from "framer-motion"

const supabase = createClientComponentClient()

const ROLE_OPTIONS = [
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

export default function MainDashboard({ user, setUser, onLogout }) {
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeRole, setNewEmployeeRole] = useState("")
  const [newEmployeePassword, setNewEmployeePassword] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskReward, setNewTaskReward] = useState("")
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editEmployeeName, setEditEmployeeName] = useState("")
  const [editEmployeeRole, setEditEmployeeRole] = useState("")
  const [editEmployeePassword, setEditEmployeePassword] = useState("")
  const [editEmployeeArmadollars, setEditEmployeeArmadollars] = useState("")
  const { toast } = useToast()
  const [schedules, setSchedules] = useState([])
  const [taskCompletions, setTaskCompletions] = useState([])
  const [error, setError] = useState("")

  // Refresh user data periodically to keep it in sync
  useEffect(() => {
    const refreshUserData = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase.from("employees").select("*").eq("id", user.id).single()

          if (!error && data) {
            setUser(data)
            localStorage.setItem("armadollars_user", JSON.stringify(data))
          }
        } catch (error) {
          console.error("Error refreshing user data:", error)
        }
      }
    }

    // Refresh every 30 seconds
    const interval = setInterval(refreshUserData, 30000)
    return () => clearInterval(interval)
  }, [user?.id, setUser])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("active", true)
        .order("armadollars", { ascending: false })

      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Load completed tasks
      const { data: completedTasksData, error: completedTasksError } = await supabase
        .from("task_completions")
        .select(`
          *,
          employees(name, role),
          tasks(title, reward_armadollars)
        `)
        .order("completed_at", { ascending: false })
        .limit(10)

      if (completedTasksError) throw completedTasksError
      setCompletedTasks(completedTasksData || [])

      // Calculate top performers
      const performers = (employeesData || [])
        .filter((emp) => emp.role !== "admin")
        .sort((a, b) => b.armadollars - a.armadollars)
        .slice(0, 5)
      setTopPerformers(performers)

      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(`
            *,
            employee:employees(name, role)
          `)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date, start_time")
      if (schedulesError) throw schedulesError

      const { data: completionsData, error: completionsError } = await supabase
        .from("task_completions")
        .select(`
            *,
            employee:employees(name),
            task:tasks(name, armadollars)
          `)
        .gte("completed_at", new Date().toISOString().split("T")[0])
      if (completionsError) throw completionsError

      setSchedules(schedulesData || [])
      setTaskCompletions(completionsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" })
      setEmployees([])
      setTasks([])
      setSchedules([])
      setTaskCompletions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    if (!newEmployeeName.trim() || !newEmployeeRole || !newEmployeePassword.trim()) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" })
      return
    }

    try {
      const { data, error } = await supabase
        .from("employees")
        .insert([
          {
            name: newEmployeeName.trim(),
            role: newEmployeeRole,
            password: newEmployeePassword.trim(),
            armadollars: 0,
            active: true,
            streak: 0,
            email: `${newEmployeeName.toLowerCase().replace(/\s+/g, ".")}@texasroadhouse.com`,
          },
        ])
        .select()

      if (error) throw error

      toast({ title: "Success", description: `Employee ${newEmployeeName} added successfully!` })
      setNewEmployeeName("")
      setNewEmployeeRole("")
      setNewEmployeePassword("")
      loadData()
    } catch (error) {
      console.error("Error adding employee:", error)
      toast({ title: "Error", description: "Failed to add employee.", variant: "destructive" })
    }
  }

  const handleEditEmployee = async (e) => {
    e.preventDefault()
    if (!editEmployeeName.trim() || !editEmployeeRole || !editEmployeePassword.trim()) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase
        .from("employees")
        .update({
          name: editEmployeeName.trim(),
          role: editEmployeeRole,
          password: editEmployeePassword.trim(),
          armadollars: Number.parseFloat(editEmployeeArmadollars) || 0,
        })
        .eq("id", editingEmployee.id)

      if (error) throw error

      toast({ title: "Success", description: "Employee updated successfully!" })
      setEditingEmployee(null)
      setEditEmployeeName("")
      setEditEmployeeRole("")
      setEditEmployeePassword("")
      setEditEmployeeArmadollars("")
      loadData()
    } catch (error) {
      console.error("Error updating employee:", error)
      toast({ title: "Error", description: "Failed to update employee.", variant: "destructive" })
    }
  }

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm("Are you sure you want to delete this employee?")) return

    try {
      const { error } = await supabase.from("employees").update({ active: false }).eq("id", employeeId)

      if (error) throw error

      toast({ title: "Success", description: "Employee deleted successfully!" })
      loadData()
    } catch (error) {
      console.error("Error deleting employee:", error)
      toast({ title: "Error", description: "Failed to delete employee.", variant: "destructive" })
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !newTaskDescription.trim() || !newTaskReward) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" })
      return
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim(),
            reward_armadollars: Number.parseFloat(newTaskReward),
            created_by: user.id,
            active: true,
          },
        ])
        .select()

      if (error) throw error

      toast({ title: "Success", description: "Task created successfully!" })
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskReward("")
      loadData()
    } catch (error) {
      console.error("Error creating task:", error)
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" })
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      // Check if user already completed this task today
      const today = new Date().toISOString().split("T")[0]
      const { data: existingCompletion } = await supabase
        .from("task_completions")
        .select("*")
        .eq("employee_id", user.id)
        .eq("task_id", taskId)
        .gte("completed_at", today)
        .single()

      if (existingCompletion) {
        toast({
          title: "Already Completed",
          description: "You've already completed this task today!",
          variant: "destructive",
        })
        return
      }

      // Add task completion
      const { error: completionError } = await supabase.from("task_completions").insert([
        {
          employee_id: user.id,
          task_id: taskId,
          completed_at: new Date().toISOString(),
        },
      ])

      if (completionError) throw completionError

      // Update user's armadollars
      const newArmadollars = user.armadollars + task.reward_armadollars
      const { error: updateError } = await supabase
        .from("employees")
        .update({ armadollars: newArmadollars })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Update user state and localStorage
      const updatedUser = { ...user, armadollars: newArmadollars }
      setUser(updatedUser)
      localStorage.setItem("armadollars_user", JSON.stringify(updatedUser))

      toast({ title: "Task Completed!", description: `You earned ${task.reward_armadollars} Armadollars!` })

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#E13223", "#FFDD02", "#439539"],
      })

      loadData()
    } catch (error) {
      console.error("Error completing task:", error)
      toast({ title: "Error", description: "Failed to complete task.", variant: "destructive" })
    }
  }

  const canManageEmployees = user?.role === "admin" || user?.role === "manager" || user?.role === "general manager"
  const canCreateTasks =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "general manager" ||
    user?.role === "shift leader"

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-roadhouseRed to-roadhouseYellow text-roadhouseWhite">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {user?.name}!</h2>
              <p className="text-roadhouseWhite/90">
                Role: {user?.role} | Current Balance: {user?.armadollars?.toFixed(2) || "0.00"} 🪙
              </p>
            </div>
            <Coins className="h-12 w-12 text-roadhouseWhite/80" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {canManageEmployees && <TabsTrigger value="employees">Manage Employees</TabsTrigger>}
          {canCreateTasks && <TabsTrigger value="create-tasks">Create Tasks</TabsTrigger>}
          {(user?.role === "manager" ||
            user?.role === "admin" ||
            user?.role === "general_manager" ||
            user?.role === "assistant_manager") && <TabsTrigger value="employeesOld">Employees</TabsTrigger>}
          {(user?.role === "manager" ||
            user?.role === "admin" ||
            user?.role === "general_manager" ||
            user?.role === "assistant_manager") && <TabsTrigger value="schedule">Schedule</TabsTrigger>}
          {user?.role === "admin" && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
        </TabsList>

        {/* Available Tasks */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Available Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tasks available at the moment.</p>
              ) : (
                <div className="grid gap-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg bg-roadhouseWhite/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-roadhouseBlack">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-roadhouseGreen text-roadhouseWhite">
                              {task.reward_armadollars} 🪙
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleCompleteTask(task.id)}
                          className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                        >
                          Complete Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <div className="grid gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((performer, index) => (
                    <div
                      key={performer.id}
                      className="flex items-center justify-between p-3 bg-roadhouseWhite/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                  ? "bg-amber-600"
                                  : "bg-roadhouseRed"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-roadhouseBlack">{performer.name}</p>
                          <p className="text-sm text-gray-600">{performer.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-roadhouseGreen">{performer.armadollars} 🪙</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Completions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recent Task Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedTasks.map((completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center justify-between p-2 bg-roadhouseWhite/30 rounded"
                    >
                      <div>
                        <p className="font-medium text-roadhouseBlack">{completion.employees?.name}</p>
                        <p className="text-sm text-gray-600">{completion.tasks?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-roadhouseGreen">+{completion.tasks?.reward_armadollars} 🪙</p>
                        <p className="text-xs text-gray-500">
                          {new Date(completion.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manage Employees */}
        {canManageEmployees && (
          <TabsContent value="employees">
            <div className="space-y-6">
              {/* Add New Employee */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Employee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="employee-name">Employee Name</Label>
                      <Input
                        id="employee-name"
                        value={newEmployeeName}
                        onChange={(e) => setNewEmployeeName(e.target.value)}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employee-role">Role</Label>
                      <Select value={newEmployeeRole} onValueChange={setNewEmployeeRole} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role.toLowerCase()}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employee-password">Password</Label>
                      <Input
                        id="employee-password"
                        type="password"
                        value={newEmployeePassword}
                        onChange={(e) => setNewEmployeePassword(e.target.value)}
                        placeholder="Initial password"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        className="w-full bg-roadhouseGreen text-roadhouseWhite hover:bg-roadhouseGreen/80"
                      >
                        Add Employee
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Employee List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Employees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Armadollars</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.role}</Badge>
                          </TableCell>
                          <TableCell>{employee.armadollars} 🪙</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingEmployee(employee)
                                      setEditEmployeeName(employee.name)
                                      setEditEmployeeRole(employee.role)
                                      setEditEmployeePassword(employee.password || "")
                                      setEditEmployeeArmadollars(employee.armadollars.toString())
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Employee</DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleEditEmployee} className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-name">Name</Label>
                                      <Input
                                        id="edit-name"
                                        value={editEmployeeName}
                                        onChange={(e) => setEditEmployeeName(e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-role">Role</Label>
                                      <Select value={editEmployeeRole} onValueChange={setEditEmployeeRole} required>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ROLE_OPTIONS.map((role) => (
                                            <SelectItem key={role} value={role.toLowerCase()}>
                                              {role}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-password">Password</Label>
                                      <Input
                                        id="edit-password"
                                        type="password"
                                        value={editEmployeePassword}
                                        onChange={(e) => setEditEmployeePassword(e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-armadollars">Armadollars</Label>
                                      <Input
                                        id="edit-armadollars"
                                        type="number"
                                        step="0.01"
                                        value={editEmployeeArmadollars}
                                        onChange={(e) => setEditEmployeeArmadollars(e.target.value)}
                                        required
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button type="submit" className="flex-1">
                                        Save Changes
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingEmployee(null)}
                                        className="flex-1"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteEmployee(employee.id)}>
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Create Tasks */}
        {canCreateTasks && (
          <TabsContent value="create-tasks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Describe the task"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-reward">Armadollars Reward</Label>
                    <Input
                      id="task-reward"
                      type="number"
                      step="0.01"
                      value={newTaskReward}
                      onChange={(e) => setNewTaskReward(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80">
                    Create Task
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {(user?.role === "manager" ||
          user?.role === "admin" ||
          user?.role === "general_manager" ||
          user?.role === "assistant_manager") && (
          <TabsContent value="employeesOld" className="mt-4">
            <EmployeeManager />
          </TabsContent>
        )}
        {(user?.role === "manager" ||
          user?.role === "admin" ||
          user?.role === "general_manager" ||
          user?.role === "assistant_manager") && (
          <TabsContent value="schedule" className="mt-4">
            <ScheduleManager />
          </TabsContent>
        )}
        {user?.role === "admin" && (
          <TabsContent value="admin" className="mt-4">
            <AdminDashboard user={user} loadInitialData={loadData} />
          </TabsContent>
        )}
      </Tabs>
      <Button
        onClick={onLogout}
        className="mt-4 bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  )

  function EmployeeManager() {
    const [newEmployee, setNewEmployee] = useState({
      name: "",
      email: "",
      role: "server",
      phone: "",
      emergency_contact: "",
      emergency_phone: "",
      password: "",
    })

    const addEmployee = async () => {
      if (!newEmployee.name || !newEmployee.password) {
        toast({
          title: "Missing Information",
          description: "Employee name and password are required.",
          variant: "destructive",
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from("employees")
          .insert([{ ...newEmployee, armadollars: 0, streak: 0, active: true }])
          .select()

        if (error) throw error

        setEmployees([...employees, data[0]])
        setNewEmployee({
          name: "",
          email: "",
          role: "server",
          phone: "",
          emergency_contact: "",
          emergency_phone: "",
          password: "",
        })
        toast({ title: "Success!", description: `${newEmployee.name} has been added with login credentials.` })
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#E13223", "#FFDD02", "#439539"] })
        loadData()
      } catch (error) {
        console.error("Error adding employee:", error)
        toast({ title: "Error", description: "Failed to add employee.", variant: "destructive" })
      }
    }

    const updateEmployee = async (employeeId, updates) => {
      try {
        const { id, ...updateData } = updates
        const { error } = await supabase.from("employees").update(updateData).eq("id", employeeId)
        if (error) throw error

        setEmployees(employees.map((emp) => (emp.id === employeeId ? { ...emp, ...updateData } : emp)))
        setEditingEmployee(null)
        if (user && user.id === employeeId) setUser({ ...user, ...updateData })
        toast({ title: "Success!", description: "Employee information updated." })
      } catch (error) {
        console.error("Error updating employee:", error)
        toast({ title: "Error", description: "Failed to update employee.", variant: "destructive" })
      }
    }

    const awardBonus = async (employeeId, amount, reason) => {
      try {
        const employee = employees.find((emp) => emp.id === employeeId)
        if (!employee) {
          toast({ title: "Error", description: "Employee not found for bonus.", variant: "destructive" })
          return
        }
        const newArmadollars = employee.armadollars + amount
        const { error: updateError } = await supabase
          .from("employees")
          .update({ armadollars: newArmadollars })
          .eq("id", employeeId)
        if (updateError) throw updateError

        const { error: achievementError } = await supabase.from("achievements").insert([
          {
            employee_id: employeeId,
            achievement_type: "bonus",
            title: "Manager Bonus",
            description: reason,
            armadollars_awarded: amount,
          },
        ])
        if (achievementError) console.error("Error logging achievement:", achievementError)

        toast({ title: "Bonus Awarded!", description: `${employee.name} received ${amount} Armadollars.` })
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#E13223", "#FFDD02", "#439539"] })
        loadData()
      } catch (error) {
        console.error("Error awarding bonus:", error)
        toast({ title: "Error", description: "Failed to award bonus.", variant: "destructive" })
      }
    }

    const AVAILABLE_ROLES = [
      { value: "server", label: "Server" },
      { value: "host", label: "Host/Hostess" },
      { value: "bartender", label: "Bartender" },
      { value: "cook", label: "Cook" },
      { value: "prep", label: "Prep Cook" },
      { value: "dishwasher", label: "Dishwasher" },
      { value: "busser", label: "Busser" },
      { value: "food_runner", label: "Food Runner" },
      { value: "shift_leader", label: "Shift Leader" },
      { value: "assistant_manager", label: "Assistant Manager" },
      { value: "manager", label: "Manager" },
      { value: "general_manager", label: "General Manager" },
      { value: "admin", label: "Admin" },
      { value: "key", label: "Key Personnel" },
      { value: "trainer", label: "Trainer" },
      { value: "maintenance", label: "Maintenance" },
      { value: "security", label: "Security" },
      { value: "other", label: "Other" },
    ]

    return (
      <div className="space-y-6">
        <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
          <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-roadhouseRed">
              <Users className="h-5 w-5" />
              Add New Employee
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Full Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <Input
                placeholder="Email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                className="border border-roadhouseRed rounded px-3 py-2 h-10 bg-roadhouseWhite/50 text-roadhouseBlack"
              >
                {AVAILABLE_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Password"
                type="password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <Input
                placeholder="Phone Number"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <Input
                placeholder="Emergency Contact"
                value={newEmployee.emergency_contact}
                onChange={(e) => setNewEmployee({ ...newEmployee, emergency_contact: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <Input
                placeholder="Emergency Phone"
                value={newEmployee.emergency_phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, emergency_phone: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
            </div>
            <Button
              onClick={addEmployee}
              className="w-full mt-4 bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
            >
              <Users className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
          <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
            <CardTitle className="text-roadhouseRed">Team Management</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {employees.map((employee) => (
                <motion.div
                  key={employee.id}
                  className="flex items-center justify-between p-4 bg-roadhouseWhite/70 rounded-lg border border-roadhouseRed/20 shadow-sm"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-lg text-roadhouseBlack">{employee.name}</p>
                        <p className="text-sm text-gray-700 capitalize">
                          {AVAILABLE_ROLES.find((r) => r.value === employee.role)?.label || employee.role} •{" "}
                          {employee.armadollars} 🪙 • {employee.streak || 0} day streak
                        </p>
                        {employee.email && <p className="text-xs text-gray-600">{employee.email}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingEmployee(employee)}
                      className="bg-roadhouseYellow text-roadhouseBlack hover:bg-roadhouseYellow/80 text-sm px-3 py-1 border border-roadhouseRed"
                    >
                      <Users className="h-3 w-3" />
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => awardBonus(employee.id, 10, "Quick bonus for great work!")}
                        className="bg-roadhouseGreen text-roadhouseWhite hover:bg-roadhouseGreen/80 text-xs px-2 py-1 border border-roadhouseBlack"
                      >
                        +10
                      </Button>
                      <Button
                        onClick={() => awardBonus(employee.id, 25, "Exceptional service bonus!")}
                        className="bg-roadhouseGreen text-roadhouseWhite hover:bg-roadhouseGreen/80 text-xs px-2 py-1 border border-roadhouseBlack"
                      >
                        +25
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {editingEmployee && (
          <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
            <DialogContent className="bg-roadhouseWhite text-roadhouseBlack border-2 border-roadhouseRed">
              <DialogHeader>
                <DialogTitle className="text-roadhouseRed">Edit Employee: {editingEmployee.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-roadhouseBlack">Name</Label>
                    <Input
                      value={editingEmployee.name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Email</Label>
                    <Input
                      value={editingEmployee.email || ""}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Role</Label>
                    <select
                      value={editingEmployee.role}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                      className="w-full border border-roadhouseRed rounded px-3 py-2 bg-roadhouseWhite/70 h-10 text-roadhouseBlack"
                    >
                      {AVAILABLE_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Password</Label>
                    <Input
                      type="password"
                      value={editingEmployee.password || ""}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Armadollars</Label>
                    <Input
                      type="number"
                      value={editingEmployee.armadollars}
                      onChange={(e) =>
                        setEditingEmployee({ ...editingEmployee, armadollars: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Streak</Label>
                    <Input
                      type="number"
                      value={editingEmployee.streak || 0}
                      onChange={(e) =>
                        setEditingEmployee({ ...editingEmployee, streak: Number.parseInt(e.target.value) || 0 })
                      }
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Phone</Label>
                    <Input
                      value={editingEmployee.phone || ""}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Emergency Contact</Label>
                    <Input
                      value={editingEmployee.emergency_contact || ""}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, emergency_contact: e.target.value })}
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                  <div>
                    <Label className="text-roadhouseBlack">Emergency Phone</Label>
                    <Input
                      value={editingEmployee.emergency_phone || ""}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, emergency_phone: e.target.value })}
                      className="bg-roadhouseWhite/70 border-roadhouseRed"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateEmployee(editingEmployee.id, editingEmployee)}
                  className="w-full bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  function ScheduleManager() {
    const [newSchedule, setNewSchedule] = useState({
      employee_id: "",
      date: "",
      shift_type: "",
      start_time: "",
      end_time: "",
      notes: "",
    })

    const addSchedule = async () => {
      if (
        !newSchedule.employee_id ||
        !newSchedule.date ||
        !newSchedule.shift_type ||
        !newSchedule.start_time ||
        !newSchedule.end_time
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required schedule fields.",
          variant: "destructive",
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from("schedules")
          .insert([newSchedule])
          .select(`*, employee:employees(name, role)`)
        if (error) throw error

        setSchedules([...schedules, data[0]])
        setNewSchedule({ employee_id: "", date: "", shift_type: "", start_time: "", end_time: "", notes: "" })
        toast({ title: "Success!", description: "Schedule added." })
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#E13223", "#FFDD02", "#439539"] })
      } catch (error) {
        console.error("Error adding schedule:", error)
        toast({
          title: "Error",
          description: "Failed to add schedule. Employee may already be scheduled.",
          variant: "destructive",
        })
      }
    }

    const deleteSchedule = async (scheduleId) => {
      try {
        const { error } = await supabase.from("schedules").delete().eq("id", scheduleId)
        if (error) throw error
        setSchedules(schedules.filter((s) => s.id !== scheduleId))
        toast({ title: "Success!", description: "Schedule removed." })
      } catch (error) {
        console.error("Error deleting schedule:", error)
        toast({ title: "Error", description: "Failed to delete schedule.", variant: "destructive" })
      }
    }

    const exportSchedule = () => {
      const csvContent = [
        ["Employee", "Date", "Shift", "Start Time", "End Time", "Notes"],
        ...schedules.map((s) => [
          s.employee?.name || "Unknown",
          s.date,
          s.shift_type,
          s.start_time,
          s.end_time,
          s.notes || "",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `texas-roadhouse-schedule-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={exportSchedule}
            className="bg-roadhouseGreen text-roadhouseWhite hover:bg-roadhouseGreen/80 border-2 border-roadhouseBlack"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
          <Button
            onClick={loadData}
            className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
        <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
          <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-roadhouseRed">
              <Calendar className="h-5 w-5" />
              Add New Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <select
                value={newSchedule.employee_id}
                onChange={(e) => setNewSchedule({ ...newSchedule, employee_id: e.target.value })}
                className="border border-roadhouseRed rounded px-3 py-2 h-10 bg-roadhouseWhite/50 text-roadhouseBlack"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({ROLE_OPTIONS.find((r) => r.toLowerCase() === emp.role)?.toUpperCase() || emp.role})
                  </option>
                ))}
              </select>
              <Input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <select
                value={newSchedule.shift_type}
                onChange={(e) => setNewSchedule({ ...newSchedule, shift_type: e.target.value })}
                className="border border-roadhouseRed rounded px-3 py-2 h-10 bg-roadhouseWhite/50 text-roadhouseBlack"
              >
                <option value="">Shift Type</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="double">Double</option>
                <option value="opening">Opening</option>
                <option value="closing">Closing</option>
                <option value="mid">Mid</option>
              </select>
              <Input
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <Input
                type="time"
                value={newSchedule.end_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                className="border-roadhouseRed bg-roadhouseWhite/50"
              />
              <Button
                onClick={addSchedule}
                className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={newSchedule.notes}
              onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
              className="mt-4 border-roadhouseRed bg-roadhouseWhite/50"
            />
          </CardContent>
        </Card>
        <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
          <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
            <CardTitle className="text-roadhouseRed">Current Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No schedules found. Add some shifts above!</p>
              ) : (
                schedules.map((schedule) => (
                  <motion.div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 bg-roadhouseWhite/70 rounded-lg border border-roadhouseRed/20 shadow-sm"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div>
                      <p className="font-bold text-roadhouseBlack">{schedule.employee?.name || "Unknown Employee"}</p>
                      <p className="text-sm text-gray-700">
                        {schedule.date} • {schedule.shift_type} • {schedule.start_time} - {schedule.end_time}
                      </p>
                      {schedule.notes && <p className="text-xs text-gray-600 italic">{schedule.notes}</p>}
                    </div>
                    <Button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 text-sm px-3 py-1 border-2 border-roadhouseYellow"
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  function TaskManager() {
    const [newTask, setNewTask] = useState({ name: "", description: "", armadollars: 0, category: "general" })

    const addTask = async () => {
      if (!newTask.name || newTask.armadollars <= 0) {
        toast({
          title: "Invalid Task",
          description: "Task name and a positive Armadollar value are required.",
          variant: "destructive",
        })
        return
      }

      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert([{ ...newTask, created_by: user?.id, active: true }])
          .select()
        if (error) throw error

        setTasks([...tasks, data[0]])
        setNewTask({ name: "", description: "", armadollars: 0, category: "general" })
        toast({ title: "Success!", description: "New task has been added." })
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#E13223", "#FFDD02", "#439539"] })
        loadData()
      } catch (error) {
        console.error("Error adding task:", error)
        toast({ title: "Error", description: "Failed to add task.", variant: "destructive" })
      }
    }

    const completeTask = async (taskId) => {
      if (!user) return

      try {
        const task = tasks.find((t) => t.id === taskId)
        if (!task) {
          toast({ title: "Error", description: "Task not found.", variant: "destructive" })
          return
        }

        const { error: completionError } = await supabase
          .from("task_completions")
          .insert([{ employee_id: user.id, task_id: taskId, armadollars_earned: task.armadollars }])
        if (completionError) throw completionError

        const { error: employeeUpdateError } = await supabase
          .from("employees")
          .update({ armadollars: user.armadollars + task.armadollars })
          .eq("id", user.id)
        if (employeeUpdateError) throw employeeUpdateError

        setUser({ ...user, armadollars: user.armadollars + task.armadollars })
        toast({ title: "Task Completed!", description: `You earned ${task.armadollars} Armadollars!` })
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#E13223", "#FFDD02", "#439539"] })
        loadData()
      } catch (error) {
        console.error("Error completing task:", error)
        toast({
          title: "Error",
          description: "Task already completed today or an error occurred.",
          variant: "destructive",
        })
      }
    }

    const userCompletedToday = (taskId) => {
      return taskCompletions.some(
        (completion) =>
          completion.task_id === taskId &&
          completion.employee_id === user?.id &&
          new Date(completion.completed_at).toDateString() === new Date().toDateString(),
      )
    }

    return (
      <div className="space-y-6">
        {user &&
          (user.role === "manager" ||
            user.role === "admin" ||
            user.role === "general_manager" ||
            user.role === "assistant_manager") && (
            <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
              <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-roadhouseRed">
                  <DollarSign className="h-5 w-5" />
                  Create New Task
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Task Name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="border-roadhouseRed bg-roadhouseWhite/50"
                  />
                  <Input
                    type="number"
                    placeholder="Armadollars"
                    value={newTask.armadollars}
                    onChange={(e) => setNewTask({ ...newTask, armadollars: Number.parseInt(e.target.value) || 0 })}
                    className="border-roadhouseRed bg-roadhouseWhite/50"
                  />
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="border border-roadhouseRed rounded px-3 py-2 h-10 bg-roadhouseWhite/50 text-roadhouseBlack"
                  >
                    <option value="general">General</option>
                    <option value="howdy">Howdy</option>
                    <option value="engage">Engage</option>
                    <option value="arrive">Arrive</option>
                    <option value="respond">Respond</option>
                    <option value="thankyou">Thank You</option>
                    <option value="signature">Signature</option>
                    <option value="service">Service</option>
                    <option value="teamwork">Teamwork</option>
                    <option value="sales">Sales</option>
                    <option value="prep">Prep</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <Button
                    onClick={addTask}
                    className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80 border-2 border-roadhouseYellow"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                <Textarea
                  placeholder="Task Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="mt-4 border-roadhouseRed bg-roadhouseWhite/50"
                />
              </CardContent>
            </Card>
          )}
        <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
          <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-roadhouseRed">
              <DollarSign className="h-5 w-5" />
              Available Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-center text-roadhouseBlack">No tasks available at the moment. Check back later!</p>
              ) : (
                tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-roadhouseWhite/50 rounded-lg border border-roadhouseRed/20"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-lg text-roadhouseBlack">{task.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{task.category}</p>
                      {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-roadhouseYellow text-roadhouseBlack rounded-full font-bold">
                        +{task.armadollars} 🪙
                      </span>
                      {user &&
                        (user.role === "server" ||
                          user.role === "host" ||
                          user.role === "bartender" ||
                          user.role === "cook" ||
                          user.role === "prep" ||
                          user.role === "dishwasher" ||
                          user.role === "busser" ||
                          user.role === "food_runner") &&
                        (userCompletedToday(task.id) ? (
                          <span className="px-3 py-1 bg-roadhouseGreen text-roadhouseWhite rounded-full text-sm">
                            ✓ Done Today!
                          </span>
                        ) : (
                          <Button
                            onClick={() => completeTask(task.id)}
                            className="bg-roadhouseRed text-roadhouseWhite hover:bg-roadhouseRed/80"
                          >
                            Complete
                          </Button>
                        ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        {taskCompletions.length > 0 && (
          <Card className="bg-roadhouseWhite/90 border-2 border-roadhouseYellow shadow-lg">
            <CardHeader className="bg-roadhouseRed/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-roadhouseRed">
                <DollarSign className="h-5 w-5" />
                Today's Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {taskCompletions.map((completion) => (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between p-3 bg-roadhouseGreen/10 rounded-lg border border-roadhouseGreen/30"
                  >
                    <span className="font-medium text-roadhouseGreen">
                      {completion.employee?.name} completed "{completion.task?.name}"
                    </span>
                    <span className="text-roadhouseGreen font-bold">+{completion.task?.armadollars} 🪙</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
            <h4 className="font-bold mb-2 text-roadhouseBlack">📊 Total Employees</h4>
            <p className="text-3xl font-bold text-roadhouseRed">{employees.length}</p>
            <p className="text-sm text-gray-700">Active team members</p>
          </Card>
          <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
            <h4 className="font-bold mb-2 text-roadhouseBlack">🎯 Available Tasks</h4>
            <p className="text-3xl font-bold text-roadhouseRed">{tasks.length}</p>
            <p className="text-sm text-gray-700">Earning opportunities</p>
          </Card>
          <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
            <h4 className="font-bold mb-2 text-roadhouseBlack">📅 Scheduled Shifts</h4>
            <p className="text-3xl font-bold text-roadhouseRed">{schedules.length}</p>
            <p className="text-sm text-gray-700">Upcoming shifts</p>
          </Card>
          <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
            <h4 className="font-bold mb-2 text-roadhouseBlack">✅ Completions Today</h4>
            <p className="text-3xl font-bold text-roadhouseRed">{taskCompletions.length}</p>
            <p className="text-sm text-gray-700">Tasks completed</p>
          </Card>
        </div>
        <Card className="p-4 bg-roadhouseWhite/30 border-2 border-roadhouseYellow shadow-sm">
          <h4 className="font-bold mb-4 text-roadhouseBlack">🏆 Top Performers</h4>
          <div>
            {employees
              .filter((emp) =>
                ["server", "host", "bartender", "cook", "prep", "dishwasher", "busser", "food_runner"].includes(
                  emp.role,
                ),
              )
              .sort((a, b) => b.armadollars - a.armadollars)
              .slice(0, 5)
              .map((emp, index) => (
                <div key={emp.id} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-roadhouseBlack">
                    <span className="text-lg">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐"}
                    </span>
                    {emp.name} ({ROLE_OPTIONS.find((r) => r.toLowerCase() === emp.role)?.toUpperCase() || emp.role})
                  </span>
                  <span className="font-bold text-roadhouseRed">{emp.armadollars} 🪙</span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    )
  }
}
