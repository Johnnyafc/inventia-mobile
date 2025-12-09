import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen({ user }) {
  const [historialVentas, setHistorialVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [filtroTiempo, setFiltroTiempo] = useState('todo'); // 'dia', 'semana', 'mes', 'todo'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [resumenProductos, setResumenProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. CARGAR DATOS (Igual que en tu web)
  useEffect(() => {
    const ventasRef = ref(database, `usuarios/${user.uid}/historialVentas`);
    const unsub = onValue(ventasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ventasLista = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Ordenar: más recientes primero
        ventasLista.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta));
        setHistorialVentas(ventasLista);
      } else {
        setHistorialVentas([]);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // 2. FILTRAR VENTAS (Lógica adaptada)
  useEffect(() => {
    let ventas = [...historialVentas];
    const hoy = new Date();

    if (filtroTiempo === 'dia') {
      // Usamos la fecha del input de texto o hoy
      const fechaBase = fechaSeleccionada ? new Date(fechaSeleccionada) : hoy;
      // Ajuste de zona horaria simple para coincidencia de string
      const fechaString = fechaBase.toISOString().split('T')[0];
      
      ventas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fechaVenta).toISOString().split('T')[0];
        return fechaVenta === fechaString;
      });

    } else if (filtroTiempo === 'semana') {
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo
      inicioSemana.setHours(0, 0, 0, 0);
      
      ventas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fechaVenta);
        return fechaVenta >= inicioSemana;
      });

    } else if (filtroTiempo === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      ventas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fechaVenta);
        return fechaVenta >= inicioMes;
      });
    }

    setVentasFiltradas(ventas);
    GenerarResumen(ventas);
  }, [historialVentas, filtroTiempo, fechaSeleccionada]);

  // 3. GENERAR RESUMEN (Tu lógica exacta)
  const GenerarResumen = (ventas) => {
    const agrupados = {};
    ventas.forEach(venta => {
      const clave = `${venta.tipoProducto}-${venta.marcaFabricante}`;
      if (!agrupados[clave]) {
        agrupados[clave] = {
          nombre: venta.tipoProducto,
          marca: venta.marcaFabricante,
          total: 0,
          cantidad: 0
        };
      }
      agrupados[clave].cantidad += 1;
      agrupados[clave].total += parseFloat(venta.precio || venta.precioVentaFinal || 0);
    });

    const resultado = Object.values(agrupados)
      .map(p => ({ ...p, total: p.total.toFixed(2) }))
      .sort((a, b) => b.cantidad - a.cantidad);

    setResumenProductos(resultado);
  };

  const calcularTotalGeneral = () => {
    return ventasFiltradas
      .reduce((sum, v) => sum + (parseFloat(v.precio || v.precioVentaFinal) || 0), 0)
      .toFixed(2);
  };

  // --- COMPONENTES VISUALES ---

  // Botón de Filtro (Píldora)
  const FilterChip = ({ label, value }) => (
    <TouchableOpacity 
      style={[styles.chip, filtroTiempo === value && styles.chipActive]}
      onPress={() => setFiltroTiempo(value)}
    >
      <Text style={[styles.chipText, filtroTiempo === value && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Tarjeta de Resumen (Horizontal)
  const ResumenCard = ({ item }) => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="trophy" size={16} color="#FFD700" />
        <Text style={styles.summaryQty}>x{item.cantidad}</Text>
      </View>
      <Text style={styles.summaryName} numberOfLines={1}>{item.nombre}</Text>
      <Text style={styles.summaryBrand} numberOfLines={1}>{item.marca}</Text>
      <Text style={styles.summaryTotal}>${item.total}</Text>
    </View>
  );

  // Fila de Historial (Vertical)
  const VentaRow = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.rowTitle}>{item.tipoProducto}</Text>
        <Text style={styles.rowSubtitle}>
          {new Date(item.fechaVenta).toLocaleString()} • {item.marcaFabricante}
        </Text>
      </View>
      <Text style={styles.rowPrice}>+${parseFloat(item.precio || item.precioVentaFinal).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* CABECERA FIJA */}
      <View style={styles.header}>
        <Text style={styles.title}>Ventas</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Período</Text>
          <Text style={styles.totalValue}>${calcularTotalGeneral()}</Text>
        </View>
      </View>

      {/* FILTROS */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
          <FilterChip label="Todo" value="todo" />
          <FilterChip label="Hoy" value="dia" />
          <FilterChip label="Semana" value="semana" />
          <FilterChip label="Mes" value="mes" />
        </ScrollView>
        
        {/* Selector de fecha manual si es 'dia' */}
        {filtroTiempo === 'dia' && (
          <View style={styles.dateInputContainer}>
            <Ionicons name="calendar" size={20} color="#888" />
            <TextInput
              style={styles.dateInput}
              value={fechaSeleccionada}
              onChangeText={setFechaSeleccionada}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* SECCIÓN 1: RESUMEN (Top Productos) */}
          {resumenProductos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Más Vendidos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginLeft: -20}} contentContainerStyle={{paddingLeft: 20}}>
                {resumenProductos.slice(0, 5).map((prod, i) => (
                  <ResumenCard key={i} item={prod} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* SECCIÓN 2: LISTA DETALLADA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalle ({ventasFiltradas.length})</Text>
            <View style={styles.listContainer}>
              {ventasFiltradas.length === 0 ? (
                <Text style={styles.emptyText}>No hay ventas en este rango.</Text>
              ) : (
                ventasFiltradas.map(venta => <VentaRow key={venta.id} item={venta} />)
              )}
            </View>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, paddingTop: 10, backgroundColor: colors.surface 
  },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  totalContainer: { alignItems: 'flex-end' },
  totalLabel: { color: '#aaa', fontSize: 12 },
  totalValue: { color: colors.success, fontSize: 20, fontWeight: 'bold' },

  filtersContainer: { marginVertical: 15 },
  chip: { 
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, 
    backgroundColor: '#333', marginRight: 10, borderWidth: 1, borderColor: '#444' 
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: '#ccc', fontWeight: '600' },
  chipTextActive: { color: 'white' },

  dateInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e',
    marginHorizontal: 20, marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333'
  },
  dateInput: { color: 'white', marginLeft: 10, flex: 1, fontSize: 16 },

  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  summaryCard: {
    width: 140, backgroundColor: '#252525', padding: 15, borderRadius: 12, marginRight: 10,
    borderLeftWidth: 3, borderLeftColor: colors.primary
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryQty: { color: '#FFD700', fontWeight: 'bold' },
  summaryName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  summaryBrand: { color: '#888', fontSize: 12, marginBottom: 5 },
  summaryTotal: { color: colors.success, fontWeight: 'bold', fontSize: 16 },

  listContainer: { backgroundColor: '#1e1e1e', borderRadius: 15, padding: 5 },
  row: { 
    flexDirection: 'row', alignItems: 'center', padding: 15, 
    borderBottomWidth: 1, borderBottomColor: '#333' 
  },
  iconBox: { 
    width: 35, height: 35, borderRadius: 8, backgroundColor: 'rgba(76, 175, 80, 0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  rowTitle: { color: 'white', fontWeight: '600', fontSize: 15 },
  rowSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  rowPrice: { color: colors.success, fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#666', textAlign: 'center', padding: 20, fontStyle: 'italic' }
});