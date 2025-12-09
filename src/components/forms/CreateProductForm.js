import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { ref, set, push } from 'firebase/database';
import { database, auth } from '../../config/firebase'; 
import { Ionicons } from '@expo/vector-icons';

const localColors = { primary: '#E91E63', background: '#1e1e1e', text: '#ffffff', inputBg: '#333333' };

export default function CreateProductForm({ initialCode, initialData, user, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '', marca: '', precio: '', categoria: '', stockInicial: '1', slotsMaximos: '50'
  });

  // --- EFECTO CLAVE: Si hay datos de la IA, llenamos el formulario ---
  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        nombre: initialData.nombre || '',
        marca: initialData.marca || '',
        categoria: initialData.categoria || '',
        // Convertimos a string para el TextInput
        precio: initialData.precio ? String(initialData.precio) : '',
        stockInicial: initialData.stock ? String(initialData.stock) : '1'
      }));
    }
  }, [initialData]);

  const currentUser = user || auth.currentUser;
  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleCreate = async () => {
    if (!form.nombre || !form.precio) { Alert.alert("Faltan datos", "Nombre y precio obligatorios"); return; }
    
    setLoading(true);
    try {
      const finalCode = initialCode || `GEN-${Date.now()}`;
      
      // 1. Catálogo
      await set(ref(database, `usuarios/${currentUser.uid}/catalogoProductos/${finalCode}`), {
        tipoProducto: form.nombre,
        marcaFabricante: form.marca || 'Genérico',
        slotsMaximos: form.slotsMaximos,
        categoria: form.categoria || 'General',
        precioReferencia: form.precio
      });

      // 2. Stock (Loop)
      const cantidad = parseInt(form.stockInicial) || 1;
      const promises = [];
      for (let i = 0; i < cantidad; i++) {
        promises.push(set(push(ref(database, `usuarios/${currentUser.uid}/productos`)), {
          tipoProducto: form.nombre,
          marcaFabricante: form.marca || 'Genérico',
          precio: form.precio,
          codigoBarras: finalCode,
          fechaIngreso: new Date().toISOString()
        }));
      }
      await Promise.all(promises);
      
      Alert.alert("¡Éxito!", "Producto guardado.");
      if (onSuccess) onSuccess();
    } catch (error) { Alert.alert("Error", "No se pudo guardar."); } 
    finally { setLoading(false); }
  };

  const displayCode = initialCode || 'Automático';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{initialData ? 'Producto Detectado' : 'Nuevo Producto'}</Text>
      <View style={styles.codeContainer}>
        <Ionicons name="barcode-outline" size={20} color={localColors.primary} />
        <Text style={styles.subtitle}>{displayCode}</Text>
      </View>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={form.nombre} onChangeText={t => handleChange('nombre', t)} placeholder="Ej. Galletas" placeholderTextColor="#666" />

      <Text style={styles.label}>Marca</Text>
      <TextInput style={styles.input} value={form.marca} onChangeText={t => handleChange('marca', t)} placeholder="Ej. Oreo" placeholderTextColor="#666" />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Precio</Text>
          <TextInput style={styles.input} value={form.precio} onChangeText={t => handleChange('precio', t)} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#666" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Stock Inicial</Text>
          <TextInput style={styles.input} value={form.stockInicial} onChangeText={t => handleChange('stockInicial', t)} keyboardType="numeric" />
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.save]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#1E1E1E', borderRadius: 15, width: '100%' },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: '#2C2C2C', padding: 8, borderRadius: 8, alignSelf: 'center' },
  subtitle: { color: localColors.primary, fontWeight: 'bold', marginLeft: 8 },
  label: { color: '#ccc', marginBottom: 5 },
  input: { backgroundColor: '#333', color: 'white', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#444' },
  row: { flexDirection: 'row' },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btn: { flex: 0.48, padding: 15, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#444' },
  save: { backgroundColor: localColors.primary },
  btnText: { color: 'white', fontWeight: 'bold' }
});