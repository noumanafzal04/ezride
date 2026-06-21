import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { useCreateServiceBooking } from '../../hooks/useServices';

const fmtDateTime = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
const fmtDisplay = (d) =>
    d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

const ServiceRequestScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const provider = route?.params?.provider || {};
    const cats = provider.categories || [];

    const [categoryId, setCategoryId] = useState(cats[0]?.id || null);
    const [locationType, setLocationType] = useState('at_shop');
    const [address, setAddress] = useState('');
    const [carInfo, setCarInfo] = useState('');
    const [notes, setNotes] = useState('');
    const [scheduledAt, setScheduledAt] = useState(null);
    const [pickerMode, setPickerMode] = useState(null);
    const [draftDate, setDraftDate] = useState(new Date());

    const onPickerChange = (event, selected) => {
        if (event.type === 'dismissed' || !selected) { setPickerMode(null); return; }
        if (pickerMode === 'date') {
            setDraftDate(selected);
            setPickerMode(Platform.OS === 'ios' ? null : 'time');
            if (Platform.OS === 'ios') setScheduledAt(selected);
        } else {
            const combined = new Date(draftDate);
            combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
            setScheduledAt(combined);
            setPickerMode(null);
        }
    };

    const create = useCreateServiceBooking({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Request sent', text2: 'The provider will respond shortly.' });
            navigation.replace('MyServiceRequests');
        },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const handleSubmit = () => {
        if (locationType === 'at_home' && !address.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Enter your address for at-home service.' });
            return;
        }
        create.mutate({
            providerId: provider.id,
            payload: {
                category_id: categoryId,
                scheduled_at: scheduledAt ? fmtDateTime(scheduledAt) : null,
                location_type: locationType,
                address: address.trim() || null,
                car_info: carInfo.trim() || null,
                notes: notes.trim() || null,
            },
        });
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request Service</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 + insets.bottom }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.providerCard}>
                    <View style={styles.avatar}><Text style={styles.avatarInitial}>{(provider.business_name?.[0] || '?').toUpperCase()}</Text></View>
                    <Text style={styles.bizName}>{provider.business_name}</Text>
                </View>

                {cats.length > 0 && (
                    <>
                        <Text style={styles.label}>Service needed</Text>
                        <View style={styles.chips}>
                            {cats.map(c => {
                                const on = categoryId === c.id;
                                return (
                                    <TouchableOpacity key={c.id} style={[styles.chip, on && styles.chipOn]} onPress={() => setCategoryId(c.id)} activeOpacity={0.8}>
                                        {!!c.icon && <Icon name={c.icon} size={15} color={on ? '#07163B' : '#9CA3AF'} />}
                                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                <Text style={styles.label}>Where</Text>
                <View style={styles.toggleRow}>
                    {[['at_shop', 'At the shop', 'store-outline'], ['at_home', 'At my location', 'home-outline']].map(([val, lbl, icon]) => {
                        const on = locationType === val;
                        return (
                            <TouchableOpacity key={val} style={[styles.toggleBtn, on && styles.toggleBtnOn]} onPress={() => setLocationType(val)} activeOpacity={0.85}>
                                <Icon name={icon} size={17} color={on ? '#07163B' : '#9CA3AF'} />
                                <Text style={[styles.toggleText, on && styles.toggleTextOn]}>{lbl}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {locationType === 'at_home' && (
                    <TextInput style={styles.input} placeholder="Your address" placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} />
                )}

                <Text style={styles.label}>Preferred date & time <Text style={styles.optional}>(optional)</Text></Text>
                <TouchableOpacity style={styles.selectBox} onPress={() => { setPickerMode('date'); setDraftDate(scheduledAt || new Date()); }}>
                    <Icon name="calendar-clock" size={18} color="#9CA3AF" />
                    <Text style={scheduledAt ? styles.selectVal : styles.selectPH}>{scheduledAt ? fmtDisplay(scheduledAt) : 'Select date & time'}</Text>
                    <Icon name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {pickerMode && (
                    <DateTimePicker value={draftDate} mode={pickerMode} display="default" minimumDate={pickerMode === 'date' ? new Date() : undefined} onChange={onPickerChange} />
                )}

                <Text style={styles.label}>Your car <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput style={styles.input} placeholder="e.g. Toyota Corolla 2018" placeholderTextColor="#9CA3AF" value={carInfo} onChangeText={setCarInfo} />

                <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the problem / what you need" placeholderTextColor="#9CA3AF" value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
            </ScrollView>

            <View style={[styles.bottomBtn, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, create.isPending && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={create.isPending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>{create.isPending ? 'Sending…' : 'Send Request'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerSpacer: { width: 24 },

    providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, marginBottom: 14 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B' },
    bizName: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },

    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 8, marginTop: 12 },
    optional: { fontSize: 12, fontFamily: Fonts.regular, color: '#9CA3AF' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
    chipOn: { backgroundColor: 'rgba(255,212,0,0.15)', borderColor: 'rgba(255,212,0,0.7)' },
    chipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTextOn: { color: '#07163B', fontFamily: Fonts.semiBold },

    toggleRow: { flexDirection: 'row', gap: 10 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10, paddingVertical: 12, backgroundColor: '#FFFFFF' },
    toggleBtnOn: { backgroundColor: 'rgba(255,212,0,0.12)', borderColor: 'rgba(255,212,0,0.7)' },
    toggleText: { fontSize: 13, fontFamily: Fonts.medium, color: '#5D5F62' },
    toggleTextOn: { color: '#07163B', fontFamily: Fonts.semiBold },

    input: {
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#FFFFFF',
        fontFamily: Fonts.regular, fontSize: 14, color: '#07163B', marginTop: 8,
    },
    textArea: { height: 90, paddingTop: 12 },
    selectBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FFFFFF',
    },
    selectVal: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#07163B' },
    selectPH: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9CA3AF' },

    bottomBtn: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    submitBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: '#E5E7EB' },
    submitText: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default ServiceRequestScreen;
