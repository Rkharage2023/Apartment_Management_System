import { useEffect } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useSocket } from "./useSocket";
import { addNotification } from "../store/notifSlice";

export const useNotification = () => {
  const dispatch = useDispatch();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotif = (notif) => {
      dispatch(addNotification(notif));
      toast(notif.message, { icon: "🔔" });
    };

    socket.on("notification", handleNotif);
    socket.on("complaint:updated", (d) =>
      handleNotif({ ...d, type: "complaint" }),
    );
    socket.on("visitor:arrived", (d) => handleNotif({ ...d, type: "visitor" }));
    socket.on("bill:generated", (d) => handleNotif({ ...d, type: "billing" }));

    return () => {
      socket.off("notification");
      socket.off("complaint:updated");
      socket.off("visitor:arrived");
      socket.off("bill:generated");
    };
  }, [socket, dispatch]);
};
