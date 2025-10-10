// components/app-sidebar.tsx
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
  activeView?: string
  setActiveView?: (view: string) => void
}) {
  const user = typeof window !== "undefined" ? getUser() : null
  const role = user?.user_role

  // Base dashboard URL depends on user role
  const dashboardUrl = role === "committee" ? "/dashboard/committee" : "/dashboard/employee"

  // Define sidebar items dynamically. Each item has an `id` used for active highlighting.
  const items =
    role === "committee"
      ? [
          {
            id: "dashboard",
            title: "Dashboard",
            url: "#",
            icon: IconDashboard,
            onClick: () => setActiveView?.("dashboard"),
          },
          {
            id: "employees",
            title: "Employees",
            url: "#",
            icon: IconUsers,
            onClick: () => setActiveView?.("employees"),
          },
          {
            id: "profiles",
            title: "Success Profiles",
            url: "#",
            icon: IconFileAi,
            onClick: () => setActiveView?.("profiles"),
          },
          {
            id: "reports",
            title: "Reports",
            url: "#",
            icon: IconReport,
            onClick: () => setActiveView?.("reports"),
          },
          {
            id: "nine_box_matrix",
            title: "9-Box Matrix",
            url: "#",
            icon: IconReport,
            onClick: () => setActiveView?.("nine_box_matrix"),
          },
        ]
      : [
          {
            id: "dashboard",
            title: "Dashboard",
            url: "#",
            icon: IconDashboard,
            onClick: () => setActiveView?.("dashboard"),
          },
          {
            id: "mentorship",
            title: "Mentorship",
            url: "#",
            icon: IconUsers,
            onClick: () => setActiveView?.("mentorship"),
          },
          {
            id: "profile",
            title: "Profile",
            url: "#",
            icon: IconUserCircle,
            onClick: () => setActiveView?.("profile"),
          },
          {
            id: "successProfiles",
            title: "View Success Profiles",
            url: "#",
            icon: IconUserCircle,
            onClick: () => setActiveView?.("successProfiles"),
          },
          {
            id: "employeeGapAnalysis",
            title: "Gap Analysis",
            url: "#",
            icon: IconUserCircle,
            onClick: () => setActiveView?.("employeeGapAnalysis"),
          },
        ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href={dashboardUrl}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Succession AI</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* NavMain receives items and activeView — NavMain should use item.id to decide highlighting.
            If NavMain expects `url`-based navigation, it will still work; the important part is:
            - items have `id` and `onClick`
            - activeView is passed to NavMain so it can mark active item */}
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
