import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';

// Pretty formatters (time always 12-hour with AM/PM).
const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const fmtBoth = (d) => `${fmtDate(d)}  ·  ${fmtTime(d)}`;

/**
 * Polished date / time / datetime field with an iOS-style scroll-wheel modal
 * (react-native-date-picker — same wheel UI on iOS & Android, AM/PM time).
 *
 * Props: label, value (Date|null), onChange(Date), mode ('date'|'time'|'datetime'),
 *        minimumDate, maximumDate, placeholder, icon, title, style.
 */
const DateTimeField = ({
    label,
    value,
    onChange,
    mode = 'date',
    minimumDate,
    maximumDate,
    placeholder = 'Select',
    icon,
    title,
    style,
}) => {
    const [open, setOpen] = useState(false);

    const defaultIcon = mode === 'time' ? 'clock-outline' : 'calendar-outline';
    const display = value
        ? (mode === 'time' ? fmtTime(value) : mode === 'datetime' ? fmtBoth(value) : fmtDate(value))
        : placeholder;

    return (
        <>
            <TouchableOpacity style={[styles.field, style]} activeOpacity={0.7} onPress={() => setOpen(true)}>
                <Icon name={icon || defaultIcon} size={18} color="#07163B" />
                <View style={styles.texts}>
                    {!!label && <Text style={styles.label}>{label}</Text>}
                    <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>{display}</Text>
                </View>
                <Icon name="chevron-down" size={18} color="#9AA0A6" />
            </TouchableOpacity>

            <DatePicker
                modal
                open={open}
                date={value || new Date()}
                mode={mode}
                title={title || label || null}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="en-US"          // 12-hour wheel with AM/PM
                is24hourSource="locale"
                theme="light"
                onConfirm={(d) => { setOpen(false); onChange(d); }}
                onCancel={() => setOpen(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    field: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12,
        paddingHorizontal: 13, paddingVertical: 11, backgroundColor: '#FFFFFF',
    },
    texts: { flex: 1 },
    label: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6', marginBottom: 2 },
    value: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    placeholder: { fontFamily: Fonts.regular, color: '#AAAAAA' },
});

export default DateTimeField;
