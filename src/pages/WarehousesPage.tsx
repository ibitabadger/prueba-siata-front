import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { parseApiError } from "../utils/parseApiError";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageHeader } from "../components/PageHeader";
import { CrudTable } from "../components/CrudTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Warehouse = {
  id?: number;
  name?: string;
  location?: string | null;
  [key: string]: any;
};

type Mode = "create" | "edit";

const WAREHOUSE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nombre" },
  { key: "location", label: "Ubicación" },
];

export const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<Mode>("create");
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);

  const token = localStorage.getItem("auth_token");
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/warehouses");
      const raw = res.data;
      const data: Warehouse[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
      setWarehouses(data);
    } catch (err) {
      setError(parseApiError(err, "Error al cargar las bodegas."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openCreateDialog = () => {
    setDialogMode("create");
    setCurrentWarehouse({});
    setLoadingDetail(false);
    setNameError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (warehouse: Warehouse) => {
    if (warehouse.id == null) return;
    setDialogMode("edit");
    setCurrentWarehouse({ id: warehouse.id });
    setDialogOpen(true);
    setLoadingDetail(true);
    setNameError(null);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/warehouses/${warehouse.id}`);
      setCurrentWarehouse(res.data);
    } catch (err) {
      setError(parseApiError(err, "Error al cargar la bodega."));
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteRequest = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (warehouseToDelete?.id == null) return;
    setConfirmOpen(false);
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/warehouses/${warehouseToDelete.id}`);
      await fetchWarehouses();
    } catch (err) {
      setError(parseApiError(err, "Error al eliminar."));
    } finally {
      setSaving(false);
      setWarehouseToDelete(null);
    }
  };

  const handleDialogChange = (field: string, value: string | null) => {
    if (field === "name") {
      setNameError(!value?.trim() ? "El nombre es obligatorio." : null);
    }
    setCurrentWarehouse((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleSave = async () => {
    if (!currentWarehouse.name?.trim()) {
      setNameError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: currentWarehouse.name ?? "",
        location: currentWarehouse.location ?? null,
      };
      if (dialogMode === "create") {
        await axiosInstance.post("/api/warehouses", payload);
      } else {
        if (currentWarehouse.id == null) throw new Error("Falta id.");
        await axiosInstance.put(`/api/warehouses/${currentWarehouse.id}`, payload);
      }
      setDialogOpen(false);
      await fetchWarehouses();
    } catch (err) {
      setError(parseApiError(err, "Error al guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <PageHeader
        title="Bodegas"
        subtitle="Crear, editar y eliminar bodegas."
        buttonLabel="Nueva bodega"
        onAdd={openCreateDialog}
        error={error}
        onErrorClose={() => setError(null)}
      />

      <CrudTable<Warehouse>
        columns={WAREHOUSE_COLUMNS}
        data={warehouses}
        loading={loading}
        emptyMessage="No hay bodegas."
        loadingMessage="Cargando bodegas..."
        getRowKey={(row) => row.id!}
        onEdit={openEditDialog}
        onDelete={handleDeleteRequest}
      />

      <Dialog open={dialogOpen} onClose={() => !saving && !loadingDetail && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "create" ? "Nueva bodega" : "Editar bodega"}</DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: "#06355F" }} />
              <Typography variant="body2" color="text.secondary">Cargando...</Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <TextField label="Nombre" value={currentWarehouse.name ?? ""} onChange={(e) => handleDialogChange("name", e.target.value)} error={!!nameError} helperText={nameError ?? ""} required fullWidth />
              <TextField label="Ubicación" value={currentWarehouse.location ?? ""} onChange={(e) => handleDialogChange("location", e.target.value)} fullWidth />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving || loadingDetail} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || loadingDetail || !!nameError} sx={{ bgcolor: "#06355F" }}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar bodega"
        message={`¿Seguro que deseas eliminar la bodega "${warehouseToDelete?.name ?? ""}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setWarehouseToDelete(null); }}
      />
    </Box>
  );
};
