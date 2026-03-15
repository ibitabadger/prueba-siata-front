import type { ReactNode } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

type CrudTableProps<T extends Record<string, any>> = {
  columns: ColumnDef<T>[];
  data: T[];
  loading: boolean;
  emptyMessage: string;
  loadingMessage: string;
  getRowKey: (row: T) => string | number;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
};

export function CrudTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage,
  loadingMessage,
  getRowKey,
  onEdit,
  onDelete,
}: CrudTableProps<T>) {
  const totalCols = columns.length + 1;

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                {col.label}
              </TableCell>
            ))}
            <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </TableCell>
              ))}
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {!loading && data.length === 0 && (
            <TableRow>
              <TableCell colSpan={totalCols}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={totalCols}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 3, gap: 2 }}>
                  <CircularProgress size={24} sx={{ color: "#06355F" }} />
                  <Typography variant="body2" color="text.secondary">
                    {loadingMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
