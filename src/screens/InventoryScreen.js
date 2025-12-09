import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ref, onValue, remove, push, set } from 'firebase/database';
import { database } from '../config/firebase';
import Ionicons from '@expo/vector-icons/Ionicons';

import CreateProductForm from '../components/forms/CreateProductForm';

const colors = {
  primary: '#E91E63',
  background: '#121212',
  surface: '#1e1e1e',
  success: '#4CAF50',
  error: '#FF5252',
  text: '#FFFFFF',
  inputBg: '#333333'
};

export default function InventoryScreen({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // --- ESTADOS ---
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false); // Modal para Cantidad
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionType, setActionType] = useState(''); // 'sell' o 'delete'
  const [quantityInput, setQuantityInput] = useState('1'); 
  const [tempCode, setTempCode] = useState(null);

  // 1. CARGA DE DATOS
  useEffect(() => {
    if (!user || !user.uid) return;

    const stockRef = ref(database, `usuarios/${user.uid}/productos`);
    const unsub = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const rawList = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        
        const grouped = rawList.reduce((acc, curr) => {
          const key = `${curr.tipoProducto}-${curr.marcaFabricante}`;
          if (!acc[key]) {
            acc[key] = {
              nombre: curr.tipoProducto,
              marca: curr.marcaFabricante,
              precio: curr.precio,
              categoria: curr.categoria || 'General',
              codigoBarras: curr.codigoBarras,
              cantidad: 0,
              ids: []
            };
          }
          acc[key].cantidad += 1;
          acc[key].ids.push(curr.id);
          return acc;
        }, {});

        const list = Object.values(grouped);
        setProducts(list);
        setFilteredProducts(list);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // 2. FILTRADO
  useEffect(() => {
    if (search === '') {
      setFilteredProducts(products);
    } else {
      const lowerSearch = search.toLowerCase();
      const filtered = products.filter(p => 
        p.nombre?.toLowerCase().includes(lowerSearch) || 
        p.marca?.toLowerCase().includes(lowerSearch)
      );
      setFilteredProducts(filtered);
    }
  }, [search, products]);

  // --- ACCIONES ---

  // Abrir modal de Cantidad
  const openActionModal = (item, type) => {
    setSelectedProduct(item);
    setActionType(type);
    setQuantityInput('1'); 
    setActionModalVisible(true);
  };

  // Procesar Venta o Eliminación por Lotes
  const handleBatchAction = async () => {
    const qty = parseInt(quantityInput);
    
    // Validaciones
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Error", "La cantidad debe ser mayor a 0.");
      return;
    }
    if (qty > selectedProduct.cantidad) {
      Alert.alert("Error", `Solo tienes ${selectedProduct.cantidad} unidades disponibles.`);
      return;
    }

    try {
      // Tomamos los IDs necesarios (FIFO)
      const idsToProcess = selectedProduct.ids.slice(0, qty);
      const promises = [];

      // 1. Eliminar del Stock
      idsToProcess.forEach(id => {
        promises.push(remove(ref(database, `usuarios/${user.uid}/productos/${id}`)));
      });

      // 2. Si es Venta, registrar en Historial
      if (actionType === 'sell') {
        const fecha = new Date().toISOString();
        // Registramos una venta por cada unidad vendida
        for (let i = 0; i < qty; i++) {
          const ventaRef = push(ref(database, `usuarios/${user.uid}/historialVentas`));
          promises.push(set(ventaRef, {
            tipoProducto: selectedProduct.nombre,
            marcaFabricante: selectedProduct.marca,
            precio: selectedProduct.precio,
            codigoBarras: selectedProduct.codigoBarras || 'MANUAL',
            fechaVenta: fecha
          }));
        }
      }

      await Promise.all(promises);
      
      const actionText = actionType === 'sell' ? 'vendido' : 'eliminado';
      Alert.alert("Éxito", `Se han ${actionText} ${qty} unidades.`);
      setActionModalVisible(false);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo completar la operación.");
    }
  };

  const handleOpenCreate = () => {
    const generatedCode = `MAN-${Math.floor(Math.random() * 10000)}`;
    setTempCode(generatedCode);
    setCreateModalVisible(true);
  };

  // --- RENDERIZADO DE TARJETA ---
  const renderProductItem = ({ item }) => (
    <View style={styles.card}>
      {/* Fila Superior */}
      <View style={styles.cardTopRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="cube-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.prodName}>{item.nombre}</Text>
          <Text style={styles.prodBrand}>{item.marca || 'Genérico'}</Text>
          <Text style={styles.prodPrice}>${parseFloat(item.precio || 0).toFixed(2)} c/u</Text>
        </View>
        <View style={styles.stockContainer}>
          <Text style={styles.stockNumber}>{item.cantidad}</Text>
          <Text style={styles.stockLabel}>Stock</Text>
        </View>
      </View>

      {/* Fila Inferior: Botones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.sellBtn]} 
          onPress={() => openActionModal(item, 'sell')}
        >
          <Ionicons name="cart-outline" size={18} color="white" />
          <Text style={styles.actionText}>Vender</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]} 
          onPress={() => openActionModal(item, 'delete')}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Inventario</Text>
          <Text style={styles.subtitle}>{products.length} Productos distintos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.addText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{marginRight: 10}} />
        <TextInput 
          style={styles.searchInput} placeholder="Buscar producto..." placeholderTextColor="#888"
          value={search} onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => `${item.nombre}-${item.marca}`}
          renderItem={renderProductItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={50} color="#444" />
              <Text style={styles.emptyText}>{search ? "No se encontraron productos." : "Inventario vacío."}</Text>
            </View>
          }
        />
      )}

      {/* MODAL DE CANTIDAD (VENDER / ELIMINAR) */}
      <Modal visible={actionModalVisible} animationType="fade" transparent={true} onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>
              {actionType === 'sell' ? 'Vender Producto' : 'Eliminar Producto'}
            </Text>
            <Text style={styles.actionModalSubtitle}>
              {selectedProduct?.nombre} - Disponible: {selectedProduct?.cantidad}
            </Text>

            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => setQuantityInput(prev => Math.max(1, parseInt(prev || 0) - 1).toString())} style={styles.qtyBtn}>
                <Ionicons name="remove" size={24} color="white" />
              </TouchableOpacity>
              
              <TextInput 
                style={styles.qtyInput}
                value={quantityInput}
                onChangeText={setQuantityInput}
                keyboardType="numeric"
              />

              <TouchableOpacity onPress={() => setQuantityInput(prev => Math.min(selectedProduct?.cantidad, parseInt(prev || 0) + 1).toString())} style={styles.qtyBtn}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={() => setActionModalVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btn, actionType === 'sell' ? styles.sellBtn : styles.deleteBtn]} 
                onPress={handleBatchAction}
              >
                <Text style={styles.btnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL CREAR */}
      <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeModalBtn}>
               <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <CreateProductForm 
              initialCode={tempCode} 
              user={user} 
              onSuccess={() => setCreateModalVisible(false)} 
              onCancel={() => setCreateModalVisible(false)} 
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
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  addText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  searchInput: { flex: 1, color: 'white', fontSize: 16 },
  
  card: { backgroundColor: colors.surface, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: colors.primary, overflow: 'hidden' },
  cardTopRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(233, 30, 99, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoContainer: { flex: 1 },
  prodName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  prodBrand: { color: '#aaa', fontSize: 12, marginBottom: 4 },
  prodPrice: { color: colors.success, fontWeight: '600', fontSize: 14 },
  stockContainer: { alignItems: 'center', minWidth: 50 },
  stockNumber: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  stockLabel: { color: '#666', fontSize: 10, textTransform: 'uppercase' },
  
  actionsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333' },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  sellBtn: { backgroundColor: '#2E7D32' },
  deleteBtn: { backgroundColor: '#C62828' },
  actionText: { color: 'white', fontWeight: 'bold', marginLeft: 5, fontSize: 14 },

  // ESTILOS MODAL CANTIDAD
  actionModalContent: { backgroundColor: '#252525', width: '85%', borderRadius: 15, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  actionModalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  actionModalSubtitle: { color: '#ccc', fontSize: 14, marginBottom: 20 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  qtyBtn: { backgroundColor: '#444', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  qtyInput: { backgroundColor: colors.inputBg, color: 'white', width: 80, height: 50, textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#555' },
  
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  btn: { flex: 0.48, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#444' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', marginTop: 10, fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e1e1e', width: '90%', borderRadius: 15, padding: 10, maxHeight: '90%', borderWidth: 1, borderColor: '#333' },
  closeModalBtn: { alignSelf: 'flex-end', padding: 10 }
});