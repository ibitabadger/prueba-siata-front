import type { ReactNode } from "react";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import AnchorIcon from "@mui/icons-material/Anchor";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const drawerWidth = 240;

type DashboardLayoutProps = {
  children: ReactNode;
};

type MenuItem = {
  label: string;
  path: string;
  group?: string;
  icon: ReactNode;
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Clientes", path: "/clients", icon: <PeopleIcon /> },
  { label: "Productos", path: "/products", icon: <InventoryIcon /> },
  { label: "Bodegas", path: "/warehouses", icon: <WarehouseIcon /> },
  { label: "Puertos", path: "/ports", icon: <AnchorIcon /> },
  { label: "Envíos", path: "/shipments", icon: <LocalShippingIcon /> },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/auth/login");
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#020617",
        color: "white",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 3,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src="/logo_logistica.png"
            alt="Logo"
            style={{ width: "90%", maxWidth: 160, objectFit: "contain" }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(148,163,184,0.4)" }} />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {Array.from(
          MENU_ITEMS.reduce<Map<string | undefined, MenuItem[]>>((acc, item) => {
            const key = item.group ?? "";
            if (!acc.has(key)) acc.set(key, []);
            acc.get(key)!.push(item);
            return acc;
          }, new Map()),
        ).map(([group, items]) => (
          <Box key={group ?? "root"}>
            {group && (
              <>
                <Typography
                  variant="overline"
                  sx={{ px: 2, pt: 2, pb: 1, color: "grey.400" }}
                >
                  {group}
                </Typography>
              </>
            )}
            <List dense>
              {items.map((item) => {
                const selected = location.pathname === item.path;
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      selected={selected}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      sx={{
                        "&.Mui-selected": {
                          bgcolor: "rgba(255,255,255,0.08)",
                        },
                        "&.Mui-selected:hover": {
                          bgcolor: "rgba(255,255,255,0.12)",
                        },
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.06)",
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: "auto" }}>
        <Divider sx={{ borderColor: "rgba(148,163,184,0.4)" }} />
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Cerrar sesión"
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: "1rem",
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar fija con el título — arranca después del sidebar en desktop */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer - 1,
          bgcolor: "#ffffff",
          color: "black",
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" color="black" fontWeight="bold">
            Panel de control de plataforma logística
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer para móvil */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer fijo en desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px",
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: "#ffffff",
          color: "text.primary",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

