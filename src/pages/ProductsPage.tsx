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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

const LOGISTICS_TYPES = [
  { value: "TERRESTRE", label: "TERRESTRE" },
  { value: "MARITIMO", label: "MARITIMO" },
] as const;

type Product = {
  id?: number;
  name?: string;
  logistics_type?: string | null;
  [key: string]: any;
};

type Mode = "create" | "edit";

export const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<Mode>("create");
  const [currentProduct, setCurrentProduct] = useState<Product>({});
  const [loadingProductDetail, setLoadingProductDetail] = useState(false);

  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("auth_token");

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : undefined,
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/products");
      const raw = res.data;
      const data: Product[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
            ? raw.items
            : [];
      setProducts(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        "Error al cargar los productos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateDialog = () => {
    setDialogMode("create");
    setCurrentProduct({});
    setLoadingProductDetail(false);
    setDialogOpen(true);
  };

  const openEditDialog = async (product: Product) => {
    if (product.id == null || product.id === undefined) return;
    setDialogMode("edit");
    setCurrentProduct({ id: product.id });
    setDialogOpen(true);
    setLoadingProductDetail(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/products/${product.id}`);
      setCurrentProduct(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al cargar el producto.";
      setError(msg);
      setDialogOpen(false);
    } finally {
      setLoadingProductDetail(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (product.id == null) return;
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      setSaving(true);
      await axiosInstance.delete(`/api/products/${product.id}`);
      await fetchProducts();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al eliminar el producto.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDialogChange = (field: string, value: string | null) => {
    setCurrentProduct((prev) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: currentProduct.name ?? "",
        logistics_type: currentProduct.logistics_type ?? null,
      };
      if (dialogMode === "create") {
        await axiosInstance.post("/api/products", payload);
      } else {
        if (currentProduct.id == null || currentProduct.id === undefined) {
          throw new Error("Falta el id del producto a actualizar.");
        }
        await axiosInstance.put(`/api/products/${currentProduct.id}`, payload);
      }
      setDialogOpen(false);
      await fetchProducts();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al guardar la información.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const columns =
    products.length > 0
      ? Object.keys(products[0]).filter((k) => k !== "id")
      : ["name", "logistics_type"];

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Productos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administración de productos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          sx={{ bgcolor: "#06355F" }}
        >
          Nuevo producto
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                  {col === "name" ? "Nombre" : col === "logistics_type" ? "Tipo logística" : col}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {col === "logistics_type"
                      ? product[col] === "TERRESTRE"
                        ? "TERRESTRE"
                        : product[col] === "MARITIMO"
                          ? "MARITIMO"
                          : String(product[col] ?? "")
                      : String(product[col] ?? "")}
                  </TableCell>
                ))}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => openEditDialog(product)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(product)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2}>
                  <Typography variant="body2" color="text.secondary">
                    No hay productos registrados.
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
                      Cargando productos...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && !loadingProductDetail && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create" ? "Nuevo producto" : "Editar producto"}
        </DialogTitle>
        <DialogContent>
          {loadingProductDetail ? (
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
                Cargando datos del producto...
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <TextField
                label="Nombre"
                value={currentProduct.name ?? ""}
                onChange={(e) => handleDialogChange("name", e.target.value)}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Tipo logística</InputLabel>
                <Select
                  value={currentProduct.logistics_type ?? ""}
                  label="Tipo logística"
                  onChange={(e) =>
                    handleDialogChange(
                      "logistics_type",
                      e.target.value as string,
                    )
                  }
                >
                  <MenuItem value="">
                    <em>Ninguno</em>
                  </MenuItem>
                  {LOGISTICS_TYPES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving || loadingProductDetail}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || loadingProductDetail}
            sx={{ bgcolor: "#06355F" }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
