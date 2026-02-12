// Custom React Hook for WebSocket Real-time Sync

import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId, onJarsUpdate, onTransactionUpdate, onBalanceUpdate) => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId || socketRef.current?.connected) return;

    const token = localStorage.getItem('clearcash_token');
    if (!token) return;

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data.userId);
    });

    socket.on('auth_error', (error) => {
      console.error('WebSocket auth error:', error);
    });

    socket.on('sync:jars', (data) => {
      console.log('Received jars sync:', data);
      if (onJarsUpdate) {
        onJarsUpdate(data.jars);
      }
    });

    socket.on('sync:transactions', (data) => {
      console.log('Received transaction sync:', data);
      if (onTransactionUpdate) {
        onTransactionUpdate(data.transaction);
      }
    });

    socket.on('sync:balance', (data) => {
      console.log('Received balance sync:', data);
      if (onBalanceUpdate) {
        onBalanceUpdate(data.balance);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      
      // Attempt to reconnect after delay
      if (reason === 'io server disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          socket.connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socketRef.current = socket;
  }, [userId, onJarsUpdate, onTransactionUpdate, onBalanceUpdate]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Setup and cleanup
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    connected: socketRef.current?.connected || false,
    socket: socketRef.current,
  };
};
