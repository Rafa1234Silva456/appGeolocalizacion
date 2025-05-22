import React, { useRef, useState } from "react";
import { View, Text, FlatList, Button, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import ciudadesJson from '../../components/Oficinas soportadas por IT.json';

export default function VistaConMapa() {
    const mapRef = useRef<MapView>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const irAPunto = (index: number) => {
        const punto = ciudadesJson.features[index];
        setSelectedIndex(index);

        const [longitude, latitude] = punto.geometry.coordinates;

        mapRef.current?.animateToRegion(
            {
                latitude,
                longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            },
            1000
        );
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: ciudadesJson.features[0].geometry.coordinates[1],
                    longitude: ciudadesJson.features[0].geometry.coordinates[0],
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {(selectedIndex === null
                    ? ciudadesJson.features
                    : [ciudadesJson.features[selectedIndex]]
                ).map((punto, index) => (
                    <Marker
                        key={index}
                        coordinate={{
                            latitude: punto.geometry.coordinates[1],
                            longitude: punto.geometry.coordinates[0],
                        }}
                        title={punto.properties.name}
                        pinColor="blue"
                    />
                ))}
            </MapView>

            <FlatList
                data={ciudadesJson.features}
                keyExtractor={(_, index) => index.toString()}
                style={styles.lista}
                renderItem={({ item, index }) => (
                    <View style={styles.item}>
                        <Text style={styles.texto}>{item.properties.name}</Text>
                        <Button title="Ir" onPress={() => irAPunto(index)} />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: {
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height * 0.6,
    },
    lista: {
        backgroundColor: "#fff",
        paddingHorizontal: 10,
    },
    item: {
        paddingVertical: 10,
        borderBottomColor: "#ccc",
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    texto: {
        fontSize: 16,
    },
});