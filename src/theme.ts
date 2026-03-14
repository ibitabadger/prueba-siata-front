import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    // Usamos una paleta base clara para que texto y placeholders
    // contrasten bien sobre fondos blancos.
    mode: "light",
    primary: {
      main: "#1565c0", // azul principal
    },
    background: {
      default: "#f1f5f9", // gris muy claro para el fondo general
      paper: "#ffffff", // tarjetas / Paper en blanco
    },
    text: {
      primary: "#020617", // casi negro, buena lectura sobre blanco
      secondary: "#475569", // gris para subtítulos ("plataforma logística", etc.)
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 999,
        },
      },
    },
  },
});

