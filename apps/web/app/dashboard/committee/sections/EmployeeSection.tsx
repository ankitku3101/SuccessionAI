"use client"

import React, { useState, useEffect } from "react"
import { apiGet } from "@/lib/api"
import EmployeeDetails from "./EmployeeDetails"
import { Button } from "@/components/ui/button"

export default function EmployeesSection({
  filters,
  setFilters,
  departments,
  setDepartments,
  roles,
  setRoles,
  selected,
  setSelected,
  goals,
  setGoals,
  trainings,
  setTrainings,
}: any) {
  const [employees, setEmployees] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)

  const totalPages = Math.ceil(total / limit)

  useEffect(() => {
    fetchEmployees()
  }, [page, filters])

  const fetchEmployees = async () => {
    setLoading(true)
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      q: filters.q || "",
      department: filters.department || "",
      role: filters.role || "",
    }).toString()

    const res = await apiGet(`/api/committee/employees?${query}`)
    if (res.ok) {
      const data = await res.json()
      setEmployees(data.items || [])
      setTotal(data.total || 0)

      // extract departments & roles
      const deps = Array.from(new Set((data.items || []).map((x: any) => x.department).filter(Boolean)))
      const rls = Array.from(new Set((data.items || []).map((x: any) => x.role).filter(Boolean)))
      setDepartments(deps)
      setRoles(rls)
    }
    setLoading(false)
  }

  return (
    <>
      <h2 className="font-semibold text-lg mb-2">Employees</h2>

      {/* Filters */}
      <div className="grid gap-2 mb-3 sm:grid-cols-3">
        <input
            className="border rounded px-2 py-1 bg-background text-foreground focus:ring-2 focus:ring-primary"
            placeholder="Search"
            value={filters.q}
            onChange={(e) => setFilters((s: any) => ({ ...s, q: e.target.value }))}
        />
        <select
            className="border rounded px-2 py-1 bg-background text-foreground focus:ring-2 focus:ring-primary"
            value={filters.department}
            onChange={(e) => setFilters((s: any) => ({ ...s, department: e.target.value }))}
        >
            <option value="">All Departments</option>
            {departments.map((d: string) => (
            <option key={d}>{d}</option>
            ))}
        </select>
        <select
            className="border rounded px-2 py-1 bg-background text-foreground focus:ring-2 focus:ring-primary"
            value={filters.role}
            onChange={(e) => setFilters((s: any) => ({ ...s, role: e.target.value }))}
        >
            <option value="">All Roles</option>
            {roles.map((r: string) => (
            <option key={r}>{r}</option>
            ))}
        </select>
        </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-muted/50">
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Role</th>
              <th className="py-2 px-4">Department</th>
              <th className="py-2 px-4">Target Success Role</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : employees.length > 0 ? (
              employees.map((e: any) => (
                <tr key={e._id} className="border-b">
                  <td className="py-2 px-4">{e.name}</td>
                  <td className="py-2 px-4">{e.email || "—"}</td>
                  <td className="py-2 px-4">{e.role || "—"}</td>
                  <td className="py-2 px-4">{e.department || "—"}</td>
                  <td className="py-2 px-4">{e.target_success_role || "—"}</td>
                  <td className="py-2 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const res = await apiGet(`/api/committee/employee/${e._id}`)
                        if (res.ok) setSelected(await res.json())
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>

      {selected && (
        <EmployeeDetails
          selected={selected}
          setSelected={setSelected}
          goals={goals}
          setGoals={setGoals}
          trainings={trainings}
          setTrainings={setTrainings}
        />
      )}
    </>
  )
}
