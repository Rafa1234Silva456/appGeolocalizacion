import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Polyline, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import ciudadesJson from '../../components/Oficinas soportadas por IT.json';
import RNPickerSelect from 'react-native-picker-select';

type Ciudad = {
  label: string;
  value: [number, number];
};

const ciudades: Ciudad[] = ciudadesJson.features.map((feature: any) => ({
  label: feature.properties.name,
  value: [
    feature.geometry.coordinates[0],
    feature.geometry.coordinates[1],
  ],
}));

type Coord = {
  latitude: number;
  longitude: number;
};

const ORS_API_KEY = '5b3ce3597851110001cf62482035714658dc49e09a30a2622e5cd198';

export default function App() {
  const mapRef = useRef<MapView | null>(null);

  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [loading, setLoading] = useState(false);
  const [destino, setDestino] = useState<[number, number] | null>(null);

  // Obtener ubicación inicial y centrar mapa
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pudo obtener la ubicación');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(current);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: current.latitude,
          longitude: current.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    })();
  }, []);

  // Función para obtener ruta y centrar mapa, SOLO al cambiar destino (muestra loading)
  const updateRouteAndLocation = async (dest: [number, number]) => {
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(current);

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: current.latitude,
          longitude: current.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }

      await fetchRoute(current, dest);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la ruta');
    } finally {
      setLoading(false);
    }
  };

  // Efecto que escucha cambios en destino
  useEffect(() => {
    if (destino) {
      updateRouteAndLocation(destino);
    }

    // Intervalo para actualizar SOLO ubicación sin ruta ni loading
    const intervalId = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const current = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(current);
      } catch (e) {
        console.log('Error al actualizar ubicación periódica:', e);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [destino]);

  // Función para obtener ruta desde OpenRouteService
  const fetchRoute = async (start: Coord, end: [number, number]) => {
    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [
            [start.longitude, start.latitude],
            end,
          ],
        },
        {
          headers: {
            Authorization: ORS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (!data || !data.features?.length) {
        Alert.alert('Error', 'No se encontró la ruta');
        setRouteCoords([]);
        return;
      }

      const coordenadas: LatLng[] = data.features[0].geometry.coordinates.map(
        (coord: [number, number]) => ({
          latitude: coord[1],
          longitude: coord[0],
        })
      );

      setRouteCoords(coordenadas);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ruta');
      console.error('Error al obtener ruta:', error);
      setRouteCoords([]);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
        ref={mapRef}
        showsUserLocation={true}
      >
        {userLocation && (
          <Marker coordinate={userLocation} title="Tu ubicación" pinColor="blue" />
        )}
        {destino && (
          <Marker
            key={`${destino[0]}-${destino[1]}`}
            coordinate={{ latitude: destino[1], longitude: destino[0] }}
            title="Destino"
            pinColor="green"
          />
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="red" strokeWidth={4} />
        )}
      </MapView>

      <View style={styles.pickerOverlay}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>APP GEOLOCALIZACIÓN</Text>
        <Text>Destino</Text>
        <RNPickerSelect
          onValueChange={(value) => setDestino(value)}
          items={ciudades}
          placeholder={{ label: 'Selecciona destino', value: null }}
          style={pickerSelectStyles}
          value={destino}
          useNativeAndroidPickerStyle={false}
        />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="red" />
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
    zIndex: 10,
    elevation: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 50,
    padding: 10,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
    elevation: 10,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
};
