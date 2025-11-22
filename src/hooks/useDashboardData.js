import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

export const useDashboardData = (user) => {
  const [catalogo, setCatalogo] = useState([]);
  const [stock, setStock] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar Datos desde Firebase
  useEffect(() => {
    if (!user) return;

    const refs = {
      catalogo: ref(database, `usuarios/${user.uid}/catalogoProductos`),
      stock: ref(database, `usuarios/${user.uid}/productos`),
      ventas: ref(database, `usuarios/${user.uid}/historialVentas`)
    };

    const unsubscribes = [];

    // Función auxiliar para leer datos
    const escuchar = (referencia, setter) => {
      const unsub = onValue(referencia, (snapshot) => {
        const data = snapshot.val();
        const lista = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setter(lista);
      });
      unsubscribes.push(unsub);
    };

    escuchar(refs.catalogo, setCatalogo);
    escuchar(refs.stock, setProductosLista => {
        setStock(setProductosLista);
        // Cuando cargan los datos básicos, quitamos el loading inicial
        setLoading(false);
    });
    escuchar(refs.ventas, (list) => {
        // Ordenar por fecha descendente
        const ordenadas = list.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta));
        setHistorial(ordenadas);
    });

    return () => unsubscribes.forEach(fn => fn());
  }, [user]);

  // 2. Generar Resumen (Matemática)
  useEffect(() => {
    if (!catalogo.length && !stock.length && !historial.length) return;

    const agrupados = {};

    // Procesar Stock
    stock.forEach(prod => {
      const key = `${prod.tipoProducto}-${prod.marcaFabricante}`;
      if (!agrupados[key]) {
        const plantilla = catalogo.find(c => c.tipoProducto === prod.tipoProducto && c.marcaFabricante === prod.marcaFabricante);
        agrupados[key] = {
          nombre: prod.tipoProducto,
          marca: prod.marcaFabricante,
          precio: parseFloat(prod.precio) || 0,
          stock: 0,
          vendidos: 0,
          slotsMaximos: plantilla?.slotsMaximos ? parseInt(plantilla.slotsMaximos) : 100
        };
      }
      agrupados[key].stock += 1;
    });

    // Procesar Ventas (para saber qué se vende más)
    historial.forEach(venta => {
        const key = `${venta.tipoProducto}-${venta.marcaFabricante}`;
        // Nota: Si se vendió algo que ya no está en catálogo, lo ignoramos o lo creamos básico
        if (agrupados[key]) {
            agrupados[key].vendidos += 1;
        }
    });

    const resultado = Object.values(agrupados).map(p => ({
      ...p,
      dineroStock: (p.stock * p.precio),
      dineroGanado: (p.vendidos * p.precio)
    }));

    setResumen(resultado);
  }, [catalogo, stock, historial]);

  // 3. Calcular Métricas Finales
  const metricas = {
    totalCategorias: catalogo.length, // Aproximado según tu lógica original usabas Set, pero length es más rápido aquí
    totalStock: stock.length,
    totalVentas: historial.length,
    valorStock: resumen.reduce((acc, curr) => acc + curr.dineroStock, 0).toFixed(2),
    valorVentas: historial.reduce((acc, curr) => acc + (parseFloat(curr.precio) || 0), 0).toFixed(2),
  };

  // 4. Filtros
  const productosMasVendidos = [...resumen].sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
  
  const productosReponer = resumen
    .map(p => ({ ...p, porcentaje: (p.stock / p.slotsMaximos) * 100 }))
    .filter(p => p.porcentaje <= 50)
    .sort((a, b) => a.porcentaje - b.porcentaje);

  return {
    loading,
    metricas,
    ultimasVentas: historial.slice(0, 5),
    productosMasVendidos,
    productosReponer
  };
};