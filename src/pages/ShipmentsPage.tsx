import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

const API_BASE_URL = "http://localhost:8000";

const LOGISTICS_TYPES = [
  { value: "TERRESTRE", label: "TERRESTRE" },
  { value: "MARITIMO", label: "MARITIMO" },
] as const;

type Shipment = {
  id?: number;
  logistics_type?: string;
  tracking_number?: string;
  product_quantity?: number;
  delivery_date?: string;
  shipping_price?: number;
  client_id?: number;
  client_name?: string;
  product_id?: number;
  product_name?: string;
  vehicle_plate?: string | null;
  warehouse_id?: number | null;
  fleet_number?: string | null;
  port_id?: number | null;
  [key: string]: any;
};

type Mode = "create" | "edit";

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(v: string): string {
  if (!v) return "";
  return new Date(v).toISOString();
}

export const ShipmentsPage = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<Mode>("create");
  const [currentShipment, setCurrentShipment] = useState<Shipment>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<{ id: number; name?: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name?: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; name?: string }[]>([]);
  const [ports, setPorts] = useState<{ id: number; name?: string }[]>([]);

  const token = localStorage.getItem("auth_token");
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/shipments");
      const raw = res.data;
      const data: Shipment[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
      setShipments(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al cargar los envíos.");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [c, p, w, port] = await Promise.all([
        axiosInstance.get("/api/clients"),
        axiosInstance.get("/api/products"),
        axiosInstance.get("/api/warehouses"),
        axiosInstance.get("/api/ports"),
      ]);
      setClients(Array.isArray(c.data) ? c.data : c.data?.data ?? c.data?.items ?? []);
      setProducts(Array.isArray(p.data) ? p.data : p.data?.data ?? p.data?.items ?? []);
      setWarehouses(Array.isArray(w.data) ? w.data : w.data?.data ?? w.data?.items ?? []);
      setPorts(Array.isArray(port.data) ? port.data : port.data?.data ?? port.data?.items ?? []);
    } catch {
      setError("Error al cargar clientes, productos, bodegas o puertos.");
    }
  };

  useEffect(() => {
    fetchShipments();
    loadOptions();
  }, []);

  const openCreateDialog = () => {
    setDialogMode("create");
    setCurrentShipment({ logistics_type: "TERRESTRE" });
    setLoadingDetail(false);
    setDialogOpen(true);
  };

  const openEditDialog = async (shipment: Shipment) => {
    if (shipment.id == null) return;
    setDialogMode("edit");
    setCurrentShipment({ id: shipment.id });
    setDialogOpen(true);
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/shipments/${shipment.id}`);
      setCurrentShipment(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al cargar el envío.");
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (shipment: Shipment) => {
    if (shipment.id == null) return;
    if (!window.confirm("¿Eliminar este envío?")) return;
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/shipments/${shipment.id}`);
      await fetchShipments();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDialogChange = (field: string, value: string | number | null | undefined) => {
    setCurrentShipment((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const isLand = currentShipment.logistics_type === "TERRESTRE";
      const deliveryDate = currentShipment.delivery_date?.includes("T")
        ? currentShipment.delivery_date
        : fromDatetimeLocal(currentShipment.delivery_date as string);

      if (dialogMode === "create") {
        const payload: Record<string, unknown> = {
          logistics_type: currentShipment.logistics_type ?? "TERRESTRE",
          tracking_number: (currentShipment.tracking_number ?? "").trim().slice(0, 10),
          product_quantity: Number(currentShipment.product_quantity) || 1,
          delivery_date: deliveryDate,
          shipping_price: Number(currentShipment.shipping_price) || 0,
          client_id: Number(currentShipment.client_id),
          product_id: Number(currentShipment.product_id),
          vehicle_plate: isLand ? (currentShipment.vehicle_plate ?? null) : null,
          warehouse_id: isLand ? (currentShipment.warehouse_id ? Number(currentShipment.warehouse_id) : null) : null,
          fleet_number: !isLand ? (currentShipment.fleet_number ?? null) : null,
          port_id: !isLand ? (currentShipment.port_id ? Number(currentShipment.port_id) : null) : null,
        };
        await axiosInstance.post("/api/shipments", payload);
      } else {
        if (currentShipment.id == null) throw new Error("Falta id.");
        const payload: Record<string, unknown> = {
          product_quantity: Number(currentShipment.product_quantity) || 1,
          delivery_date: deliveryDate,
          shipping_price: Number(currentShipment.shipping_price) || 0,
          vehicle_plate: isLand ? (currentShipment.vehicle_plate ?? null) : null,
          warehouse_id: isLand ? (currentShipment.warehouse_id ? Number(currentShipment.warehouse_id) : null) : null,
          fleet_number: !isLand ? (currentShipment.fleet_number ?? null) : null,
          port_id: !isLand ? (currentShipment.port_id ? Number(currentShipment.port_id) : null) : null,
        };
        await axiosInstance.put(`/api/shipments/${currentShipment.id}`, payload);
      }
      setDialogOpen(false);
      await fetchShipments();
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Error al guardar.";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const tableColumns = [
    "id",
    "logistics_type",
    "tracking_number",
    "product_quantity",
    "delivery_date",
    "shipping_price",
    "client_name",
    "product_name",
  ];
  const colLabels: Record<string, string> = {
    logistics_type: "Tipo",
    tracking_number: "Nº seguimiento",
    product_quantity: "Cantidad",
    delivery_date: "Fecha entrega",
    shipping_price: "Precio envío",
    client_name: "Cliente",
    product_name: "Producto",
  };

  const isLand = currentShipment.logistics_type === "TERRESTRE";

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Envíos</Typography>
          <Typography variant="body2" color="text.secondary">Crear, editar y eliminar envíos terrestres y marítimos.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ bgcolor: "#06355F" }}>
          Nuevo envío
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {tableColumns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600 }}>{colLabels[col] ?? col}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shipments.map((s) => (
              <TableRow key={s.id}>
                {tableColumns.map((col) => (
                  <TableCell key={col}>
                    {col === "delivery_date" && s[col]
                      ? new Date(s[col]).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                      : String(s[col] ?? "")}
                  </TableCell>
                ))}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(s)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(s)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && shipments.length === 0 && (
              <TableRow><TableCell colSpan={tableColumns.length + 1}><Typography variant="body2" color="text.secondary">No hay envíos.</Typography></TableCell></TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={tableColumns.length + 1}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
                    <CircularProgress size={24} sx={{ color: "#06355F" }} />
                    <Typography variant="body2" color="text.secondary">Cargando envíos...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && !loadingDetail && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "create" ? "Nuevo envío" : "Editar envío"}</DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4, gap: 2 }}>
              <CircularProgress size={28} sx={{ color: "#06355F" }} />
              <Typography variant="body2" color="text.secondary">Cargando...</Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <FormControl fullWidth>
                <InputLabel>Tipo logística</InputLabel>
                <Select
                  value={currentShipment.logistics_type ?? "TERRESTRE"}
                  label="Tipo logística"
                  onChange={(e) => handleDialogChange("logistics_type", e.target.value)}
                >
                  {LOGISTICS_TYPES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Nº seguimiento (10 caracteres)"
                value={currentShipment.tracking_number ?? ""}
                onChange={(e) => handleDialogChange("tracking_number", e.target.value.slice(0, 10))}
                inputProps={{ maxLength: 10 }}
                required
                fullWidth
              />
              <TextField
                label="Cantidad"
                type="number"
                inputProps={{ min: 1 }}
                value={currentShipment.product_quantity ?? ""}
                onChange={(e) => handleDialogChange("product_quantity", e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Fecha de entrega"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={toDatetimeLocal(currentShipment.delivery_date)}
                onChange={(e) => handleDialogChange("delivery_date", fromDatetimeLocal(e.target.value))}
                required
                fullWidth
              />
              <TextField
                label="Precio envío"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={currentShipment.shipping_price ?? ""}
                onChange={(e) => handleDialogChange("shipping_price", e.target.value)}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={currentShipment.client_id ?? ""}
                  label="Cliente"
                  onChange={(e) => handleDialogChange("client_id", e.target.value)}
                  required
                >
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name ?? `Cliente ${c.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={currentShipment.product_id ?? ""}
                  label="Producto"
                  onChange={(e) => handleDialogChange("product_id", e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name ?? `Producto ${p.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {isLand && (
                <>
                  <TextField
                    label="Placa (AAA123)"
                    placeholder="AAA123"
                    value={currentShipment.vehicle_plate ?? ""}
                    onChange={(e) => handleDialogChange("vehicle_plate", e.target.value.toUpperCase().slice(0, 6))}
                    required
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Bodega</InputLabel>
                    <Select
                      value={currentShipment.warehouse_id ?? ""}
                      label="Bodega"
                      onChange={(e) => handleDialogChange("warehouse_id", e.target.value)}
                      required
                    >
                      {warehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>{w.name ?? `Bodega ${w.id}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
              {!isLand && (
                <>
                  <TextField
                    label="Nº flota (AAA1234A)"
                    placeholder="AAA1234A"
                    value={currentShipment.fleet_number ?? ""}
                    onChange={(e) => handleDialogChange("fleet_number", e.target.value.toUpperCase().slice(0, 8))}
                    required
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Puerto</InputLabel>
                    <Select
                      value={currentShipment.port_id ?? ""}
                      label="Puerto"
                      onChange={(e) => handleDialogChange("port_id", e.target.value)}
                      required
                    >
                      {ports.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name ?? `Puerto ${p.id}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
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
