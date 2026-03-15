import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { parseApiError } from "../utils/parseApiError";
import { ConfirmDialog } from "../components/ConfirmDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

type Port = {
  id?: number;
  name?: string;
  is_international?: boolean;
  location?: string | null;
  [key: string]: any;
};

type Mode = "create" | "edit";

export const PortsPage = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<Mode>("create");
  const [currentPort, setCurrentPort] = useState<Port>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [portToDelete, setPortToDelete] = useState<Port | null>(null);

  const token = localStorage.getItem("auth_token");
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const fetchPorts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/ports");
      const raw = res.data;
      const data: Port[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
      setPorts(data);
    } catch (err) {
      setError(parseApiError(err, "Error al cargar los puertos."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  const openCreateDialog = () => {
    setDialogMode("create");
    setCurrentPort({ is_international: false });
    setLoadingDetail(false);
    setNameError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (port: Port) => {
    if (port.id == null) return;
    setDialogMode("edit");
    setCurrentPort({ id: port.id });
    setDialogOpen(true);
    setLoadingDetail(true);
    setNameError(null);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/ports/${port.id}`);
      setCurrentPort(res.data);
    } catch (err) {
      setError(parseApiError(err, "Error al cargar el puerto."));
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteRequest = (port: Port) => {
    setPortToDelete(port);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (portToDelete?.id == null) return;
    setConfirmOpen(false);
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/ports/${portToDelete.id}`);
      await fetchPorts();
    } catch (err) {
      setError(parseApiError(err, "Error al eliminar."));
    } finally {
      setSaving(false);
      setPortToDelete(null);
    }
  };

  const handleDialogChange = (field: string, value: string | boolean | null) => {
    if (field === "name") {
      setNameError(!(value as string)?.trim() ? "El nombre es obligatorio." : null);
    }
    setCurrentPort((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentPort.name?.trim()) {
      setNameError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: currentPort.name ?? "",
        is_international: currentPort.is_international ?? false,
        location: currentPort.location ?? null,
      };
      if (dialogMode === "create") {
        await axiosInstance.post("/api/ports", payload);
      } else {
        if (currentPort.id == null) throw new Error("Falta id.");
        await axiosInstance.put(`/api/ports/${currentPort.id}`, payload);
      }
      setDialogOpen(false);
      await fetchPorts();
    } catch (err) {
      setError(parseApiError(err, "Error al guardar."));
    } finally {
      setSaving(false);
    }
  };

  const columns = ports.length > 0 ? Object.keys(ports[0]).filter((k) => k !== "id") : ["name", "is_international", "location"];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Puertos</Typography>
          <Typography variant="body2" color="text.secondary">Crear, editar y eliminar puertos.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ bgcolor: "#06355F" }}>
          Nuevo puerto
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600 }}>
                  {col === "name" ? "Nombre" : col === "is_international" ? "Internacional" : col === "location" ? "Ubicación" : col}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ports.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {col === "is_international" ? (p[col] ? "Sí" : "No") : String(p[col] ?? "")}
                  </TableCell>
                ))}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(p)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteRequest(p)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && ports.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 2}><Typography variant="body2" color="text.secondary">No hay puertos.</Typography></TableCell></TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 2}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
                    <CircularProgress size={24} sx={{ color: "#06355F" }} />
                    <Typography variant="body2" color="text.secondary">Cargando puertos...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && !loadingDetail && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "create" ? "Nuevo puerto" : "Editar puerto"}</DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: "#06355F" }} />
              <Typography variant="body2" color="text.secondary">Cargando...</Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <TextField label="Nombre" value={currentPort.name ?? ""} onChange={(e) => handleDialogChange("name", e.target.value)} error={!!nameError} helperText={nameError ?? ""} required fullWidth />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!currentPort.is_international}
                    onChange={(e) => handleDialogChange("is_international", e.target.checked)}
                  />
                }
                label="Internacional"
              />
              <TextField label="Ubicación" value={currentPort.location ?? ""} onChange={(e) => handleDialogChange("location", e.target.value)} fullWidth />
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
        title="Eliminar puerto"
        message={`¿Seguro que deseas eliminar el puerto "${portToDelete?.name ?? ""}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setPortToDelete(null); }}
      />
    </Box>
  );
};
