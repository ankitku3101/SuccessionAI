"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconFileAi,
  IconReport,
  IconUserCircle,
  IconUsers,
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { getUser } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const fallbackUser = {
  name: "User",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = typeof window !== "undefined" ? getUser() : null
  const role = user?.user_role

  // Base dashboard URL depends on user role
  const dashboardUrl =
    role === "committee" ? "/dashboard/committee" : "/dashboard/employee"

  // Define sidebar items dynamically
  const items =
    role === "committee"
      ? [
          { title: "Dashboard", url: "/dashboard/committee", icon: IconDashboard },
          { title: "Employees", url: "/dashboard/committee?view=employees", icon: IconUsers },
          { title: "Success Profiles", url: "/dashboard/committee?view=profiles", icon: IconFileAi },
          { title: "Reports", url: "/dashboard/committee?view=reports", icon: IconReport },
        ]
      : [
          { title: "Dashboard", url: "/dashboard/employee", icon: IconDashboard },
          { title: "Mentorship", url: "/dashboard/employee?view=mentorship", icon: IconUsers },
          { title: "Profile", url: "/dashboard/employee?view=profile", icon: IconUserCircle },
        ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* ---- Header ---- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={dashboardUrl}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Succession AI</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ---- Main Navigation ---- */}
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      {/* ---- Footer User Info ---- */}
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || fallbackUser.name,
            email: user?.email || fallbackUser.email,
            avatar: fallbackUser.avatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
