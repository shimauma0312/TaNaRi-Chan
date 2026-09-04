"use client"

import NextLink from "@/components/NextLink"
import { useLogout } from "@/hooks/useLogout"
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded"
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"
import MailRoundedIcon from "@mui/icons-material/MailRounded"
import PublicRoundedIcon from "@mui/icons-material/PublicRounded"
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

interface SideMenuProps {
  onNavigate?: () => void
}

interface NavigationItem {
  href: string
  label: string
  icon: ReactNode
  exact?: boolean
}

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardRoundedIcon />, exact: true },
  { href: "/dashboard/todoList", label: "My Todo List", icon: <ChecklistRoundedIcon /> },
  { href: "/dashboard/otherTodos", label: "Other's Todo List", icon: <PublicRoundedIcon /> },
  { href: "/dashboard/articles", label: "My Articles", icon: <ArticleRoundedIcon /> },
  { href: "/dashboard/messages", label: "Messages", icon: <MailRoundedIcon /> },
  { href: "/dashboard/calendar", label: "Calendar", icon: <CalendarMonthRoundedIcon /> },
]

export default function SideMenu({ onNavigate }: SideMenuProps) {
  const pathname = usePathname()
  const { handleLogout, error, isLoggingOut } = useLogout()

  return (
    <Box component="nav" aria-label="ダッシュボードナビゲーション" sx={{ p: 2 }}>
      <List disablePadding>
        {navigationItems.map(({ exact, href, icon, label }) => {
          const selected = exact ? pathname === href : pathname.startsWith(href)

          return (
            <ListItem disablePadding key={href} sx={{ mb: 0.5 }}>
              <ListItemButton
                aria-current={selected ? "page" : undefined}
                component={NextLink}
                href={href}
                onClick={onNavigate}
                selected={selected}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider sx={{ my: 2 }} />
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            sx={{ color: "error.light" }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              {isLoggingOut ? (
                <CircularProgress aria-hidden="true" color="inherit" size={20} />
              ) : (
                <LogoutRoundedIcon />
              )}
            </ListItemIcon>
            <ListItemText primary={isLoggingOut ? "Logging out..." : "Logout"} />
          </ListItemButton>
        </ListItem>
      </List>
      {error && (
        <Alert role="alert" severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}
