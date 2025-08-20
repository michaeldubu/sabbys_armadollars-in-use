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
import { CheckCircle, XCircle, Edit, Trash2, Eye } from "lucide-react"

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
}

interface AdminDashboardProps {
  user: Employee
  loadInitialData: () => Promise<void>
}

export default function AdminDashboard({ user, loadInitialData }: AdminDashboardProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Bonus State
  const [bonusAmount, setBonusAmount] = useState("")
  const [bonusReason, setBonusReason] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")

  // Task State
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskArmadollars, setNewTaskArmadollars] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null) // For editing existing tasks

  // Complaint View State
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null)
  const [isViewComplaintDialogOpen, setIsViewComplaintDialogOpen] = useState(false)

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase.from("employees").select("*")
    if (error) {
      console.error("Error fetching employees:", error)
      setError("Failed to load employees.")
      return []
    }
    return data
  }, [])

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from("tasks").select("*")
    if (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks.")
      return []
    }
    return data
  }, [])

  const fetchComplaints = useCallback(async () => {
    const { data, error } = await supabase.from("complaints").select(`
      *,
      employees (
        name
      )
    `)
    if (error) {
      console.error("Error fetching complaints:", error)
      setError("Failed to load complaints.")
      return []
    }
    // Map the data to flatten the employee name
    return data.map((complaint) => ({
      ...complaint,
      employee_name: complaint.employees ? complaint.employees.name : "Unknown",
    }))
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [employeesData, tasksData, complaintsData] = await Promise.all([
        fetchEmployees(),
        fetchTasks(),
        fetchComplaints(),
      ])
      setEmployees(employeesData)
      setTasks(tasksData)
      setComplaints(complaintsData)
    } catch (err) {
      console.error("Error loading admin data:", err)
      setError("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }, [fetchEmployees, fetchTasks, fetchComplaints])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleGiveBonus = async () => {
    if (!selectedEmployeeId || !bonusAmount || !bonusReason) {
      setError("Please fill all bonus fields.")
      return
    }
    const amount = Number.parseFloat(bonusAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Bonus amount must be a positive number.")
      return
    }

    setLoading(true)
    setError("")
    try {
      // Update employee's armadollars
      const { data: employee, error: fetchError } = await supabase
        .from("employees")
        .select("armadollars")
        .eq("id", selectedEmployeeId)
        .single()

      if (fetchError || !employee) {
        throw new Error("Employee not found or error fetching employee.")
      }

      const newArmadollars = employee.armadollars + amount
      const { error: updateError } = await supabase
        .from("employees")
        .update({ armadollars: newArmadollars })
        .eq("id", selectedEmployeeId)

      if (updateError) {
        throw updateError
      }

      // Record the bonus transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        employee_id: selectedEmployeeId,
        amount: amount,
        type: "bonus",
        description: bonusReason,
      })

      if (transactionError) {
        throw transactionError
      }

      // Clear form and reload data
      setBonusAmount("")
      setBonusReason("")
      setSelectedEmployeeId("")
      await loadData()
      loadInitialData() // Update parent state for current user's armadollars
      alert("Bonus successfully awarded!")
    } catch (err) {
      console.error("Error giving bonus:", err)
      setError(`Failed to award bonus: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskName || !newTaskDescription || !newTaskArmadollars) {
      setError("Please fill all task fields.")
      return
    }
    const armadollars = Number.parseFloat(newTaskArmadollars)
    if (isNaN(armadollars) || armadollars <= 0) {
      setError("Task Armadollars must be a positive number.")
      return
    }

    setLoading(true)
    setError("")
    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update({
            name: newTaskName,
            description: newTaskDescription,
            armadollars: armadollars,
          })
          .eq("id", editingTask.id)

        if (error) throw error
        alert("Task updated successfully!")
        setEditingTask(null)
      } else {
        // Add new task
        const { error } = await supabase.from("tasks").insert({
          name: newTaskName,
          description: newTaskDescription,
          armadollars: armadollars,
        })

        if (error) throw error
        alert("Task added successfully!")
      }

      // Clear form and reload data
      setNewTaskName("")
      setNewTaskDescription("")
      setNewTaskArmadollars("")
      await loadData()
    } catch (err) {
      console.error("Error adding/updating task:", err)
      setError(`Failed to save task: ${err.message}`)
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
    setError("")
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error
      alert("Task deleted successfully!")
      await loadData()
    } catch (err) {
      console.error("Error deleting task:", err)
      setError(`Failed to delete task: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplaintResolved = async (complaintId: string) => {
    if (!confirm("Are you sure you want to mark this complaint as resolved?")) return

    setLoading(true)
    setError("")
    try {
      const { error } = await supabase.from("complaints").update({ status: "resolved" }).eq("id", complaintId)

      if (error) throw error
      alert("Complaint marked as resolved!")
      await loadData()
    } catch (err) {
      console.error("Error resolving complaint:", err)
      setError(`Failed to resolve complaint: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewComplaint = (complaint: Complaint) => {
    setViewingComplaint(complaint)
    setIsViewComplaintDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full text-roadhouseBlack">Loading Admin Dashboard...</div>
  }

  if (error) {
    return <div className="text-roadhouseRed text-center p-4 font-bold">{error}</div>
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-roadhouseRed text-center p-4 font-bold">
        Access Denied: You must be an admin to view this page.
      </div>
    )
  }

  const openComplaints = complaints.filter((c) => c.status === "open").length
  const totalArmadollarsAwarded = employees.reduce((sum, emp) => sum + emp.armadollars, 0)

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-roadhouseRed text-center">Admin Dashboard</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-roadhouseRed/10 text-roadhouseBlack">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bonus">Give Bonus</TabsTrigger>
          <TabsTrigger value="tasks">Manage Tasks</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
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
                      <TableCell className="text-right">{employee.armadollars.toFixed(2)}</TableCell>
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

        <TabsContent value="complaints" className="mt-4">
          <Card className="bg-roadhouseWhite border-roadhouseRed shadow-lg">
            <CardHeader>
              <CardTitle className="text-roadhouseRed">Employee Complaints</CardTitle>
              <CardDescription className="text-roadhouseBlack">
                Review and manage complaints submitted by employees.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
    </div>
  )
}
