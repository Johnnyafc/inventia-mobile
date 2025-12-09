import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera'; 
import { Ionicons } from '@expo/vector-icons';

// Hooks y Configuración
import { useScanner } from '../hooks/useScanner';
import { auth } from '../config/firebase';

// Componentes
import { ScannerOverlay } from '../components/ScannerOverlay'; 
import CreateProductForm from '../components/forms/CreateProductForm';

export default function ScannerScreen({ onBack }) {
  // 1. Hook de la cámara
  const { 
    hasPermission, 
    requestPermission, 
    scanned, 
    handleBarCodeScanned, 
    resetScanner 
  } = useScanner();

  // 2. Estados locales
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [productData, setProductData] = useState(null); // Datos de la API
  const [fetching, setFetching] = useState(false); // Spinner de carga

  // Pedir permiso al montar
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // --- FUNCIÓN: CONSULTAR OPEN FOOD FACTS ---
  const fetchProductData = async (barcode) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const json = await response.json();
      
      if (json.status === 1) {
        return {
          nombre: json.product.product_name || '',
          marca: json.product.brands || '',
          categoria: json.product.categories ? json.product.categories.split(',')[0] : '',
          imagen: json.product.image_url
        };
      }
      return null; // No encontrado
    } catch (error) {
      console.log("Error API:", error);
      return null;
    }
  };

  // --- LÓGICA AL ESCANEAR ---
  const onCodeScanned = async ({ type, data }) => {
    if (scanned || fetching) return; // Evitar lecturas dobles
    
    handleBarCodeScanned({ type, data }); // Pausar cámara interna
    setFetching(true); // Mostrar "Buscando..."

    // 1. Buscar en Internet
    const apiData = await fetchProductData(data);
    
    setFetching(false); // Ocultar "Buscando..."

    // 2. Avisar al usuario el resultado
    if (apiData) {
      Alert.alert("¡Encontrado!", `Producto detectado: ${apiData.nombre}`);
    } else {
      Alert.alert(
        "No registrado", 
        "Este producto no aparece en la base de datos global. Por favor ingresa los datos manualmente."
      );
    }
    
    // 3. Abrir el formulario (con datos o vacío)
    setScannedCode(data);
    setProductData(apiData); 
    setModalVisible(true);
  };

  // Cerrar modal y reiniciar escáner
  const handleCloseModal = () => {
    setModalVisible(false);
    setScannedCode(null);
    setProductData(null);
    resetScanner(); // ¡Vital para escanear el siguiente!
  };

  const handleSuccess = () => {
    setModalVisible(false);
    resetScanner();
    Alert.alert("Éxito", "Producto guardado correctamente en tu inventario.");
  };

  // --- RENDERIZADO ---
  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>Solicitando permiso...</Text></View>;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Sin acceso a la cámara</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPermiso}>
          <Text style={styles.btnText}>Dar Permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : onCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "code128"],
        }}
      />
      
      {/* Overlay Visual */}
      <ScannerOverlay />

      {/* Spinner de carga (mientras busca en la API) */}
      {fetching && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={{color: 'white', marginTop: 10, fontWeight: 'bold'}}>Buscando información...</Text>
        </View>
      )}

      {/* Botón X para cerrar el escáner */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>

      {/* MODAL CON FORMULARIO */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              onPress={handleCloseModal} 
              style={styles.closeModalBtn}
            >
               <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            {/* Formulario que recibe los datos de la API (si existen) */}
            <CreateProductForm 
              initialCode={scannedCode} 
              initialData={productData} // Pasamos nombre/marca si se encontraron
              user={auth.currentUser} 
              onSuccess={handleSuccess} 
              onCancel={handleCloseModal}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  text: { 
    color: 'white', 
    fontSize: 16, 
    marginBottom: 20 
  },
  btnPermiso: {
    backgroundColor: '#E91E63',
    padding: 10,
    borderRadius: 8
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  
  // Botón flotante para salir
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    padding: 10, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderRadius: 30,
    zIndex: 10
  },

  // Overlay de Carga (API)
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#1e1e1e', 
    width: '90%',
    borderRadius: 15,
    padding: 10,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#333'
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    padding: 10,
    zIndex: 1
  }
});