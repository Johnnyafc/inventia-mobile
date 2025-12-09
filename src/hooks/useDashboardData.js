import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
// Asegúrate de que esta ruta apunte a tu configuración real
import { database } from '../config/firebase';

export const useDashboardData = (user) => {
  const [catalogo, setCatalogo] = useState([]);
  const [stock, setStock] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar Datos desde Firebase Realtime Database
  useEffect(() => {
    if (!user) return;

    const refs = {
      catalogo: ref(database, `usuarios/${user.uid}/catalogoProductos`),
      stock: ref(database, `usuarios/${user.uid}/productos`),
      ventas: ref(database, `usuarios/${user.uid}/historialVentas`)
    };

    const unsubscribes = [];

    const escuchar = (referencia, setter, callback) => {
      const unsub = onValue(referencia, (snapshot) => {
        const data = snapshot.val();
        const lista = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        setter(lista);
        if (callback) callback(lista);
      });
      unsubscribes.push(unsub);
    };

    escuchar(refs.catalogo, setCatalogo);
    
    // Al cargar stock, asumimos que la carga inicial terminó para mostrar algo en pantalla
    escuchar(refs.stock, setStock, () => setLoading(false));
    
    escuchar(refs.ventas, (lista) => {
      // Ordenar por fecha descendente (más reciente primero)
      const ordenadas = lista.sort((a, b) => new Date(b.fechaVenta) - new Date(a.fechaVenta));
      setHistorial(ordenadas);
    });

    return () => unsubscribes.forEach(fn => fn());
  }, [user]);

  // 2. Generar Resumen (Lógica Matemática)
  useEffect(() => {
    if (catalogo.length === 0 && stock.length === 0 && historial.length === 0) return;

    const agrupados = {};

    // A. Procesar Stock Actual
    stock.forEach(prod => {
      const nombre = prod.tipoProducto;
      const marca = prod.marcaFabricante;
      // Convertir precio a float seguro
      const precio = parseFloat(prod.precio) || 0;
      const key = `${nombre}-${marca}`;

      if (!agrupados[key]) {
        // Buscar slots máximos en el catálogo (plantilla)
        const plantilla = catalogo.find(c => c.tipoProducto === nombre && c.marcaFabricante === marca);
        const slotsMaximos = plantilla?.slotsMaximos ? parseInt(plantilla.slotsMaximos) : 100;

        agrupados[key] = {
          nombre,
          marca,
          precio,
          stock: 0,
          vendidos: 0,
          slotsMaximos
        };
      }
      agrupados[key].stock += 1;
    });

    // B. Procesar Ventas (para métricas de ingresos)
    historial.forEach(venta => {
        const nombre = venta.tipoProducto;
        const marca = venta.marcaFabricante;
        const key = `${nombre}-${marca}`;
        
        // Si el producto ya no existe en stock, intentamos crearlo temporalmente para el reporte
        // o si ya existe, sumamos la venta.
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

  // 3. Calcular Métricas Finales para el Dashboard
  
  // Lógica Web: Contar categorías únicas (Set), no total de items
  const totalCategorias = new Set(catalogo.map(c => c.tipoProducto?.toLowerCase())).size;

  const metricas = {
    totalCategorias: totalCategorias || 0,
    totalStock: stock.length,
    totalVentas: historial.length,
    // Suma del valor de todo lo que hay en stock
    valorStock: resumen.reduce((acc, curr) => acc + curr.dineroStock, 0).toFixed(2),
    // Suma del valor de todo lo vendido (busca precio o precioVentaFinal)
    valorVentas: historial.reduce((acc, curr) => acc + (parseFloat(curr.precio || curr.precioVentaFinal) || 0), 0).toFixed(2),
  };

  // 4. Preparar Listas Filtradas
  const productosMasVendidos = [...resumen]
    .sort((a, b) => b.vendidos - a.vendidos)
    .slice(0, 5);
  
  const productosReponer = resumen
    .map(p => ({ ...p, porcentaje: p.slotsMaximos ? (p.stock / p.slotsMaximos) * 100 : 0 }))
    // Filtramos solo los que están al 50% o menos (Crítico y Bajo)
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