import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

function normalizeSocketMessage(raw: Record<string, unknown>) {
  return {
    ...raw,
    id: raw.id,
    senderId: String(raw.senderId ?? raw.sender_id ?? ""),
    receiverId: String(raw.receiverId ?? raw.receiver_id ?? ""),
    applicationId: raw.applicationId ?? raw.application_id ?? null,
    content: String(raw.content ?? ""),
    isRead: Boolean(raw.isRead ?? raw.is_read),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestMessage: any | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  latestMessage: null,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestMessage, setLatestMessage] = useState<any | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to socket.io
    const socketInstance = io(window.location.origin, {
      withCredentials: true,
      path: "/socket.io"
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected!");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected.");
    });

    socketInstance.on("newMessage", (message) => {
      const normalized = normalizeSocketMessage(message as Record<string, unknown>);
      setLatestMessage(normalized);

      const path = window.location.pathname;
      const isOnMessagesPage =
        path.startsWith("/employee/messages") ||
        path.startsWith("/employer/messages") ||
        path.startsWith("/employee/dashboard") ||
        path.startsWith("/employer/dashboard");

      if (!isOnMessagesPage && normalized.senderId !== user.id) {
        toast.info("New Message", {
          description:
            normalized.content.substring(0, 50) +
            (normalized.content.length > 50 ? "..." : ""),
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, latestMessage }}>
      {children}
    </SocketContext.Provider>
  );
}