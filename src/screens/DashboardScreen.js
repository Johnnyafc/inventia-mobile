import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useDashboardData } from '../hooks/useDashboardData';

// --- Sub-Componente: Tarjeta de Métrica ---
const MetricCard = ({ title, value, caption, icon, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.cardLabel}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardCaption}>{caption}</Text>
    </View>
  </View>
);

// --- Sub-Componente: Fila de Reposición ---
const RestockRow = ({ item }) => {
  let statusColor = colors.success;
  let statusText = 'NORMAL';
  
  if (item.porcentaje <= 20) { statusColor = colors.error; statusText = 'CRÍTICO'; }
  else if (item.porcentaje <= 50) { statusColor = colors.warning; statusText = 'BAJO'; }

  return (
    <View style={styles.listRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.semaforo, { backgroundColor: statusColor }]} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.rowTitle}>{item.nombre}</Text>
          <Text style={styles.rowSubtitle}>{item.marca}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        <Text style={styles.rowSubtitle}>{item.porcentaje.toFixed(0)}% Ocup.</Text>
      </View>
    </View>
  );
};

// --- PANTALLA PRINCIPAL ---
export default function DashboardScreen({ user, onNavigate }) {
  const data = useDashboardData(user);
  
  if (!data) return <ActivityIndicator size="large" color={colors.primary} />;

  const { loading, metricas, ultimasVentas, productosReponer } = data;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tu negocio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user.email?.split('@')[0]}</Text>
          <Text style={styles.subGreeting}>Panel de Control</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ff5252" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ACCIONES RÁPIDAS (Navegación) */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionRow}>
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => onNavigate('scanner')}
            >
                <Ionicons name="qr-code" size={24} color="white" />
                <Text style={styles.actionText}>Escanear</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => onNavigate('inventory')}
            >
                <Ionicons name="list" size={24} color="white" />
                <Text style={styles.actionText}>Inventario</Text>
            </TouchableOpacity>
        </View>

        {/* GRID DE MÉTRICAS */}
        <View style={styles.metricsGrid}>
          <MetricCard title="Stock Total" value={metricas.totalStock} caption="Unidades" icon="📦" color="#2196F3" />
          <MetricCard title="Valor Stock" value={`$${metricas.valorStock}`} caption="Estimado" icon="💰" color="#FFC107" />
          <MetricCard title="Ventas" value={metricas.totalVentas} caption={`$${metricas.valorVentas}`} icon="🧾" color="#FF5722" />
          <MetricCard title="Categorías" value={metricas.totalCategorias} caption="Activas" icon="📂" color="#4CAF50" />
        </View>

        {/* ALERTA DE REPOSICIÓN */}
        <Text style={styles.sectionTitle}>⚠️ Atención Requerida</Text>
        <View style={styles.sectionContainer}>
          {productosReponer.length === 0 ? (
            <Text style={styles.emptyText}>Todo el stock está saludable ✅</Text>
          ) : (
            productosReponer.map((p, i) => <RestockRow key={i} item={p} />)
          )}
        </View>

        {/* ÚLTIMAS VENTAS */}
        <Text style={styles.sectionTitle}>Últimas Ventas</Text>
        <View style={styles.sectionContainer}>
          {ultimasVentas.length === 0 ? (
            <Text style={styles.emptyText}>No hay ventas recientes</Text>
          ) : (
            ultimasVentas.map((v, i) => (
              <View key={i} style={styles.listRow}>
                <View>
                  <Text style={styles.rowTitle}>{v.tipoProducto}</Text>
                  <Text style={styles.rowSubtitle}>
                    {new Date(v.fechaVenta).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.moneyText}>+${parseFloat(v.precio).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 10 },
  header: { padding: 20, paddingTop: 60, backgroundColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  subGreeting: { fontSize: 14, color: colors.textSecondary },
  logoutBtn: { padding: 8, backgroundColor: '#2c2c2c', borderRadius: 8 },
  scrollContent: { padding: 15 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  actionButton: { flex: 0.48, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  actionText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: colors.surface, padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardLabel: { color: colors.textSecondary, fontSize: 12 },
  cardValue: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' },
  cardCaption: { color: '#666', fontSize: 10 },
  sectionContainer: { backgroundColor: colors.surface, borderRadius: 12, padding: 5 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  rowTitle: { color: colors.textPrimary, fontWeight: '600' },
  rowSubtitle: { color: colors.textSecondary, fontSize: 12 },
  moneyText: { color: colors.success, fontWeight: 'bold' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: colors.textSecondary, padding: 20, textAlign: 'center', fontStyle: 'italic' },
  semaforo: { width: 12, height: 12, borderRadius: 6 }
});