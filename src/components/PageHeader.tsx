import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onAdd: () => void;
  error?: string | null;
  onErrorClose?: () => void;
  maxWidth?: number;
  extra?: ReactNode;
};

export const PageHeader = ({
  title,
  subtitle,
  buttonLabel,
  onAdd,
  error,
  onErrorClose,
  maxWidth = 1200,
  extra,
}: PageHeaderProps) => (
  <Box sx={{ maxWidth, mx: "auto" }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
      <Box>
        <Typography variant="h5" fontWeight={600}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {extra}
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ bgcolor: "#06355F" }}>
          {buttonLabel}
        </Button>
      </Stack>
    </Stack>
    {error && (
      <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorClose}>
        {error}
      </Alert>
    )}
  </Box>
);
