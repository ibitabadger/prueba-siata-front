import { useState } from "react";
import {
  Alert,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const token = res.data.access_token;
      localStorage.setItem("auth_token", token);
      navigate("/"); // luego podrás redirigir al dashboard
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? "Error al iniciar sesión. Intenta de nuevo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <Stack spacing={2} sx={{ width: "100%", mt: 1 }}>
        <Typography variant="h6" align="left">
          Iniciar sesión
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
        <Typography variant="body2" align="center">
          ¿No tienes cuenta?{" "}
          <Link component={RouterLink} to="/auth/register" underline="hover">
            Regístrate
          </Link>
        </Typography>
      </Stack>
    </form>
  );
};

