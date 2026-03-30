import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// Usage: <RoleGuard roles={['admin', 'staff']}>...</RoleGuard>
export default function RoleGuard({ roles, children }) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
