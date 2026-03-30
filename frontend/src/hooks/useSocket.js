import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { selectToken } from "../store/authSlice";

let socketInstance = null; // singleton — one connection for the app

export const useSocket = () => {
  const token = useSelector(selectToken);
  const ref = useRef(null);

  useEffect(() => {
    if (!token) return;

    socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    ref.current = socketInstance;

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
    };
  }, [token]);

  return ref.current;
};
