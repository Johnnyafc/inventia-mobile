import { useState } from 'react';
import { useCameraPermissions } from 'expo-camera';

// ¡OJO! Debe decir "export const", no solo "const"
export const useScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Función que se ejecuta al detectar un código
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return { type, data: null };
    setScanned(true);
    return { type, data };
  };

  const resetScanner = () => setScanned(false);

  return {
    hasPermission: permission?.granted,
    requestPermission,
    scanned,
    handleBarCodeScanned,
    resetScanner,
    loading: !permission
  };
};