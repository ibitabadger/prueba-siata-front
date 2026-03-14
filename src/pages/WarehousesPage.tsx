import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

type Warehouse = {
  id?: number;
  name?: string;
  location?: string | null;
  [key: string]: any;
};

type Mode = "create" | "edit";

export const WarehousesPage = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<Mode>("create");
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

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
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al cargar las bodegas.");
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
    setDialogOpen(true);
  };

  const openEditDialog = async (warehouse: Warehouse) => {
    if (warehouse.id == null) return;
    setDialogMode("edit");
    setCurrentWarehouse({ id: warehouse.id });
    setDialogOpen(true);
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/warehouses/${warehouse.id}`);
      setCurrentWarehouse(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al cargar la bodega.");
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (warehouse.id == null) return;
    if (!window.confirm("¿Eliminar esta bodega?")) return;
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/warehouses/${warehouse.id}`);
      await fetchWarehouses();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDialogChange = (field: string, value: string | null) => {
    setCurrentWarehouse((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleSave = async () => {
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
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const columns = warehouses.length > 0 ? Object.keys(warehouses[0]).filter((k) => k !== "id") : ["name", "location"];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Bodegas</Typography>
          <Typography variant="body2" color="text.secondary">Crear, editar y eliminar bodegas.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ bgcolor: "#06355F" }}>
          Nueva bodega
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600 }}>{col === "name" ? "Nombre" : col === "location" ? "Ubicación" : col}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warehouses.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.id}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col}>{String(w[col] ?? "")}</TableCell>
                ))}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(w)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(w)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && warehouses.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 2}><Typography variant="body2" color="text.secondary">No hay bodegas.</Typography></TableCell></TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 2}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
                    <CircularProgress size={24} sx={{ color: "#06355F" }} />
                    <Typography variant="body2" color="text.secondary">Cargando bodegas...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
              <TextField label="Nombre" value={currentWarehouse.name ?? ""} onChange={(e) => handleDialogChange("name", e.target.value)} required fullWidth />
              <TextField label="Ubicación" value={currentWarehouse.location ?? ""} onChange={(e) => handleDialogChange("location", e.target.value)} fullWidth />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving || loadingDetail} color="inherit">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || loadingDetail} sx={{ bgcolor: "#06355F" }}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
