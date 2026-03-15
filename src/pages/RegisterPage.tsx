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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("El correo no tiene un formato válido.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      setSuccess("Usuario creado correctamente. Ahora puedes iniciar sesión.");
      setTimeout(() => navigate("/auth/login"), 1200);
    } catch (err) {
      setError(parseApiError(err, "Error al registrar el usuario. Intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <Stack spacing={2} sx={{ width: "100%", mt: 1 }}>
        <Typography variant="h6" align="left">
          Crear cuenta
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputProps={{ minLength: 1 }}
          required
          fullWidth
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(e.target.value && !EMAIL_REGEX.test(e.target.value) ? "El correo no tiene un formato válido." : null);
          }}
          inputProps={{ maxLength: 40 }}
          error={!!emailError}
          helperText={emailError ?? ""}
          required
          fullWidth
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ minLength: 6 }}
          helperText="Mínimo 6 caracteres"
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
          {loading ? "Registrando..." : "Registrarse"}
        </Button>
        <Typography variant="body2" align="center">
          ¿Ya tienes cuenta?{" "}
          <Link component={RouterLink} to="/auth/login" underline="hover">
            Inicia sesión
          </Link>
        </Typography>
      </Stack>
    </form>
  );
};

