"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUserCircle,
  IconUsers,
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/employee",
      icon: IconDashboard,
    },
  ],
  navClouds: [],
  navSecondary: [],
  documents: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = typeof window !== 'undefined' ? getUser() : null
  const dashboardUrl = user?.user_role === 'committee' ? '/dashboard/committee' : '/dashboard/employee'
  const items = [
    { title: 'Dashboard', url: dashboardUrl, icon: IconDashboard },
    ...(user?.user_role === 'committee' ? [
      { title: 'Employees', url: '/dashboard/committee', icon: IconUsers },
      { title: 'Success Profiles', url: '/dashboard/committee?view=profiles', icon: IconFileAi },
      { title: 'Reports', url: '/dashboard/committee?view=reports', icon: IconReport },
    ] : [
      { title: 'Mentorship', url: '/dashboard/employee?view=mentorship', icon: IconUsers },
      { title: 'Profile', url: '/dashboard/employee?view=profile', icon: IconUserCircle },
    ])
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
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Succession AI</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user?.name || 'User', email: user?.email || '', avatar: data.user.avatar }} />
      </SidebarFooter>
    </Sidebar>
  )
}
