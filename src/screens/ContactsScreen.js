import React, { useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Linking 
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContacts } from '../hooks/useContacts';
import CreateContactForm from '../components/forms/CreateContactForm';

const colors = { primary: '#E91E63', background: '#121212', surface: '#1e1e1e', success: '#25D366' }; // WhatsApp Green

export default function ContactsScreen({ user }) {
  const { distribuidores, loading, obtenerMarcas, addContact, deleteContact, catalogo } = useContacts(user);
  const [modalVisible, setModalVisible] = useState(false);

  // --- ACCIONES ---
  const handleOpenWhatsApp = (contact) => {
    // 1. Filtrar productos de esa marca
    const productosMarca = catalogo.filter(
      p => p.marcaFabricante?.toLowerCase() === contact.marcaRepresentada?.toLowerCase()
    );

    if (productosMarca.length === 0) {
      Alert.alert("Aviso", "No tienes productos registrados de esta marca para hacer un pedido automático.");
      // Abrir chat vacío
      abrirLink(contact.telefono, "");
      return;
    }

    // 2. Construir mensaje base
    let mensaje = `Hola ${contact.nombre}, necesito reponer stock de ${contact.marcaRepresentada}. Mis productos son:\n`;
    productosMarca.forEach(p => {
      mensaje += `- ${p.tipoProducto}\n`;
    });
    mensaje += `\nQuedo atento.`;

    abrirLink(contact.telefono, mensaje);
  };

  const abrirLink = (telefono, mensaje) => {
    // Formato Ecuador 593 (ajustar si es necesario)
    const phone = telefono.startsWith('593') ? telefono : `593${telefono}`;
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(mensaje)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp no está instalado");
      }
    });
  };

  const handleDelete = (id, nombre) => {
    Alert.alert("Eliminar", `¿Borrar a ${nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteContact(id) }
    ]);
  };

  // --- RENDER CARD ---
  const renderContact = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerCard}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item.marcaRepresentada}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.nombre)}>
          <Ionicons name="trash-outline" size={20} color="#FF5252" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.nombre}</Text>
        {item.empresa ? <Text style={styles.company}>{item.empresa}</Text> : null}
        
        <View style={styles.rowInfo}>
          <Ionicons name="call-outline" size={16} color="#888" />
          <Text style={styles.infoText}>{item.telefono}</Text>
        </View>
        {item.email ? (
          <View style={styles.rowInfo}>
            <Ionicons name="mail-outline" size={16} color="#888" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.whatsappBtn} onPress={() => handleOpenWhatsApp(item)}>
        <Ionicons name="logo-whatsapp" size={20} color="white" />
        <Text style={styles.whatsappText}>Hacer Pedido</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Proveedores</Text>
          <Text style={styles.subtitle}>{distribuidores.length} Contactos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={distribuidores}
          keyExtractor={item => item.id}
          renderItem={renderContact}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes proveedores registrados.</Text>
          }
        />
      )}

      {/* MODAL CREAR */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CreateContactForm 
              marcas={obtenerMarcas()} 
              onSave={async (data) => {
                const res = await addContact(data);
                if(res) setModalVisible(false);
                return res;
              }}
              onCancel={() => setModalVisible(false)} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: '#888' },
  addButton: { backgroundColor: colors.primary, width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 15, marginBottom: 15 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  badgeContainer: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  
  infoContainer: { marginBottom: 15 },
  name: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  company: { color: '#aaa', fontSize: 14, marginBottom: 5, fontStyle: 'italic' },
  rowInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  infoText: { color: '#ccc', marginLeft: 8, fontSize: 14 },

  whatsappBtn: { backgroundColor: colors.success, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 8 },
  whatsappText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '80%' }
});