"use client"

import React from "react"
import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  icon: Icon
  url?: string
  onClick?: () => void
}

export function NavMain({
  items,
  activeView,
}: {
  items: NavItem[]
  activeView?: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              activeView === item.title.toLowerCase().replace(/\s+/g, "")

            const IconComponent = item.icon

            return (
              <SidebarMenuItem key={item.title}>
                {item.onClick ? (
                  <SidebarMenuButton className="cursor-pointer" isActive={isActive} onClick={item.onClick}>
                    <IconComponent />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild isActive={isActive}>
                    <a href={item.url ?? "#"}>
                      <IconComponent />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
