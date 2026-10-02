import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { services } from "../../../services";
import { useSession } from "../../../shared/auth/useSession";
import { roleLabels } from "../../../shared/auth/permissions";
import { ErrorState, LoadingState } from "../../../shared/components/Feedback";
import { BoxTitle } from "../../../shared/components/OrdersPage";
export default function UsersPage() {
  const session = useSession("backoffice");
  const query = useQuery({
    queryKey: ["backoffice", session.data?.id, "users"],
    queryFn: services.management.users,
  });
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  return (
    <Stack spacing={3}>
      <BoxTitle
        title="Tài khoản demo"
        description="Danh sách chỉ đọc dành cho admin. Quản lý tài khoản đầy đủ nằm ở M6."
      />
      <Paper variant="outlined">
        <TableContainer>
          <Table sx={{ minWidth: 570 }} aria-label="Tài khoản demo">
            <TableHead>
              <TableRow>
                <TableCell>Tên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell component="th" scope="row">
                    {u.name}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{roleLabels[u.role]}</TableCell>
                  <TableCell>{u.isActive ? "Hoạt động" : "Đã khóa"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
