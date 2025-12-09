import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// ✅ CORRECTO: export const
export const ScannerOverlay = () => {
  return (
    <View style={styles.overlay}>
      {/* ... (el resto del código de los cuadros que ya tenías) ... */}
       <View style={styles.unfocusedContainer}></View>
      <View style={styles.middleContainer}>
        <View style={styles.unfocusedContainer} />
        <View style={styles.focusedContainer}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.unfocusedContainer} />
      </View>
      <View style={styles.unfocusedContainer}>
        <Text style={styles.instructions}>Apunta el código QR al centro</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (tus estilos existentes) ...
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  unfocusedContainer: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { flex: 2, height: '100%' },
  instructions: { color: 'white', marginTop: 20, fontWeight: 'bold' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#E91E63', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
});