import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Fonts from '../constants/fonts';

// Underline tab bar. tabs = [{ key, label }].
const TopTabs = ({ tabs, active, onChange }) => (
    <View style={styles.wrap}>
        {tabs.map((t) => {
            const on = active === t.key;
            return (
                <TouchableOpacity key={t.key} style={styles.tab} activeOpacity={0.8} onPress={() => onChange(t.key)}>
                    <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
                    <View style={[styles.underline, on && styles.underlineOn]} />
                </TouchableOpacity>
            );
        })}
    </View>
);

const styles = StyleSheet.create({
    wrap: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAEDEE', paddingHorizontal: 16 },
    tab: { flex: 1, alignItems: 'center', paddingTop: 12, gap: 8 },
    label: { fontSize: 14, fontFamily: Fonts.medium, color: '#9AA0A6' },
    labelOn: { color: '#07163B', fontFamily: Fonts.semiBold },
    underline: { height: 2.5, width: '60%', borderRadius: 2, backgroundColor: 'transparent' },
    underlineOn: { backgroundColor: '#FFD400' },
});

export default TopTabs;
