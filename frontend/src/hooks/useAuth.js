import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectUser,
  selectRole,
  selectIsLoggedIn,
  logout,
} from "../store/authSlice";
import authService from "../services/auth.service";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const hasRole = (...roles) => roles.includes(role);

  return { user, role, isLoggedIn, handleLogout, hasRole };
};
