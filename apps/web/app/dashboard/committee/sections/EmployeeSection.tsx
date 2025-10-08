"use client"

import React from "react"
import { apiGet } from "@/lib/api"
import EmployeeDetails from "./EmployeeDetails"

export default function EmployeesSection({
  employees,
  filters,
  setFilters,
  departments,
  roles,
  selected,
  setSelected,
  goals,
  setGoals,
  trainings,
  setTrainings,
}: any) {
  return (
    <>
      <h2 className="font-semibold text-lg mb-2">Employees</h2>
      <div className="grid gap-2 mb-3 sm:grid-cols-3">
        <input
          className="border rounded px-2 py-1"
          placeholder="Search"
          value={filters.q}
          onChange={(e) => setFilters((s: any) => ({ ...s, q: e.target.value }))}
        />
        <select
          className="border rounded px-2 py-1"
          value={filters.department}
          onChange={(e) => setFilters((s: any) => ({ ...s, department: e.target.value }))}
        >
          <option value="">All Departments</option>
          {departments.map((d: string) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1"
          value={filters.role}
          onChange={(e) => setFilters((s: any) => ({ ...s, role: e.target.value }))}
        >
          <option value="">All Roles</option>
          {roles.map((r: string) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

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
            {employees.map((e: any) => (
              <tr key={e._id} className="border-b">
                <td className="py-2 px-4">{e.name}</td>
                <td className="py-2 px-4">{e.email || "—"}</td>
                <td className="py-2 px-4">{e.role || "—"}</td>
                <td className="py-2 px-4">{e.department || "—"}</td>
                <td className="py-2 px-4">{e.target_success_role || "—"}</td>
                <td className="py-2 px-4">
                  <button
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const res = await apiGet(`/api/committee/employee/${e._id}`)
                      if (res.ok) setSelected(await res.json())
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
