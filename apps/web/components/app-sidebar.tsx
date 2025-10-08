// Update your AppSidebar component with these changes:

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

export function AppSidebar({ 
  activeView, 
  setActiveView, 
  ...props 
}: React.ComponentProps<typeof Sidebar> & { 
  activeView?: string; 
  setActiveView?: (view: string) => void 
}) {
  const user = typeof window !== "undefined" ? getUser() : null
  const role = user?.user_role

  // Base dashboard URL depends on user role
  const dashboardUrl =
    role === "committee" ? "/dashboard/committee" : "/dashboard/employee"

  // Define sidebar items dynamically
  const items =
    role === "committee"
      ? [
          { 
            title: "Dashboard", 
            url: "#", 
            icon: IconDashboard,
            onClick: () => setActiveView?.("dashboard")
          },
          { 
            title: "Employees", 
            url: "#", 
            icon: IconUsers,
            onClick: () => setActiveView?.("employees")
          },
          { 
            title: "Success Profiles", 
            url: "#", 
            icon: IconFileAi,
            onClick: () => setActiveView?.("profiles")
          },
          { 
            title: "Reports", 
            url: "#", 
            icon: IconReport,
            onClick: () => setActiveView?.("reports")
          },
        ]
      : [
          { title: "Dashboard", url: "/dashboard/employee", icon: IconDashboard },
          { title: "Mentorship", url: "/dashboard/employee?view=mentorship", icon: IconUsers },
          { title: "Profile", url: "/dashboard/employee?view=profile", icon: IconUserCircle },
        ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
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

      <SidebarContent>
        <NavMain items={items} activeView={activeView} />
      </SidebarContent>

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