import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ref, push, set, remove, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function ProductActionModal({ productData, user, onCancel, onSuccess }) {
  const [mode, setMode] = useState(null); // 'sell' o 'restock'
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  // Lógica para Reponer
  const handleRestock = async () => {
    setLoading(true);
    try {
      const cant = parseInt(quantity);
      const promises = [];
      for (let i = 0; i < cant; i++) {
        const newRef = push(ref(database, `usuarios/${user.uid}/productos`));
        promises.push(set(newRef, {
          tipoProducto: productData.tipoProducto,
          marcaFabricante: productData.marcaFabricante,
          precio: productData.precio || '0', 
          codigoBarras: productData.id, 
          fechaIngreso: new Date().toISOString()
        }));
      }
      await Promise.all(promises);
      Alert.alert("Éxito", `Agregadas ${cant} unidades.`);
      onSuccess();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  // Lógica para Vender
  const handleSell = async () => {
    setLoading(true);
    try {
      const cant = parseInt(quantity);
      // Buscar stock disponible
      const stockRef = ref(database, `usuarios/${user.uid}/productos`);
      const snapshot = await get(stockRef);
      
      if (!snapshot.exists()) {
        Alert.alert("Error", "No tienes stock");
        setLoading(false);
        return;
      }

      const items = [];
      snapshot.forEach(child => {
        const val = child.val();
        if (val.tipoProducto === productData.tipoProducto && val.marcaFabricante === productData.marcaFabricante) {
          items.push({ key: child.key, ...val });
        }
      });

      if (items.length < cant) {
        Alert.alert("Stock insuficiente", `Solo tienes ${items.length} disponibles.`);
        setLoading(false);
        return;
      }

      // Procesar venta
      const toSell = items.slice(0, cant);
      const promises = [];

      toSell.forEach(item => {
        // Borrar de stock
        promises.push(remove(ref(database, `usuarios/${user.uid}/productos/${item.key}`)));
        // Agregar a historial
        const ventaRef = push(ref(database, `usuarios/${user.uid}/historialVentas`));
        promises.push(set(ventaRef, {
          ...item,
          fechaVenta: new Date().toISOString(),
          precioVentaFinal: item.precio
        }));
      });

      await Promise.all(promises);
      Alert.alert("Venta exitosa", `Vendidas ${cant} unidades.`);
      onSuccess();

    } catch (e) {
      Alert.alert("Error", "No se pudo procesar la venta");
    } finally {
      setLoading(false);
    }
  };

  // VISTA 1: Selección de Modo
  if (!mode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{productData.tipoProducto}</Text>
        <Text style={styles.subtitle}>{productData.marcaFabricante}</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: colors.success }]} onPress={() => setMode('sell')}>
            <Ionicons name="cart" size={40} color="white" />
            <Text style={styles.btnLabel}>VENDER</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: colors.primary }]} onPress={() => setMode('restock')}>
            <Ionicons name="cube" size={40} color="white" />
            <Text style={styles.btnLabel}>REPONER</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={onCancel} style={{padding: 10}}>
          <Text style={{color: '#aaa'}}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // VISTA 2: Ingresar Cantidad
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'sell' ? 'Vender' : 'Reponer'}</Text>
      
      <Text style={styles.label}>Cantidad:</Text>
      <TextInput 
        style={styles.qtyInput} 
        value={quantity} 
        onChangeText={setQuantity} 
        keyboardType="numeric" 
        autoFocus 
      />

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => setMode(null)}>
          <Text style={styles.btnText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: mode === 'sell' ? colors.success : colors.primary }]} 
          onPress={mode === 'sell' ? handleSell : handleRestock}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>Confirmar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#222', padding: 25, borderRadius: 15, alignItems: 'center', width: 300 },
  title: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  subtitle: { color: '#aaa', marginBottom: 20 },
  grid: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  bigBtn: { width: 110, height: 110, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnLabel: { color: 'white', fontWeight: 'bold', marginTop: 5 },
  
  qtyInput: { backgroundColor: '#333', width: '100%', color: 'white', fontSize: 30, textAlign: 'center', padding: 10, borderRadius: 10, marginBottom: 20 },
  label: { color: '#ccc', alignSelf: 'flex-start', marginBottom: 5 },
  
  row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#444' },
  btnText: { color: 'white', fontWeight: 'bold' }
});