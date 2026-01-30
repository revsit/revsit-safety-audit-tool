import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
    const { user, userRole, loading } = useAuth();

    if (loading) return <div className="h-screen flex items-center justify-center text-white bg-gray-900">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <div className="h-screen flex items-center justify-center text-white bg-gray-900">Access Denied: You do not have permission to view this page.</div>;
    }

    return <Outlet />;
}
