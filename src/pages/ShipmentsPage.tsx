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
  FormHelperText,
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
import { parseApiError } from "../utils/parseApiError";
import { ConfirmDialog } from "../components/ConfirmDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(null);

  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [shippingPriceError, setShippingPriceError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [deliveryDateError, setDeliveryDateError] = useState<string | null>(null);
  const [warehouseError, setWarehouseError] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);

  const TRACKING_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{10}$/;
  const PLATE_REGEX = /^[A-Z]{3}[0-9]{3}$/;
  const FLEET_REGEX = /^[A-Z]{3}[0-9]{4}[A-Z]$/;

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
      setError(parseApiError(err, "Error al cargar los envíos."));
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
    setTrackingError(null);
    setPlateError(null);
    setFleetError(null);
    setShippingPriceError(null);
    setClientError(null);
    setProductError(null);
    setDeliveryDateError(null);
    setWarehouseError(null);
    setPortError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (shipment: Shipment) => {
    if (shipment.id == null) return;
    setDialogMode("edit");
    setCurrentShipment({ id: shipment.id });
    setDialogOpen(true);
    setLoadingDetail(true);
    setShippingPriceError(null);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/shipments/${shipment.id}`);
      setCurrentShipment(res.data);
    } catch (err: any) {
      setError(parseApiError(err, "Error al cargar el envío."));
      setDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteRequest = (shipment: Shipment) => {
    setShipmentToDelete(shipment);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (shipmentToDelete?.id == null) return;
    setConfirmOpen(false);
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/shipments/${shipmentToDelete.id}`);
      await fetchShipments();
    } catch (err) {
      setError(parseApiError(err, "Error al eliminar."));
    } finally {
      setSaving(false);
      setShipmentToDelete(null);
    }
  };

  const handleDialogChange = (field: string, value: string | number | null | undefined) => {
    setCurrentShipment((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleSave = async () => {
    if (dialogMode === "create") {
      const isLandCheck = currentShipment.logistics_type === "TERRESTRE";
      const trackingVal = (currentShipment.tracking_number ?? "").trim();
      const plateVal = (currentShipment.vehicle_plate ?? "").trim();
      const fleetVal = (currentShipment.fleet_number ?? "").trim();

      let hasError = false;

      if (!TRACKING_REGEX.test(trackingVal)) {
        setTrackingError("Debe tener exactamente 10 caracteres con letras y números (no solo letras ni solo números).");
        hasError = true;
      } else {
        setTrackingError(null);
      }

      if (isLandCheck) {
        if (!PLATE_REGEX.test(plateVal)) {
          setPlateError("Formato inválido. Debe ser 3 letras mayúsculas + 3 números. Ej: AAA123.");
          hasError = true;
        } else {
          setPlateError(null);
        }
      } else {
        setPlateError(null);
        if (!FLEET_REGEX.test(fleetVal)) {
          setFleetError("Formato inválido. Debe ser 3 letras + 4 números + 1 letra. Ej: AAA1234A.");
          hasError = true;
        } else {
          setFleetError(null);
        }
      }

      if (!currentShipment.shipping_price || Number(currentShipment.shipping_price) <= 0) {
        setShippingPriceError("El precio de envío debe ser mayor a 0.");
        hasError = true;
      } else {
        setShippingPriceError(null);
      }

      if (!currentShipment.client_id) {
        setClientError("Debe seleccionar un cliente.");
        hasError = true;
      } else {
        setClientError(null);
      }

      if (!currentShipment.product_id) {
        setProductError("Debe seleccionar un producto.");
        hasError = true;
      } else {
        setProductError(null);
      }

      if (!currentShipment.delivery_date) {
        setDeliveryDateError("La fecha de entrega es obligatoria.");
        hasError = true;
      } else {
        setDeliveryDateError(null);
      }

      if (isLandCheck) {
        if (!currentShipment.warehouse_id) {
          setWarehouseError("Debe seleccionar una bodega.");
          hasError = true;
        } else {
          setWarehouseError(null);
        }
      } else {
        setWarehouseError(null);
        if (!currentShipment.port_id) {
          setPortError("Debe seleccionar un puerto.");
          hasError = true;
        } else {
          setPortError(null);
        }
      }

      if (hasError) return;
    } else {
      if (!currentShipment.shipping_price || Number(currentShipment.shipping_price) <= 0) {
        setShippingPriceError("El precio de envío debe ser mayor a 0.");
        return;
      }
      setShippingPriceError(null);
    }

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
        const payload = {
          product_quantity: Number(currentShipment.product_quantity) || 1,
          shipping_price: Number(currentShipment.shipping_price) || 0,
        };
        await axiosInstance.put(`/api/shipments/${currentShipment.id}`, payload);
      }
      setDialogOpen(false);
      await fetchShipments();
    } catch (err: any) {
      setError(parseApiError(err, "Error al guardar."));
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
    "final_price",
    "client_name",
    "product_name",
  ];
  const colLabels: Record<string, string> = {
    logistics_type: "Tipo",
    tracking_number: "Nº seguimiento",
    product_quantity: "Cantidad",
    delivery_date: "Fecha entrega",
    shipping_price: "Precio envío",
    final_price: "Precio final",
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
                      : col === "shipping_price" || col === "final_price"
                        ? s[col] != null
                          ? Number(s[col]).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                          : ""
                        : String(s[col] ?? "")}
                  </TableCell>
                ))}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" color="primary" onClick={() => openEditDialog(s)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteRequest(s)}><DeleteIcon fontSize="small" /></IconButton>
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
          ) : dialogMode === "edit" ? (
            <Stack spacing={2} mt={1}>
              <TextField
                label="Cantidad"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={currentShipment.product_quantity ?? ""}
                onChange={(e) => handleDialogChange("product_quantity", Math.max(1, parseInt(e.target.value) || 1))}
                helperText="Entero mayor a 0"
                required
                fullWidth
              />
              <TextField
                label="Precio envío"
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                value={currentShipment.shipping_price ?? ""}
                onChange={(e) => {
                  handleDialogChange("shipping_price", e.target.value);
                  setShippingPriceError(
                    !e.target.value || Number(e.target.value) <= 0
                      ? "El precio de envío debe ser mayor a 0."
                      : null
                  );
                }}
                error={!!shippingPriceError}
                helperText={shippingPriceError ?? "Mayor a 0"}
                required
                fullWidth
              />
            </Stack>
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
                label="Nº seguimiento"
                placeholder="Ej: AB12CD34EF"
                value={currentShipment.tracking_number ?? ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 10);
                  handleDialogChange("tracking_number", val);
                  setTrackingError(val.length > 0 && !TRACKING_REGEX.test(val) ? "Debe tener exactamente 10 caracteres con letras y números (no solo letras ni solo números)." : null);
                }}
                inputProps={{ maxLength: 10, pattern: "[A-Za-z0-9]{10}" }}
                error={!!trackingError}
                helperText={trackingError ?? "10 caracteres alfanuméricos (letras y números). Ej: AB12CD34EF"}
                required
                fullWidth
              />
              <TextField
                label="Cantidad"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={currentShipment.product_quantity ?? ""}
                onChange={(e) => handleDialogChange("product_quantity", Math.max(1, parseInt(e.target.value) || 1))}
                helperText="Entero mayor a 0"
                required
                fullWidth
              />
              <TextField
                label="Fecha de entrega"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={toDatetimeLocal(currentShipment.delivery_date)}
                onChange={(e) => {
                  handleDialogChange("delivery_date", fromDatetimeLocal(e.target.value));
                  setDeliveryDateError(e.target.value ? null : "La fecha de entrega es obligatoria.");
                }}
                error={!!deliveryDateError}
                helperText={deliveryDateError ?? ""}
                required
                fullWidth
              />
              <TextField
                label="Precio envío"
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                value={currentShipment.shipping_price ?? ""}
                onChange={(e) => {
                  handleDialogChange("shipping_price", e.target.value);
                  setShippingPriceError(
                    !e.target.value || Number(e.target.value) <= 0
                      ? "El precio de envío debe ser mayor a 0."
                      : null
                  );
                }}
                error={!!shippingPriceError}
                helperText={shippingPriceError ?? "Mayor a 0"}
                required
                fullWidth
              />
              <FormControl fullWidth error={!!clientError}>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={currentShipment.client_id ?? ""}
                  label="Cliente"
                  onChange={(e) => {
                    handleDialogChange("client_id", e.target.value);
                    setClientError(e.target.value ? null : "Debe seleccionar un cliente.");
                  }}
                  required
                >
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name ?? `Cliente ${c.id}`}</MenuItem>
                  ))}
                </Select>
                {clientError && <FormHelperText>{clientError}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth error={!!productError}>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={currentShipment.product_id ?? ""}
                  label="Producto"
                  onChange={(e) => {
                    handleDialogChange("product_id", e.target.value);
                    setProductError(e.target.value ? null : "Debe seleccionar un producto.");
                  }}
                  required
                >
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name ?? `Producto ${p.id}`}</MenuItem>
                  ))}
                </Select>
                {productError && <FormHelperText>{productError}</FormHelperText>}
              </FormControl>
              {isLand && (
                <>
                  <TextField
                    label="Placa"
                    placeholder="AAA123"
                    value={currentShipment.vehicle_plate ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
                      handleDialogChange("vehicle_plate", val);
                      setPlateError(val.length > 0 && !PLATE_REGEX.test(val) ? "Formato inválido. Debe ser 3 letras mayúsculas + 3 números. Ej: AAA123." : null);
                    }}
                    inputProps={{ maxLength: 6, pattern: "[A-Z]{3}[0-9]{3}" }}
                    error={!!plateError}
                    helperText={plateError ?? "Formato: AAA123 (3 letras mayúsculas + 3 números)"}
                    required
                    fullWidth
                  />
                  <FormControl fullWidth error={!!warehouseError}>
                    <InputLabel>Bodega</InputLabel>
                    <Select
                      value={currentShipment.warehouse_id ?? ""}
                      label="Bodega"
                      onChange={(e) => {
                        handleDialogChange("warehouse_id", e.target.value);
                        setWarehouseError(e.target.value ? null : "Debe seleccionar una bodega.");
                      }}
                      required
                    >
                      {warehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>{w.name ?? `Bodega ${w.id}`}</MenuItem>
                      ))}
                    </Select>
                    {warehouseError && <FormHelperText>{warehouseError}</FormHelperText>}
                  </FormControl>
                </>
              )}
              {!isLand && (
                <>
                  <TextField
                    label="Nº flota"
                    placeholder="AAA1234A"
                    value={currentShipment.fleet_number ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
                      handleDialogChange("fleet_number", val);
                      setFleetError(val.length > 0 && !FLEET_REGEX.test(val) ? "Formato inválido. Debe ser 3 letras + 4 números + 1 letra. Ej: AAA1234A." : null);
                    }}
                    inputProps={{ maxLength: 8, pattern: "[A-Z]{3}[0-9]{4}[A-Z]" }}
                    error={!!fleetError}
                    helperText={fleetError ?? "Formato: AAA1234A (3 letras + 4 números + 1 letra)"}
                    required
                    fullWidth
                  />
                  <FormControl fullWidth error={!!portError}>
                    <InputLabel>Puerto</InputLabel>
                    <Select
                      value={currentShipment.port_id ?? ""}
                      label="Puerto"
                      onChange={(e) => {
                        handleDialogChange("port_id", e.target.value);
                        setPortError(e.target.value ? null : "Debe seleccionar un puerto.");
                      }}
                      required
                    >
                      {ports.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name ?? `Puerto ${p.id}`}</MenuItem>
                      ))}
                    </Select>
                    {portError && <FormHelperText>{portError}</FormHelperText>}
                  </FormControl>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving || loadingDetail} color="inherit">Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || loadingDetail || !!(trackingError || plateError || fleetError || shippingPriceError || clientError || productError || deliveryDateError || warehouseError || portError)}
            sx={{ bgcolor: "#06355F" }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar envío"
        message={`¿Seguro que deseas eliminar el envío con seguimiento "${shipmentToDelete?.tracking_number ?? ""}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setShipmentToDelete(null); }}
      />
    </Box>
  );
};
