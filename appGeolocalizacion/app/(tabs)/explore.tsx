import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, Text } from 'react-native';
import MapView, { Marker, Polyline, LatLng } from 'react-native-maps';
import RNPickerSelect from 'react-native-picker-select';
import ciudadesJson from '../../components/Oficinas soportadas por IT.json';

const ORS_API_KEY = '5b3ce3597851110001cf62482035714658dc49e09a30a2622e5cd198'; // Reemplaza con tu API key

type Ciudad = {
    label: string;
    value: [number, number];
};


export default function App() {
    const mapRef = useRef<MapView | null>(null);

    //para iterar en el archivo JSON
    const ciudades: Ciudad[] = ciudadesJson.features.map((feature: any) => ({
        label: feature.properties.name,
        value: [
            feature.geometry.coordinates[0],
            feature.geometry.coordinates[1],
        ],
    }));


    const [origen, setOrigen] = useState<[number, number] | null>(null);
    const [destino, setDestino] = useState<[number, number] | null>(null);
    const [rutaCoords, setRutaCoords] = useState<LatLng[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [ciudadSeleccionada, setCiudadSeleccionada] = useState<[number, number] | null>(null);


    useEffect(() => {
        if (origen && destino) {
            obtenerRuta();
        }
    }, [origen, destino]);

    // para obteer la ruta
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

            const data = await response.json();

            if (!data || !data.features?.length) {
                Alert.alert('Error', 'No se encontró la ruta');
                return;
            }

            const coordenadas: LatLng[] = data.features[0].geometry.coordinates.map(
                (coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                })
            );

            setRutaCoords(coordenadas);

        } catch (error) {
            console.error('Error al obtener ruta:', error);
            Alert.alert('Error', 'No se pudo obtener la ruta');
        }
    };


    // para centrar el mapa
    useEffect(() => {
        if (mapRef.current && rutaCoords.length > 0) {
            mapRef.current.fitToCoordinates(rutaCoords, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [rutaCoords]);




    // vistas del react native
    return (
        <View style={styles.container}>
            <View style={styles.container}>
                <View style={styles.pickerOverlay}>
                    <Text>Origen</Text>
                    <RNPickerSelect
                        onValueChange={(value) => setOrigen(value)}
                        items={ciudades}
                        onOpen={() => setPickerOpen(true)}
                        onClose={() => setPickerOpen(false)}
                        placeholder={{ label: 'Selecciona origen', value: null }}
                        style={pickerSelectStyles}
                    />
                    <Text>Destino</Text>
                    <RNPickerSelect
                        onValueChange={(value) => setDestino(value)}
                        items={ciudades}
                        onOpen={() => setPickerOpen(true)}
                        onClose={() => setPickerOpen(false)}
                        placeholder={{ label: 'Selecciona destino', value: null }}
                        style={pickerSelectStyles}
                    />
                </View>
                {ciudadSeleccionada && (
                    <Text style={styles.resultado}>
                        Coordenadas: Lat {ciudadSeleccionada[1]}, Lon {ciudadSeleccionada[0]}
                    </Text>
                )}
            </View>
            <MapView />
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: -12.0464,
                    longitude: -77.0428,
                    latitudeDelta: 10,
                    longitudeDelta: 10,
                }}
                ref={mapRef}
            >
                {origen && (
                    <Marker
                        coordinate={{ latitude: origen[1], longitude: origen[0] }}
                        title="Origen"
                    />
                )}
                {destino && (
                    <Marker
                        coordinate={{ latitude: destino[1], longitude: destino[0] }}
                        title="Destino"
                        pinColor="green"
                    />

                )}
                {rutaCoords.length > 0 && (
                    <Polyline coordinates={rutaCoords} strokeWidth={4} strokeColor="blue" />
                )}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    pickerOverlay: {
        position: 'absolute',
        left: 10,
        right: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        zIndex: 9999,
        elevation: 10,
    },
    label: { marginBottom: 10, fontSize: 16 },
    input: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        backgroundColor: 'white',
    },
    resultado: { marginTop: 20, fontSize: 16, color: 'blue' },
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