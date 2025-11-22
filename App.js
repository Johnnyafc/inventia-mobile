import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
// SOLUCIÓN DE LA RAYA: Importamos desde la librería correcta
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/config/firebase';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const PlaceholderScreen = ({ name, onBack }) => (
  <View style={{flex:1, backgroundColor:'#121212', justifyContent:'center', alignItems:'center'}}>
    <Text style={{color:'white', fontSize: 20, fontWeight:'bold'}}>{name}</Text>
    <Text style={{color:'#aaa', marginVertical:10}}>En construcción...</Text>
    <TouchableOpacity onPress={onBack} style={{backgroundColor:'#E91E63', padding:10, borderRadius:5}}>
      <Text style={{color:'white'}}>Volver</Text>
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{flex:1, justifyContent:'center', backgroundColor:'#121212'}}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      </SafeAreaProvider>
    );
  }

  const renderContent = () => {
    if (!user) return <LoginScreen />;
    
    switch (currentScreen) {
      case 'dashboard': return <DashboardScreen user={user} onNavigate={setCurrentScreen} />;
      case 'scanner': return <PlaceholderScreen name="Escáner" onBack={() => setCurrentScreen('dashboard')} />;
      case 'inventory': return <PlaceholderScreen name="Inventario" onBack={() => setCurrentScreen('dashboard')} />;
      default: return <DashboardScreen user={user} onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        {renderContent()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}