"use client"

import NextLink from "@/components/NextLink"
import { useLogout } from "@/hooks/useLogout"
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material"
import { usePathname } from "next/navigation"

interface SideMenuProps {
  onNavigate?: () => void
}

interface NavigationItem {
  href: string
  label: string
  exact?: boolean
}

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/todoList", label: "My Todo List" },
  { href: "/dashboard/otherTodos", label: "Other's Todo List" },
  { href: "/dashboard/articles", label: "My Articles" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/calendar", label: "Calendar" },
]

export default function SideMenu({ onNavigate }: SideMenuProps) {
  const pathname = usePathname()
  const { handleLogout, error, isLoggingOut } = useLogout()

  return (
    <Box component="nav" aria-label="ダッシュボードナビゲーション" sx={{ p: 2 }}>
      <List disablePadding>
        {navigationItems.map(({ exact, href, label }) => {
          const selected = exact ? pathname === href : pathname.startsWith(href)

          return (
            <ListItem disablePadding key={href}>
              <ListItemButton
                aria-current={selected ? "page" : undefined}
                component={NextLink}
                href={href}
                onClick={onNavigate}
                selected={selected}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider sx={{ my: 2 }} />
      <List disablePadding>
        <ListItem disablePadding>
          <ListItemButton disabled={isLoggingOut} onClick={() => void handleLogout()}>
            {isLoggingOut && (
              <CircularProgress aria-hidden="true" color="inherit" size={20} sx={{ mr: 2 }} />
            )}
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
