import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Connect socket
    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'https://quize-mona.onrender.com';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to server:', newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinQuizRoom = (quizId) => {
    if (socket && user && quizId) {
      socket.emit('join_quiz_room', { quizId, user });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinQuizRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
