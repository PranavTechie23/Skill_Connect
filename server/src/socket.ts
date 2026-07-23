import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import express from "express";

export const activeSockets = new Map<string, Set<string>>();
let io: Server;

export function initSocket(httpServer: HttpServer, sessionMiddleware: express.RequestHandler) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5002',
        'http://localhost:5003',
        'http://localhost:3000',
        'https://skill-connect-alpha.vercel.app',
        process.env.FRONTEND_URL || ''
      ].filter(Boolean),
      credentials: true
    }
  });

  // Wrap express middleware for socket.io
  const wrap = (middleware: express.RequestHandler) => (socket: Socket, next: any) => middleware(socket.request as any, {} as any, next);
  
  io.use(wrap(sessionMiddleware));

  io.use((socket, next) => {
    // @ts-ignore - session is injected by wrap(sessionMiddleware)
    const session = socket.request.session;
    if (session && session.userId) {
      // @ts-ignore
      socket.userId = session.userId;
      next();
    } else {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    // @ts-ignore
    const userId = socket.userId as string;
    
    if (!activeSockets.has(userId)) {
      activeSockets.set(userId, new Set());
    }
    activeSockets.get(userId)!.add(socket.id);
    
    console.log(`Socket connected for user ${userId}: ${socket.id}`);

    socket.on("disconnect", () => {
      const userSockets = activeSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeSockets.delete(userId);
        }
      }
      console.log(`Socket disconnected for user ${userId}: ${socket.id}`);
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  const userSockets = activeSockets.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
}
