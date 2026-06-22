import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import useLocationStore from '../store/locationStore';

// Shown when a freshly detected city differs from the saved one.
// Yes → switch to the new city. No → keep the old location.
const LocationPrompt = () => {
    const pending = useLocationStore((s) => s.pending);
    const current = useLocationStore((s) => s.city);
    const confirm = useLocationStore((s) => s.confirmPending);
    const dismiss = useLocationStore((s) => s.dismissPending);

    const newCity = pending?.city?.name;

    return (
        <Modal visible={!!pending} transparent animationType="fade" onRequestClose={dismiss}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}><Icon name="map-marker-radius" size={30} color="#07163B" /></View>
                    <Text style={styles.title}>Location changed</Text>
                    <Text style={styles.body}>
                        You seem to be in <Text style={styles.city}>{newCity}</Text>
                        {current?.name ? <Text> instead of <Text style={styles.city}>{current.name}</Text></Text> : null}.
                        {' '}Update your location?
                    </Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.keepBtn} onPress={dismiss} activeOpacity={0.85}>
                            <Text style={styles.keepText}>Keep {current?.name || 'current'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.updateBtn} onPress={confirm} activeOpacity={0.85}>
                            <Text style={styles.updateText}>Update</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' },
    iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 8 },
    body: { fontSize: 14, fontFamily: Fonts.regular, color: '#5D5F62', textAlign: 'center', lineHeight: 21, marginBottom: 22 },
    city: { fontFamily: Fonts.semiBold, color: '#07163B' },
    row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
    keepBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#D7DBDE', alignItems: 'center' },
    keepText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    updateBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FFD400', alignItems: 'center' },
    updateText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default LocationPrompt;
