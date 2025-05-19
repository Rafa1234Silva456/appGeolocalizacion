
import { Platform, StyleSheet, View, Alert } from 'react-native';

import { useEffect, useState } from 'react';
import React from 'react';  
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';
import MapView, { Marker, Polyline, Geojson, LatLng } from 'react-native-maps';

const ORS_API_KEY = '5b3ce3597851110001cf62482035714658dc49e09a30a2622e5cd198'; // 🔑 Reemplaza con tu clave de OpenRouteService

const origen: [number, number] = [-77.02672388569192,-12.12842928109676]; // origen del origen
const destino: [number, number] = [-78.56703465850748,-6.985967330636234]; // origen del destino
export default function HomeScreen() {
  const [rutaCoords, setRutaCoords] = useState<LatLng[]>([]);

  useEffect(() => {
    const obtenerRuta = async () => {
      try {
        const response = await fetch(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          {
            method: 'POST',
            headers: {
              Authorization: ORS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: [origen, destino],
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          Alert.alert('Error API', JSON.stringify(errorData));
          return;
        }

        const data = await response.json();

        if (!data.features || !data.features.length) {
          Alert.alert('Error', 'No se encontró ruta.');
          return;
        }

        const coords: LatLng[] = data.features[0].geometry.coordinates.map(
          (coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          })
        );

        setRutaCoords(coords);
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener la ruta');
        console.error(error);
      }
    };

    obtenerRuta();
  }, []);

  return(
    <View style={styles.container}>
      <MapView />
      
      <MapView style={styles.map} // aca se controla la vista que sale de Peru
        initialRegion={{
          latitude: -9.19,
          longitude: -75.0152,
          latitudeDelta: 10, // controlan el zoom
          longitudeDelta: 10,
        }}>
        <Geojson
          geojson={require('../../components/Oficinas soportadas por IT.json')}
          strokeColor="red"
          fillColor="rgba(21, 94, 27, 0.5)"
          strokeWidth={2}
        />
         <Marker
          coordinate={{ latitude: origen[1], longitude: origen[0] }}
          title="Origen - Lima"
        />
        <Marker
          coordinate={{ latitude: destino[1], longitude: destino[0] }}
          title="Destino - Cusco"
        />
        <Polyline coordinates={rutaCoords} strokeColor="#1E90FF" strokeWidth={4} />
      </MapView>
    </View>
  );
  
}
  
const styles = StyleSheet.create({
   container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});