import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
// LIBRERÍA NUEVA Y MODERNA
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Ionicons } from '@expo/vector-icons';
import { procesarTextoConIA } from '../../services/aiService';

export default function VoiceModal({ visible, onClose, onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  // 1. CONFIGURACIÓN DE EVENTOS DE VOZ
  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    // Actualiza el texto mientras hablas
    if (event.results && event.results.length > 0) {
      setTranscript(event.results[0]?.transcript);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    // Si hay error, solo dejamos de escuchar
    console.log("Error de voz:", event.error);
    setIsListening(false);
  });

  // 2. INICIAR AL ABRIR
  useEffect(() => {
    if (visible) {
      setTranscript('');
      setIsProcessing(false);
      startListening();
    } else {
      stopListening();
    }
  }, [visible]);

  const startListening = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso al micrófono para escucharte.");
        return;
      }
      
      // Inicia el reconocimiento en Español
      ExpoSpeechRecognitionModule.start({
        lang: "es-ES",
        interimResults: true, // Muestra el texto mientras hablas
        maxAlternatives: 1,
      });
    } catch (e) {
      console.error("Error iniciando voz:", e);
    }
  };

  const stopListening = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    }
  };

  const handleProcess = async () => {
    // Detenemos el micrófono primero
    await stopListening();

    if (!transcript) {
      onClose(); // Si no dijo nada, cerramos
      return;
    }

    setIsProcessing(true);

    // Enviamos el texto a Gemini (Tu IA)
    const datos = await procesarTextoConIA(transcript);
    
    setIsProcessing(false);

    if (datos) {
      onResult(datos); // Éxito: Enviamos datos al formulario
    } else {
      Alert.alert("Lo siento", "No entendí la instrucción. Intenta hablar más claro.");
      // Opcional: Reiniciar escucha automáticamente
      // setTranscript("");
      // startListening(); 
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          
          {isProcessing ? (
            // VISTA: PENSANDO (IA)
            <>
              <ActivityIndicator size="large" color="#E91E63" style={{marginBottom: 20}} />
              <Text style={styles.title}>Procesando...</Text>
              <Text style={styles.text}>"{transcript}"</Text>
            </>
          ) : (
            // VISTA: ESCUCHANDO
            <>
              <Text style={styles.title}>{isListening ? "Escuchando..." : "En pausa"}</Text>
              
              {/* Botón Micrófono (Tócalo para parar/seguir) */}
              <TouchableOpacity 
                onPress={isListening ? stopListening : startListening} 
                style={[styles.micBtn, isListening && styles.micActive]}
              >
                <Ionicons name={isListening ? "mic" : "mic-off"} size={50} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.text}>
                {transcript || "Di: 'Agregar 10 Leches a 1 dólar'"}
              </Text>
              
              <View style={styles.btnRow}>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Text style={{color:'white'}}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleProcess} style={styles.okBtn}>
                  <Text style={{color:'white', fontWeight:'bold'}}>Listo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '85%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center' },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  
  micBtn: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#333', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: '#555'
  },
  micActive: {
    backgroundColor: '#E91E63', // Se pone rosa cuando escucha
    borderColor: '#E91E63',
    elevation: 10,
    shadowColor: '#E91E63', shadowOpacity: 0.5, shadowRadius: 10
  },

  text: { color: '#ccc', fontSize: 18, marginBottom: 30, textAlign: 'center', minHeight: 50 },
  
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10 },
  closeBtn: { padding: 12 },
  okBtn: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 }
});