import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const localColors = { primary: '#E91E63', background: '#1e1e1e', inputBg: '#333' };

export default function CreateContactForm({ marcas, onSave, onCancel }) {
  const [form, setForm] = useState({ nombre: '', empresa: '', telefono: '', email: '', marca: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.nombre || !form.telefono || !form.marca) {
      Alert.alert("Error", "Nombre, Teléfono y Marca son obligatorios");
      return;
    }
    // Limpiar teléfono
    const telLimpio = form.telefono.replace(/\D/g, '');
    if (telLimpio.length < 10) {
      Alert.alert("Error", "El teléfono debe tener al menos 10 dígitos");
      return;
    }

    setLoading(true);
    const success = await onSave({ ...form, telefono: telLimpio, marcaRepresentada: form.marca });
    setLoading(false);
    
    if (success) {
      Alert.alert("Éxito", "Contacto guardado");
    } else {
      Alert.alert("Error", "No se pudo guardar");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo Distribuidor</Text>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput style={styles.input} placeholder="Ej. Juan Pérez" placeholderTextColor="#666" onChangeText={t => setForm({...form, nombre: t})} />

      <Text style={styles.label}>Empresa</Text>
      <TextInput style={styles.input} placeholder="Ej. Distribuidora S.A." placeholderTextColor="#666" onChangeText={t => setForm({...form, empresa: t})} />

      <Text style={styles.label}>Teléfono (WhatsApp) *</Text>
      <TextInput style={styles.input} keyboardType="phone-pad" placeholder="0987654321" placeholderTextColor="#666" onChangeText={t => setForm({...form, telefono: t})} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} keyboardType="email-address" placeholder="correo@ejemplo.com" placeholderTextColor="#666" onChangeText={t => setForm({...form, email: t})} />

      <Text style={styles.label}>Marca que representa *</Text>
      <View style={styles.marcasContainer}>
        {marcas.length > 0 ? marcas.map((m, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.marcaChip, form.marca === m && styles.marcaActive]}
            onPress={() => setForm({...form, marca: m})}
          >
            <Text style={[styles.marcaText, form.marca === m && {color: 'white'}]}>{m}</Text>
          </TouchableOpacity>
        )) : <Text style={{color:'#666'}}>No hay marcas registradas en el catálogo.</Text>}
      </View>
      {/* Opción manual si la marca no está en la lista */}
      <TextInput 
        style={[styles.input, {marginTop: 10}]} 
        placeholder="O escribe una marca nueva..." 
        placeholderTextColor="#666" 
        value={form.marca}
        onChangeText={t => setForm({...form, marca: t})} 
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}><Text style={styles.btnText}>Cancelar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.save]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="white"/> : <Text style={styles.btnText}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#1E1E1E', borderRadius: 15, width: '100%' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { color: '#ccc', marginBottom: 5, fontSize: 14 },
  input: { backgroundColor: '#333', color: 'white', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  marcasContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5 },
  marcaChip: { padding: 8, backgroundColor: '#333', borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#444' },
  marcaActive: { backgroundColor: localColors.primary, borderColor: localColors.primary },
  marcaText: { color: '#ccc', fontSize: 12 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#444' },
  save: { backgroundColor: localColors.primary },
  btnText: { color: 'white', fontWeight: 'bold' }
});