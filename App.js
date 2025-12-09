import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase'; 

// --- PANTALLAS ---
import LoginScreen from './src/screens/LoginScreen'; 
import DashboardScreen from './src/screens/DashboardScreen'; 
import ScannerScreen from './src/screens/ScannerScreen'; 
import HistoryScreen from './src/screens/HistoryScreen'; 
import InventoryScreen from './src/screens/InventoryScreen';
import ContactsScreen from './src/screens/ContactsScreen'; // <--- NUEVA IMPORTACIÓN

// --- COMPONENTE: BARRA INFERIOR ---
const BottomBar = ({ active, onNavigate }) => (
  <View style={styles.bottomBar}>
    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('dashboard')}>
      <Ionicons name="home" size={24} color={active === 'dashboard' ? "#E91E63" : "#888"} />
      <Text style={[styles.navText, { color: active === 'dashboard' ? "#E91E63" : "#888" }]}>Inicio</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('inventory')}>
      <Ionicons name="cube-outline" size={24} color={active === 'inventory' ? "#E91E63" : "#888"} />
      <Text style={[styles.navText, { color: active === 'inventory' ? "#E91E63" : "#888" }]}>Prod.</Text>
    </TouchableOpacity>

    <View style={styles.floatingContainer}>
      <TouchableOpacity style={styles.floatingButton} onPress={() => onNavigate('scanner')}>
        <Ionicons name="qr-code" size={32} color="white" />
      </TouchableOpacity>
    </View>

    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('history')}>
      <Ionicons name="time-outline" size={24} color={active === 'history' ? "#E91E63" : "#888"} />
      <Text style={[styles.navText, { color: active === 'history' ? "#E91E63" : "#888" }]}>Hist.</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('contacts')}>
      <Ionicons name="people-outline" size={24} color={active === 'contacts' ? "#E91E63" : "#888"} />
      <Text style={[styles.navText, { color: active === 'contacts' ? "#E91E63" : "#888" }]}>Prov.</Text>
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': 
        return <DashboardScreen user={user} onNavigate={setActiveSection} />;
      
      case 'scanner': 
        return <ScannerScreen onBack={() => setActiveSection('dashboard')} />;
      
      case 'history': 
        return <HistoryScreen user={user} />;
      
      case 'inventory': 
        return <InventoryScreen user={user} />;
      
      case 'contacts': 
        // <--- CONEXIÓN DE CONTACTOS/PROVEEDORES
        return <ContactsScreen user={user} />;
      
      default: 
        return <DashboardScreen user={user} onNavigate={setActiveSection} />;
    }
  };

  if (!user) return <LoginScreen />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.appContainer} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        <View style={{ flex: 1 }}>
          {activeSection === 'scanner' ? (
             <View style={{ flex: 1 }}>
               <ScannerScreen />
               {/* Botón X para cerrar cámara */}
               <TouchableOpacity 
                 onPress={() => setActiveSection('dashboard')} 
                 style={styles.closeCameraButton}
               >
                  <Ionicons name="close" size={32} color="white" />
               </TouchableOpacity>
             </View>
          ) : (
             renderContent() 
          )}
        </View>

        {activeSection !== 'scanner' && (
          <BottomBar active={activeSection} onNavigate={setActiveSection} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#121212' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A2E' },
  
  bottomBar: { 
    height: 70, 
    backgroundColor: '#1E1E1E', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#333',
    paddingBottom: 5
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, marginTop: 4 },
  floatingContainer: { top: -20 },
  floatingButton: { 
    backgroundColor: '#E91E63', 
    width: 60, height: 60, borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center', 
    shadowColor: '#E91E63', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 
  },
  
  closeCameraButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  }
});