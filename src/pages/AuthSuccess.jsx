import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../features/authSlice";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    if (accessToken) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.message.user) {
            localStorage.setItem("authToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("authUser", JSON.stringify(data.message.user));

            dispatch(login({ user: data.message.user, token: accessToken }));
            navigate("/dashboard");
          } else {
            navigate("/login?error=auth_failed");
          }
        });
    } else {
      navigate("/login?error=auth_failed");
    }
  }, [dispatch, navigate]);

  return <p>Signing you in...</p>;
}
