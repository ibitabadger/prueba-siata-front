import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #06355F 0, #020617 55%, #000 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            bgcolor: "#ffffff",
            borderRadius: 4,
          }}
        >
          <Stack spacing={1} alignItems="center">
          <img src="/logo_logistica.png" alt="Logo" width="60%" height="60%" />
            
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={600}>
                Plataforma Logística
              </Typography>
              <Typography variant="body2" color="text.primary">
                Gestión de envíos terrestres y marítimos
              </Typography>
            </Box>
            <Outlet />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

