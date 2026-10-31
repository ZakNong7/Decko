import { io } from 'socket.io-client';

const getSocketURL = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5001`;
  }
  return 'http://127.0.0.1:5001';
};

const socket = io(getSocketURL());

export default socket;
