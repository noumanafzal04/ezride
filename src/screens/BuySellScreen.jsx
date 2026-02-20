// src/screens/BuySellScreen.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const BuySellScreen = () => (
    <View style={styles.c}><Text style={styles.t}>Buy / Sell</Text></View>
);
const styles = StyleSheet.create({ c: { flex: 1, alignItems: 'center', justifyContent: 'center' }, t: { fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#07163B' } });
export default BuySellScreen;
