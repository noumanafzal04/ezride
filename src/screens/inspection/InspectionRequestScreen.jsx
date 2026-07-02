import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { useCities } from '../../hooks/useLookup';
import { useCurrentLocation } from '../../hooks/useLocation';
import useMe from '../../hooks/useMe';
import TopTabs from '../../components/TopTabs';
import MyInspectionsScreen from './MyInspectionsScreen';
import { useSubmitInspection } from '../../hooks/useInspections';
import SelectSheet from '../../components/SelectSheet';

// Date → "YYYY-MM-DD HH:mm:ss"
const fmtDateTime = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
const fmtDisplay = (d) =>
    d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

const InspectionRequestScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { data: me } = useMe();

    // ── Form state (contact prefilled from the logged-in user) ──
    const [name, setName]       = useState(me ? `${me.first_name || ''} ${me.last_name || ''}`.trim() : '');
    const [phone, setPhone]     = useState(me?.phone_number || '');
    const [email, setEmail]     = useState(me?.email || '');

    const [carMake, setCarMake]         = useState('');
    const [carModel, setCarModel]       = useState('');
    const [carYear, setCarYear]         = useState('');
    const [variant, setVariant]         = useState('');
    const [registrationNo, setRegistrationNo] = useState('');

    const [city, setCity]       = useState(null);
    const [address, setAddress] = useState('');

    // Prefill the city from the user's current location (once) — they can still change it.
    const { city: currentCity } = useCurrentLocation();
    const cityPrefilled = useRef(false);
    useEffect(() => {
        if (!cityPrefilled.current && !city && currentCity?.id) {
            setCity({ id: currentCity.id, name: currentCity.name });
            cityPrefilled.current = true;
        }
    }, [currentCity, city]);
    const [preferredAt, setPreferredAt] = useState(null);
    const [notes, setNotes]     = useState('');

    // ── City picker ──
    const [cityOpen, setCityOpen]     = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    // ── Date/time picker ──
    const [showPicker, setShowPicker] = useState(false);

    const submit = useSubmitInspection({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Request submitted', text2: 'Our team will contact you shortly.' });
            navigation.replace('MyInspections');
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Could not submit. Please try again.';
            Toast.show({ type: 'error', text1: 'Failed', text2: msg });
        },
    });

    const validate = () => {
        if (!name.trim())     return 'Please enter your name.';
        if (!phone.trim())    return 'Please enter a contact phone number.';
        if (!carMake.trim())  return 'Please enter the car make.';
        if (!carModel.trim()) return 'Please enter the car model.';
        if (carYear && (Number(carYear) < 1950 || Number(carYear) > 2100)) return 'Please enter a valid year.';
        return null;
    };

    const handleSubmit = () => {
        const error = validate();
        if (error) { Toast.show({ type: 'error', text1: 'Required', text2: error }); return; }

        submit.mutate({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
            car_make: carMake.trim(),
            car_model: carModel.trim(),
            car_year: carYear ? Number(carYear) : null,
            variant: variant.trim() || null,
            registration_no: registrationNo.trim() || null,
            city_id: city?.id ?? null,
            address: address.trim() || null,
            preferred_at: preferredAt ? fmtDateTime(preferredAt) : null,
            notes: notes.trim() || null,
        });
    };

    const submitting = submit.isPending;
    const [tab, setTab] = useState('book');

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Car Inspection</Text>
                <View style={{ width: 24 }} />
            </View>

            <TopTabs
                tabs={[{ key: 'book', label: 'Book Inspection' }, { key: 'mine', label: 'My Inspections' }]}
                active={tab}
                onChange={setTab}
            />

            {tab === 'mine' ? (
                <MyInspectionsScreen navigation={navigation} embedded />
            ) : (
            <>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
            >
                <View style={styles.body}>
                    {/* Intro */}
                    <View style={styles.intro}>
                        <Icon name="shield-car" size={20} color="#07163B" />
                        <Text style={styles.introText}>
                            Request a professional 200-point inspection. Our team reviews your request and contacts you to schedule.
                        </Text>
                    </View>

                    {/* Car details */}
                    <Text style={styles.section}>Car Details</Text>
                    <View style={styles.card}>
                        <Text style={styles.label}>Make</Text>
                        <TextInput style={styles.input} placeholder="e.g. Toyota" placeholderTextColor="#9CA3AF" value={carMake} onChangeText={setCarMake} />

                        <Text style={styles.label}>Model</Text>
                        <TextInput style={styles.input} placeholder="e.g. Corolla" placeholderTextColor="#9CA3AF" value={carModel} onChangeText={setCarModel} />

                        <View style={styles.row}>
                            <View style={styles.rowItem}>
                                <Text style={styles.label}>Year <Text style={styles.optional}>(optional)</Text></Text>
                                <TextInput style={styles.input} placeholder="2018" placeholderTextColor="#9CA3AF" value={carYear} onChangeText={setCarYear} keyboardType="number-pad" maxLength={4} />
                            </View>
                            <View style={styles.rowItem}>
                                <Text style={styles.label}>Variant <Text style={styles.optional}>(optional)</Text></Text>
                                <TextInput style={styles.input} placeholder="e.g. Altis" placeholderTextColor="#9CA3AF" value={variant} onChangeText={setVariant} />
                            </View>
                        </View>

                        <Text style={styles.label}>Registration No. <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput style={styles.input} placeholder="e.g. LEA-1234" placeholderTextColor="#9CA3AF" value={registrationNo} onChangeText={setRegistrationNo} autoCapitalize="characters" />
                    </View>

                    {/* Location & timing */}
                    <Text style={styles.section}>Location & Timing</Text>
                    <View style={styles.card}>
                        <Text style={styles.label}>City <Text style={styles.optional}>(optional)</Text></Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                            <Icon name="map-marker-outline" size={18} color="#9CA3AF" />
                            <Text style={city ? styles.selectVal : styles.selectPH}>{city?.name || 'Select city'}</Text>
                            <Icon name="chevron-down" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <Text style={styles.label}>Where is the car? <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput style={styles.input} placeholder="Area, street / showroom address" placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} />

                        <Text style={styles.label}>Preferred date & time <Text style={styles.optional}>(optional)</Text></Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setShowPicker(true)}>
                            <Icon name="calendar-clock" size={18} color="#9CA3AF" />
                            <Text style={preferredAt ? styles.selectVal : styles.selectPH}>
                                {preferredAt ? fmtDisplay(preferredAt) : 'Select date & time'}
                            </Text>
                            <Icon name="chevron-down" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            open={showPicker}
                            date={preferredAt || new Date()}
                            mode="datetime"
                            minimumDate={new Date()}
                            locale="en-US"
                            theme="light"
                            onConfirm={(d) => { setShowPicker(false); setPreferredAt(d); }}
                            onCancel={() => setShowPicker(false)}
                        />
                    </View>

                    {/* Contact */}
                    <Text style={styles.section}>Your Contact</Text>
                    <View style={styles.card}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />

                        <Text style={styles.label}>Phone</Text>
                        <TextInput style={styles.input} placeholder="03xx-xxxxxxx" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                        <Text style={styles.label}>Email <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                        <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Anything our team should know"
                            placeholderTextColor="#9CA3AF"
                            value={notes} onChangeText={setNotes}
                            multiline numberOfLines={3} textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.bottomBtn, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Request'}</Text>
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
            </>
            )}

            <SelectSheet
                visible={cityOpen}
                onClose={() => setCityOpen(false)}
                title="Select City"
                items={filteredCities}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={city?.id}
                onSelect={(c) => { setCity(c); setCityOpen(false); }}
            />
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
    headerLink: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

    body: { padding: 16, gap: 6 },
    intro: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,212,0,0.12)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
    },
    introText: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B', lineHeight: 18 },

    section: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62', marginTop: 10, marginBottom: 6, marginLeft: 2 },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1,
        borderColor: '#EAEDEE', padding: 16, gap: 10,
    },
    row: { flexDirection: 'row', gap: 12 },
    rowItem: { flex: 1 },

    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 2, marginTop: 4 },
    optional: { fontSize: 12, fontFamily: Fonts.regular, color: '#9CA3AF' },

    input: {
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#FFFFFF',
        fontFamily: Fonts.regular, fontSize: 14, color: '#07163B',
    },
    textArea: { height: 88, paddingTop: 12 },

    selectBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FFFFFF',
    },
    selectVal: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#07163B' },
    selectPH:  { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9CA3AF' },

    bottomBtn: {
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    submitBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: '#E5E7EB' },
    submitText: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default InspectionRequestScreen;
