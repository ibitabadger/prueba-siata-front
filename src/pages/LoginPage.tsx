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
import { parseApiError } from "../utils/parseApiError";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("El correo no tiene un formato válido.");
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      hasError = true;
    }
    if (hasError) return;
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const token = res.data.access_token;
      localStorage.setItem("auth_token", token);
      navigate("/"); 
    } catch (err) {
      setError(parseApiError(err, "Error al iniciar sesión. Intenta de nuevo."));
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
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(e.target.value && !EMAIL_REGEX.test(e.target.value) ? "El correo no tiene un formato válido." : null);
          }}
          inputProps={{ maxLength: 254 }}
          error={!!emailError}
          helperText={emailError ?? ""}
          required
          fullWidth
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(
              e.target.value.length > 0 && e.target.value.length < 6
                ? "La contraseña debe tener al menos 6 caracteres."
                : null
            );
          }}
          inputProps={{ minLength: 6 }}
          error={!!passwordError}
          helperText={passwordError ?? "Mínimo 6 caracteres"}
          required
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || !!emailError || !!passwordError}
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

