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
import { parseApiError } from "../utils/parseApiError";
import { ConfirmDialog } from "../components/ConfirmDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Client = {
  id?: string | number;
  [key: string]: any;
};

type Mode = "create" | "edit";

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<Mode>("create");
  const [currentClient, setCurrentClient] = useState<Client>({});
  const [loadingClientDetail, setLoadingClientDetail] = useState(false);

  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const token = localStorage.getItem("auth_token");

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ajusta la ruta si tu backend usa otra (por ejemplo /api/clients)
      const res = await axiosInstance.get("/api/clients");
      const data: Client[] = res.data ?? [];
      setClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        "Error al cargar los clientes. Verifica el backend.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateDialog = () => {
    setDialogMode("create");
    setCurrentClient({});
    setLoadingClientDetail(false);
    setNameError(null);
    setEmailError(null);
    setDialogOpen(true);
  };

  const openEditDialog = async (client: Client) => {
    if (client.id == null || client.id === undefined) return;
    setDialogMode("edit");
    setCurrentClient({ id: client.id });
    setDialogOpen(true);
    setLoadingClientDetail(true);
    setNameError(null);
    setEmailError(null);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/clients/${client.id}`);
      setCurrentClient(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al cargar el cliente.";
      setError(msg);
      setDialogOpen(false);
    } finally {
      setLoadingClientDetail(false);
    }
  };

  const handleDeleteRequest = (client: Client) => {
    setClientToDelete(client);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete?.id) return;
    setConfirmOpen(false);
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/clients/${clientToDelete.id}`);
      await fetchClients();
    } catch (err) {
      setError(parseApiError(err, "Error al eliminar el cliente."));
    } finally {
      setSaving(false);
      setClientToDelete(null);
    }
  };

  const handleDialogChange = (field: string, value: string) => {
    if (field === "name") {
      setNameError(!value.trim() ? "El nombre es obligatorio." : null);
    }
    if (field === "email") {
      setEmailError(value && !EMAIL_REGEX.test(value) ? "El correo no tiene un formato válido." : null);
    }
    setCurrentClient((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    let hasError = false;
    if (!currentClient.name?.trim()) {
      setNameError("El nombre es obligatorio.");
      hasError = true;
    }
    const emailVal = currentClient.email ?? "";
    if (emailVal && !EMAIL_REGEX.test(emailVal)) {
      setEmailError("El correo no tiene un formato válido.");
      hasError = true;
    }
    if (hasError) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: currentClient.name ?? "",
        email: currentClient.email ?? null,
        phone: currentClient.phone ?? null,
        company: currentClient.company ?? null,
      };
      if (dialogMode === "create") {
        await axiosInstance.post("/api/clients", payload);
      } else {
        if (currentClient.id == null || currentClient.id === undefined) {
          throw new Error("Falta el id del cliente a actualizar.");
        }
        await axiosInstance.put(`/api/clients/${currentClient.id}`, payload);
      }
      setDialogOpen(false);
      await fetchClients();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al guardar la información.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const columns =
    clients.length > 0 ? Object.keys(clients[0]).filter((k) => k !== "id") : [];

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administración de clientes.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ bgcolor: "#06355F" }}
        >
          Nuevo cliente
        </Button>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600 }}>
                  {col}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id ?? JSON.stringify(client)}>
                <TableCell>{client.id}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {String(client[col] ?? "")}
                  </TableCell>
                ))}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => openEditDialog(client)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRequest(client)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2}>
                  <Typography variant="body2" color="text.secondary">
                    No hay clientes registrados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 3,
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={24} sx={{ color: "#06355F" }} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando clientes...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "create" ? "Nuevo cliente" : "Editar cliente"}
        </DialogTitle>
        <DialogContent>
          {loadingClientDetail ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
                gap: 2,
              }}
            >
              <CircularProgress size={28} sx={{ color: "#06355F" }} />
              <Typography variant="body2" color="text.secondary">
                Cargando...
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <TextField
                label="Nombre"
                value={currentClient.name ?? ""}
                onChange={(e) => handleDialogChange("name", e.target.value)}
                inputProps={{ minLength: 1 }}
                error={!!nameError}
                helperText={nameError ?? ""}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={currentClient.email ?? ""}
                onChange={(e) => handleDialogChange("email", e.target.value)}
                inputProps={{ maxLength: 254 }}
                error={!!emailError}
                helperText={emailError ?? ""}
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={currentClient.phone ?? ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  handleDialogChange("phone", val);
                }}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 15 }}
                fullWidth
              />
              <TextField
                label="Empresa"
                value={currentClient.company ?? ""}
                onChange={(e) => handleDialogChange("company", e.target.value)}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving || loadingClientDetail}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || loadingClientDetail || !!nameError || !!emailError}
            sx={{ bgcolor: "#06355F" }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar cliente"
        message={`¿Seguro que deseas eliminar al cliente "${clientToDelete?.name ?? ""}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setClientToDelete(null); }}
      />
    </Box>
  );
};

