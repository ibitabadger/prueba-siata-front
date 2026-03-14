import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardLayout } from "./components/DashboardLayout";
import { ClientsPage } from "./pages/ClientsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { WarehousesPage } from "./pages/WarehousesPage";
import { PortsPage } from "./pages/PortsPage";
import { ShipmentsPage } from "./pages/ShipmentsPage";

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout>
              <ClientsPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/clients"
        element={
          <RequireAuth>
            <DashboardLayout>
              <ClientsPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />


      <Route
        path="/products"
        element={
          <RequireAuth>
            <DashboardLayout>
              <ProductsPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/warehouses"
        element={
          <RequireAuth>
            <DashboardLayout>
              <WarehousesPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/ports"
        element={
          <RequireAuth>
            <DashboardLayout>
              <PortsPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/shipments"
        element={
          <RequireAuth>
            <DashboardLayout>
              <ShipmentsPage />
            </DashboardLayout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

