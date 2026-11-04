"use client"

import NextLink from "@/components/NextLink"
import SideMenu from "@/components/SideMenu"
import MenuIcon from "@mui/icons-material/Menu"
import { AppBar, Box, Drawer, IconButton, Link, Toolbar, Typography } from "@mui/material"
import { useState, type ReactNode } from "react"

const drawerWidth = 264

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = (id?: string) => (
    <Box id={id} sx={{ height: "100%" }}>
      <Toolbar />
      <SideMenu onNavigate={() => setMobileMenuOpen(false)} />
    </Box>
  )

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            aria-controls="dashboard-mobile-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label="メニューを開く"
            color="inherit"
            edge="start"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ display: { md: "none" }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography component="div" sx={{ flexGrow: 1 }} variant="h6">
            <Link color="inherit" component={NextLink} href="/dashboard" underline="none">
              TaNaRi-Chan
            </Link>
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="aside" aria-label="ダッシュボードメニュー">
        <Drawer
          elevation={0}
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          variant="temporary"
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {navigation("dashboard-mobile-navigation")}
        </Drawer>
        <Drawer
          elevation={0}
          open
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            flexShrink: 0,
            width: drawerWidth,
            "& .MuiDrawer-paper": {
              borderRightColor: "divider",
              width: drawerWidth,
            },
          }}
        >
          {navigation()}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3 },
          py: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
