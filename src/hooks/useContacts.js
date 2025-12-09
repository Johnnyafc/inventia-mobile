import { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { database } from '../config/firebase';

export const useContacts = (user) => {
  const [distribuidores, setDistribuidores] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Cargar Distribuidores
    const distRef = ref(database, `usuarios/${user.uid}/distribuidores`);
    const unsubDist = onValue(distRef, (snapshot) => {
      const data = snapshot.val();
      setDistribuidores(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
      setLoading(false);
    });

    // Cargar Catálogo (para obtener las marcas únicas)
    const catRef = ref(database, `usuarios/${user.uid}/catalogoProductos`);
    const unsubCat = onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      setCatalogo(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
    });

    return () => {
      unsubDist();
      unsubCat();
    };
  }, [user]);

  // Obtener Marcas Únicas para el select
  const obtenerMarcas = () => {
    const marcas = catalogo.map(p => p.marcaFabricante);
    return [...new Set(marcas)].sort();
  };

  // Guardar Nuevo
  const addContact = async (data) => {
    try {
      const newRef = push(ref(database, `usuarios/${user.uid}/distribuidores`));
      await set(newRef, {
        ...data,
        fechaCreacion: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // Eliminar
  const deleteContact = async (id) => {
    try {
      await remove(ref(database, `usuarios/${user.uid}/distribuidores/${id}`));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return { distribuidores, loading, obtenerMarcas, addContact, deleteContact, catalogo };
};