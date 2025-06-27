"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Removed DialogTrigger as it's not used directly here
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import {
  Sparkles,
  Calendar,
  Users,
  Plus,
  Edit3,
  Trash2,
  Trophy,
  Zap,
  Download,
  RotateCcw,
  UserPlus,
  CalendarPlus,
  Save,
  RefreshCw,
  LogOutIcon as Logout,
} from "lucide-react"

// Supabase client
const supabase = createClientComponentClient()

// Production data with Supabase integration
export default function AndyArmadollarsProduction() {
  const [user, setUser] = useState(null)
  const [employees, setEmployees] = useState([])
  const [tasks, setTasks] = useState([])
  const [schedules, setSchedules] = useState([])
  const [taskCompletions, setTaskCompletions] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null) // Moved here for Dialog control

  // Load data from Supabase on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Mock data fallback when database tables don't exist
      const mockEmployees = [
        {
          id: 1,
          name: "Sabrina Wofford",
          role: "manager",
          armadollars: 100000,
          streak: 500,
          active: true,
          email: "admin@armadollars.app",
        },
        {
          id: 2,
          name: "Vicktoria Jergenson",
          role: "manager",
          armadollars: 75,
          streak: 3,
          active: true,
          email: "vicktoria@armadollars.app",
        },
        {
          id: 3,
          name: "admin",
          role: "admin",
          armadollars: 150,
          streak: 7,
          active: true,
          email: "bob@example.com",
        },
        {
          id: 4,
          name: "Alice Williams",
          role: "admin",
          armadollars: 200,
          streak: 10,
          active: true,
          email: "alice@example.com",
        },
      ]

      const mockTasks = [
        {
          id: 1,
          name: "Greet customers warmly",
          category: "service",
          armadollars: 1,
          active: true,
          description: "Welcome every guest with a smile",
        },
        {
          id: 2,
          name: "Upsell Smothered Mush",
          category: "sales",
          armadollars: 30,
          active: true,
          description: "Sale the most smothers in a shift",
        },
        {
          id: 3,
          name: "Clean section thoroughly",
          category: "cleaning",
          armadollars: 40,
          active: true,
          description: "Ensure full section is spotless",
        },
      ]

      try {
        // Try to load from Supabase first
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("*")
          .eq("active", true)
          .order("name")

        if (employeesError && employeesError.code === "PGRST116") {
          // Table doesn't exist, use mock data
          console.log("Database tables not found, using mock data")
          setEmployees(mockEmployees)
          setTasks(mockTasks)
          setSchedules([])
          setComplaints([])
          setTaskCompletions([])
          return
        }

        if (employeesError) throw employeesError

        // Load tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("active", true)
          .order("category, name")
        if (tasksError) throw tasksError

        // Load recent schedules
        const { data: schedulesData, error: schedulesError } = await supabase
          .from("schedules")
          .select(`
          *,
          employee:employees(name, role)
        `)
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date, start_time")
        if (schedulesError) throw schedulesError

        // Load recent complaints
        const { data: complaintsData, error: complaintsError } = await supabase
          .from("complaints")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
        if (complaintsError) throw complaintsError

        // Load today's task completions
        const { data: completionsData, error: completionsError } = await supabase
          .from("task_completions")
          .select(`
          *,
          employee:employees(name),
          task:tasks(name, armadollars)
        `)
          .gte("completed_at", new Date().toISOString().split("T")[0])
        if (completionsError) throw completionsError

        setEmployees(employeesData || [])
        setTasks(tasksData || [])
        setSchedules(schedulesData || [])
        setComplaints(complaintsData || [])
        setTaskCompletions(completionsData || [])
      } catch (supabaseError) {
        console.log("Supabase error, falling back to mock data:", supabaseError)
        setEmployees(mockEmployees)
        setTasks(mockTasks)
        setSchedules([])
        setComplaints([])
        setTaskCompletions([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      // Set empty arrays as final fallback
      setEmployees([])
      setTasks([])
      setSchedules([])
      setComplaints([])
      setTaskCompletions([])
    } finally {
      setLoading(false)
    }
  }

  // Authentication
  const handleUserLogin = async (username) => {
    // Renamed to avoid conflict with Login component
    const employee = employees.find((emp) => emp.name.toLowerCase() === username.toLowerCase())

    if (employee) {
      setUser(employee)
      localStorage.setItem("armadollars_user", JSON.stringify(employee)) // Persist user
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    } else {
      alert("Employee not found! Please check the name and try again.")
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("armadollars_user") // Clear persisted user
  }

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("armadollars_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Employee Management Component
  function EmployeeManager() {
    const [newEmployee, setNewEmployee] = useState({
      name: "",
      email: "",
      role: "server",
      phone: "",
      emergency_contact: "",
      emergency_phone: "",
    })
    // editingEmployee state is now managed at the parent level

    const addEmployee = async () => {
      if (!newEmployee.name) return

      try {
        const { data, error } = await supabase
          .from("employees")
          .insert([
            {
              ...newEmployee,
              armadollars: 0,
              streak: 0,
              active: true, // Assuming new employees are active
            },
          ])
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
        })

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      } catch (error) {
        console.error("Error adding employee:", error)
        alert("Failed to add employee")
      }
    }

    const updateEmployee = async (employeeId, updates) => {
      try {
        // Remove id from updates if it exists, as it shouldn't be updated
        const { id, ...updateData } = updates

        const { error } = await supabase.from("employees").update(updateData).eq("id", employeeId)

        if (error) throw error

        setEmployees(employees.map((emp) => (emp.id === employeeId ? { ...emp, ...updateData } : emp)))
        setEditingEmployee(null)

        if (user && user.id === employeeId) {
          setUser({ ...user, ...updateData })
        }
      } catch (error) {
        console.error("Error updating employee:", error)
        alert("Failed to update employee")
      }
    }

    const awardBonus = async (employeeId, amount, reason) => {
      try {
        const employee = employees.find((emp) => emp.id === employeeId)
        if (!employee) {
          alert("Employee not found for bonus.")
          return
        }
        const newArmadollars = employee.armadollars + amount

        await updateEmployee(employeeId, { armadollars: newArmadollars })

        const { error } = await supabase.from("achievements").insert([
          {
            employee_id: employeeId,
            achievement_type: "bonus",
            title: "Manager Bonus",
            description: reason,
            armadollars_awarded: amount,
          },
        ])

        if (error) console.error("Error logging achievement:", error)

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      } catch (error) {
        console.error("Error awarding bonus:", error)
        alert("Failed to award bonus")
      }
    }

    return (
      <div className="space-y-6">
        {/* Add New Employee */}
        <Card className="bg-white/90 border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#8B0000]">
              <UserPlus className="h-5 w-5" />
              Add New Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Full Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="border-[#8B0000]"
              />
              <Input
                placeholder="Email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="border-[#8B0000]"
              />
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                className="border border-[#8B0000] rounded px-3 py-2 h-10 bg-transparent" // Added h-10 and bg-transparent
              >
                <option value="server">Server</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <Input
                placeholder="Phone Number"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                className="border-[#8B0000]"
              />
              <Input
                placeholder="Emergency Contact"
                value={newEmployee.emergency_contact}
                onChange={(e) => setNewEmployee({ ...newEmployee, emergency_contact: e.target.value })}
                className="border-[#8B0000]"
              />
              <Input
                placeholder="Emergency Phone"
                value={newEmployee.emergency_phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, emergency_phone: e.target.value })}
                className="border-[#8B0000]"
              />
            </div>
            <Button onClick={addEmployee} className="w-full mt-4 bg-[#8B0000] text-white hover:bg-[#A52A2A]">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card className="bg-white/90 border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#8B0000]">Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.map((employee) => (
                <motion.div
                  key={employee.id}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#8B0000]/20"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-lg text-[#8B0000]">{employee.name}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {employee.role} • {employee.armadollars} 🪙 • {employee.streak || 0} day streak
                        </p>
                        {employee.email && <p className="text-xs text-gray-500">{employee.email}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setEditingEmployee(employee)}
                      className="bg-blue-500 text-white hover:bg-blue-600 text-sm px-3 py-1"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => awardBonus(employee.id, 10, "Quick bonus for great work!")}
                        className="bg-green-500 text-white hover:bg-green-600 text-xs px-2 py-1"
                      >
                        +10
                      </Button>
                      <Button
                        onClick={() => awardBonus(employee.id, 25, "Exceptional service bonus!")}
                        className="bg-yellow-500 text-white hover:bg-yellow-600 text-xs px-2 py-1"
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

        {/* Edit Employee Dialog */}
        {editingEmployee && (
          <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
            <DialogContent className="bg-[#F5DEB3] text-[#8B0000]">
              <DialogHeader>
                <DialogTitle>Edit Employee: {editingEmployee.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingEmployee.name}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          name: e.target.value,
                        })
                      }
                      className="bg-white/70 border-[#8B0000]"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={editingEmployee.email || ""}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          email: e.target.value,
                        })
                      }
                      className="bg-white/70 border-[#8B0000]"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      value={editingEmployee.role}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          role: e.target.value,
                        })
                      }
                      className="w-full border border-[#8B0000] rounded px-3 py-2 bg-white/70 h-10" // Added h-10
                    >
                      <option value="server">Server</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <Label>Armadollars</Label>
                    <Input
                      type="number"
                      value={editingEmployee.armadollars}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          armadollars: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-white/70 border-[#8B0000]"
                    />
                  </div>
                  <div>
                    <Label>Streak</Label>
                    <Input
                      type="number"
                      value={editingEmployee.streak || 0}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          streak: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-white/70 border-[#8B0000]"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editingEmployee.phone || ""}
                      onChange={(e) =>
                        setEditingEmployee({
                          ...editingEmployee,
                          phone: e.target.value,
                        })
                      }
                      className="bg-white/70 border-[#8B0000]"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateEmployee(editingEmployee.id, editingEmployee)}
                  className="w-full bg-[#8B0000] text-white hover:bg-[#A52A2A]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  // Schedule Manager Component
  function ScheduleManager() {
    const [newSchedule, setNewSchedule] = useState({
      employee_id: "",
      date: "",
      shift_type: "",
      start_time: "",
      end_time: "",
      notes: "",
    })
    // const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]) // Not used

    const addSchedule = async () => {
      if (
        !newSchedule.employee_id ||
        !newSchedule.date ||
        !newSchedule.shift_type ||
        !newSchedule.start_time ||
        !newSchedule.end_time
      ) {
        alert("Please fill in all required fields")
        return
      }

      try {
        const { data, error } = await supabase
          .from("schedules")
          .insert([newSchedule])
          .select(`
            *,
            employee:employees(name, role)
          `)

        if (error) throw error

        setSchedules([...schedules, data[0]])
        setNewSchedule({
          employee_id: "",
          date: "",
          shift_type: "",
          start_time: "",
          end_time: "",
          notes: "",
        })

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      } catch (error) {
        console.error("Error adding schedule:", error)
        alert("Failed to add schedule. Employee may already be scheduled for this shift.")
      }
    }

    const deleteSchedule = async (scheduleId) => {
      try {
        const { error } = await supabase.from("schedules").delete().eq("id", scheduleId)

        if (error) throw error

        setSchedules(schedules.filter((s) => s.id !== scheduleId))
      } catch (error) {
        console.error("Error deleting schedule:", error)
        alert("Failed to delete schedule")
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
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={exportSchedule} className="bg-green-600 text-white hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export Schedule
          </Button>
          <Button onClick={loadInitialData} className="bg-blue-600 text-white hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button
            onClick={() => setSyncing(true)} // Actual sync logic not implemented
            className="bg-purple-600 text-white hover:bg-purple-700"
            disabled={syncing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {syncing ? "Syncing..." : "Sync Cal.com"}
          </Button>
        </div>

        {/* Add Schedule */}
        <Card className="bg-white/90 border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#8B0000]">
              <CalendarPlus className="h-5 w-5" />
              Add New Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <select
                value={newSchedule.employee_id}
                onChange={(e) => setNewSchedule({ ...newSchedule, employee_id: e.target.value })}
                className="border border-[#8B0000] rounded px-3 py-2 h-10 bg-transparent" // Added h-10 and bg-transparent
              >
                <option value="">Select Employee</option>
                {employees
                  .filter((emp) => emp.role === "server")
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
              <Input
                type="date"
                value={newSchedule.date}
                onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                className="border-[#8B0000]"
              />
              <select
                value={newSchedule.shift_type}
                onChange={(e) => setNewSchedule({ ...newSchedule, shift_type: e.target.value })}
                className="border border-[#8B0000] rounded px-3 py-2 h-10 bg-transparent" // Added h-10 and bg-transparent
              >
                <option value="">Shift Type</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="double">Double</option>
              </select>
              <Input
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                className="border-[#8B0000]"
              />
              <Input
                type="time"
                value={newSchedule.end_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                className="border-[#8B0000]"
              />
              <Button onClick={addSchedule} className="bg-[#8B0000] text-white hover:bg-[#A52A2A]">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={newSchedule.notes}
              onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
              className="mt-4 border-[#8B0000]"
            />
          </CardContent>
        </Card>

        {/* Schedule Display */}
        <Card className="bg-white/90 border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#8B0000]">Current Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No schedules found. Add some shifts above!</p>
              ) : (
                schedules.map((schedule) => (
                  <motion.div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#8B0000]/20"
                    whileHover={{ scale: 1.01 }}
                  >
                    <div>
                      <p className="font-bold text-[#8B0000]">{schedule.employee?.name || "Unknown Employee"}</p>
                      <p className="text-sm text-gray-600">
                        {schedule.date} • {schedule.shift_type} • {schedule.start_time} - {schedule.end_time}
                      </p>
                      {schedule.notes && <p className="text-xs text-gray-500 italic">{schedule.notes}</p>}
                    </div>
                    <Button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="bg-red-500 text-white hover:bg-red-600 text-sm px-3 py-1"
                    >
                      <Trash2 className="h-3 w-3" />
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

  // Task Manager Component
  function TaskManager() {
    const [newTask, setNewTask] = useState({ name: "", description: "", armadollars: 0, category: "general" })

    const addTask = async () => {
      if (!newTask.name || newTask.armadollars <= 0) {
        // Ensure armadollars is positive
        alert("Task name and a positive Armadollar value are required.")
        return
      }

      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert([
            {
              ...newTask,
              created_by: user?.id,
              active: true, // Assuming new tasks are active
            },
          ])
          .select()

        if (error) throw error

        setTasks([...tasks, data[0]])
        setNewTask({ name: "", description: "", armadollars: 0, category: "general" })

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      } catch (error) {
        console.error("Error adding task:", error)
        alert("Failed to add task")
      }
    }

    const completeTask = async (taskId) => {
      if (!user) return

      try {
        const task = tasks.find((t) => t.id === taskId)
        if (!task) {
          alert("Task not found.")
          return
        }

        const { error: completionError } = await supabase.from("task_completions").insert([
          {
            employee_id: user.id,
            task_id: taskId,
            armadollars_earned: task.armadollars, // Log how many armadollars were earned
          },
        ])

        if (completionError) throw completionError

        const { error: employeeUpdateError } = await supabase
          .from("employees")
          .update({
            armadollars: user.armadollars + task.armadollars,
          })
          .eq("id", user.id)

        if (employeeUpdateError) throw employeeUpdateError

        setUser({ ...user, armadollars: user.armadollars + task.armadollars })

        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })

        loadInitialData() // Reload all data to reflect changes
      } catch (error) {
        console.error("Error completing task:", error)
        alert("Task already completed today or error occurred")
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
        {/* Add Task (Manager/Admin only) */}
        {user && (user.role === "manager" || user.role === "admin") && (
          <Card className="bg-white/90 border-2 border-[#D4AF37]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#8B0000]">
                <Plus className="h-5 w-5" />
                Create New Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Task Name"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="border-[#8B0000]"
                />
                <Input
                  type="number"
                  placeholder="Armadollars"
                  value={newTask.armadollars}
                  onChange={(e) => setNewTask({ ...newTask, armadollars: Number.parseInt(e.target.value) || 0 })}
                  className="border-[#8B0000]"
                />
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="border border-[#8B0000] rounded px-3 py-2 h-10 bg-transparent" // Added h-10 and bg-transparent
                >
                  <option value="general">General</option>
                  <option value="service">Service</option>
                  <option value="teamwork">Teamwork</option>
                  <option value="sales">Sales</option>
                  <option value="prep">Prep</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <Button onClick={addTask} className="bg-[#8B0000] text-white hover:bg-[#A52A2A]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
              <Textarea
                placeholder="Task Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="mt-4 border-[#8B0000]"
              />
            </CardContent>
          </Card>
        )}

        {/* Available Tasks */}
        <Card className="bg-white/90 border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#8B0000]">
              <Zap className="h-5 w-5" />
              Available Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#8B0000]/20"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex-1">
                    <p className="font-bold text-lg text-[#8B0000]">{task.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{task.category}</p>
                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#D4AF37] text-[#8B0000] rounded-full font-bold">
                      +{task.armadollars} 🪙
                    </span>
                    {user &&
                      user.role === "server" &&
                      (userCompletedToday(task.id) ? (
                        <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm">✓ Done Today!</span>
                      ) : (
                        <Button
                          onClick={() => completeTask(task.id)}
                          className="bg-[#8B0000] text-white hover:bg-[#A52A2A]"
                        >
                          Complete
                        </Button>
                      ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Completions */}
        {taskCompletions.length > 0 && (
          <Card className="bg-white/90 border-2 border-[#D4AF37]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#8B0000]">
                <Trophy className="h-5 w-5" />
                Today's Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taskCompletions.map((completion) => (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between p-3 bg-green-100/50 rounded-lg border border-green-300"
                  >
                    {" "}
                    {/* Updated style */}
                    <span className="font-medium text-green-800">
                      {" "}
                      {/* Updated style */}
                      {completion.employee?.name} completed "{completion.task?.name}"
                    </span>
                    <span className="text-green-600 font-bold">+{completion.task?.armadollars} 🪙</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white/30">
            <h4 className="font-bold mb-2">📊 Total Employees</h4>
            <p className="text-3xl font-bold text-[#D4AF37]">{employees.length}</p>
            <p className="text-sm text-gray-600">Active team members</p>
          </Card>

          <Card className="p-4 bg-white/30">
            <h4 className="font-bold mb-2">🎯 Available Tasks</h4>
            <p className="text-3xl font-bold text-[#D4AF37]">{tasks.length}</p>
            <p className="text-sm text-gray-600">Earning opportunities</p>
          </Card>

          <Card className="p-4 bg-white/30">
            <h4 className="font-bold mb-2">📅 Scheduled Shifts</h4>
            <p className="text-3xl font-bold text-[#D4AF37]">{schedules.length}</p>
            <p className="text-sm text-gray-600">Upcoming shifts</p>
          </Card>

          <Card className="p-4 bg-white/30">
            <h4 className="font-bold mb-2">✅ Completions Today</h4>
            <p className="text-3xl font-bold text-[#D4AF37]">{taskCompletions.length}</p>
            <p className="text-sm text-gray-600">Tasks completed</p>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="p-4 bg-white/30">
          <h4 className="font-bold mb-4">🏆 Top Performers</h4>
          {employees
            .filter((emp) => emp.role === "server")
            .sort((a, b) => b.armadollars - a.armadollars)
            .slice(0, 5)
            .map((emp, index) => (
              <div key={emp.id} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐"}</span>
                  {emp.name}
                </span>
                <span className="font-bold text-[#D4AF37]">{emp.armadollars} 🪙</span>
              </div>
            ))}
        </Card>
      </div>
    )
  }

  // LoginComponent Component
  function LoginComponent() {
    const [username, setUsername] = useState("")

    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="bg-white/90 border-2 border-[#D4AF37]">
          <CardHeader>
            <CardTitle className="text-[#8B0000]">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Employee Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-[#8B0000]"
            />
            <Button
              onClick={() => handleUserLogin(username)}
              className="w-full mt-4 bg-[#8B0000] text-white hover:bg-[#A52A2A]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4">
      <AnimatePresence>
        {user ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <Tabs defaultValue="employees">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="employees" className="bg-[#F5DEB3] text-[#8B0000]">
                  <Users className="mr-2 h-4 w-4" />
                  Employees
                </TabsTrigger>
                <TabsTrigger value="schedule" className="bg-[#F5DEB3] text-[#8B0000]">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="tasks" className="bg-[#F5DEB3] text-[#8B0000]">
                  <Zap className="mr-2 h-4 w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="stats" className="bg-[#F5DEB3] text-[#8B0000]">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Stats
                </TabsTrigger>
              </TabsList>
              <TabsContent value="employees">
                <EmployeeManager />
              </TabsContent>
              <TabsContent value="schedule">
                <ScheduleManager />
              </TabsContent>
              <TabsContent value="tasks">
                <TaskManager />
              </TabsContent>
              <TabsContent value="stats">{/* Stats Component Here */}</TabsContent>
            </Tabs>
            <Button onClick={handleLogout} className="mt-4 bg-red-500 text-white hover:bg-red-600">
              <Logout className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </motion.div>
        ) : (
          <LoginComponent />
        )}
      </AnimatePresence>
    </div>
  )
}
