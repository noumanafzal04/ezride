import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
    TextInput, Image, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { useCities } from '../../hooks/useLookup';
import { useCreateRental } from '../../hooks/useRentals';
import SelectSheet from '../../components/SelectSheet';

const IMG_OPTIONS = { mediaType: 'photo', quality: 0.8, selectionLimit: 12 };
const CATEGORIES = ['economy', 'sedan', 'suv', 'luxury', 'van'];
const TRANSMISSIONS = ['automatic', 'manual'];
const FUELS = ['petrol', 'diesel', 'hybrid', 'electric', 'cng'];
const RENTAL_TYPES = [{ k: 'with_driver', l: 'With driver' }, { k: 'self_drive', l: 'Self-drive' }, { k: 'both', l: 'Both' }];
const Cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const ListRentalScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [type, setType] = useState('self');
    const [images, setImages] = useState([]);
    const [make, setMake] = useState(''); const [model, setModel] = useState(''); const [year, setYear] = useState('');
    const [category, setCategory] = useState('sedan'); const [seats, setSeats] = useState('');
    const [transmission, setTransmission] = useState(null); const [fuel, setFuel] = useState(null); const [color, setColor] = useState('');
    const [rentalType, setRentalType] = useState('with_driver');
    const [pricePerDay, setPricePerDay] = useState(''); const [priceSelf, setPriceSelf] = useState(''); const [deposit, setDeposit] = useState(''); const [minDays, setMinDays] = useState('1');
    const [city, setCity] = useState(null); const [area, setArea] = useState(''); const [description, setDescription] = useState('');
    const [features, setFeatures] = useState([]); const [featureInput, setFeatureInput] = useState('');
    const [cityOpen, setCityOpen] = useState(false); const [citySearch, setCitySearch] = useState('');

    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c => !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase()));
    const showSelf = rentalType === 'self_drive' || rentalType === 'both';

    const create = useCreateRental({
        onSuccess: () => { Toast.show({ type: 'success', text1: type === 'managed' ? 'Submitted to EZRide' : 'Rental listed' }); navigation.goBack(); },
        onError: (e) => Toast.show({ type: 'error', text1: 'Could not list', text2: e.response?.data?.message || 'Please try again.' }),
    });

    const pickImages = async () => {
        const { launchImageLibrary } = require('react-native-image-picker');
        const res = await launchImageLibrary(IMG_OPTIONS);
        if (res.didCancel || !res.assets) return;
        setImages(prev => [...prev, ...res.assets].slice(0, 12));
    };
    const addFeature = () => { const f = featureInput.trim(); if (f && !features.includes(f)) setFeatures(p => [...p, f]); setFeatureInput(''); };

    const submit = () => {
        if (!make.trim() || !model.trim() || !year.trim()) { Alert.alert('Missing info', 'Make, model and year are required.'); return; }
        if (rentalType !== 'self_drive' && !pricePerDay.trim()) { Alert.alert('Add a price', 'Set the daily price (with driver).'); return; }
        const fd = new FormData();
        fd.append('listing_type', type);
        fd.append('make', make.trim()); fd.append('model', model.trim()); fd.append('year', year.trim());
        fd.append('category', category); if (seats.trim()) fd.append('seats', seats.trim());
        if (transmission) fd.append('transmission', transmission);
        if (fuel) fd.append('fuel_type', fuel);
        if (color.trim()) fd.append('color', color.trim());
        fd.append('rental_type', rentalType);
        if (pricePerDay.trim()) fd.append('price_per_day', pricePerDay.trim());
        if (showSelf && priceSelf.trim()) fd.append('price_per_day_self', priceSelf.trim());
        if (showSelf && deposit.trim()) fd.append('deposit', deposit.trim());
        fd.append('min_days', minDays.trim() || '1');
        if (city) fd.append('city_id', String(city.id));
        if (area.trim()) fd.append('area', area.trim());
        if (description.trim()) fd.append('description', description.trim());
        features.forEach(f => fd.append('features[]', f));
        images.forEach((img, i) => fd.append('images[]', { uri: img.uri, type: img.type || 'image/jpeg', name: img.fileName || `rental_${i}.jpg` }));
        create.mutate(fd);
    };

    const input = styles.input;
    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#07163B" /></TouchableOpacity>
                <Text style={styles.headerTitle}>List a Car for Rent</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20}>
                <View style={styles.typeRow}>
                    <TouchableOpacity style={[styles.typeCard, type === 'self' && styles.typeOn]} onPress={() => setType('self')}><Icon name="account" size={20} color={type === 'self' ? '#07163B' : '#9AA0A6'} /><Text style={[styles.typeTitle, type === 'self' && styles.typeTitleOn]}>List myself</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.typeCard, type === 'managed' && styles.typeOn]} onPress={() => setType('managed')}><Icon name="shield-check" size={20} color={type === 'managed' ? '#07163B' : '#9AA0A6'} /><Text style={[styles.typeTitle, type === 'managed' && styles.typeTitleOn]}>Manage by EZRide</Text></TouchableOpacity>
                </View>

                <Text style={styles.label}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    <TouchableOpacity style={styles.addPhoto} onPress={pickImages}><Icon name="camera-plus-outline" size={24} color="#9AA0A6" /><Text style={styles.addPhotoTxt}>Add</Text></TouchableOpacity>
                    {images.map((img, i) => (
                        <View key={i} style={styles.photoWrap}>
                            <Image source={{ uri: img.uri }} style={styles.photo} />
                            <TouchableOpacity style={styles.photoRm} onPress={() => setImages(p => p.filter((_, idx) => idx !== i))}><Icon name="close" size={13} color="#FFF" /></TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Make *</Text><TextInput style={input} value={make} onChangeText={setMake} placeholder="Toyota" placeholderTextColor="#AAA" />
                <Text style={styles.label}>Model *</Text><TextInput style={input} value={model} onChangeText={setModel} placeholder="Fortuner" placeholderTextColor="#AAA" />
                <View style={styles.row}>
                    <View style={styles.col}><Text style={styles.label}>Year *</Text><TextInput style={input} value={year} onChangeText={setYear} placeholder="2022" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                    <View style={styles.col}><Text style={styles.label}>Seats</Text><TextInput style={input} value={seats} onChangeText={setSeats} placeholder="7" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                </View>

                <Text style={styles.label}>Category</Text>
                <View style={styles.chips}>{CATEGORIES.map(cc => (<TouchableOpacity key={cc} style={[styles.chip, category === cc && styles.chipOn]} onPress={() => setCategory(cc)}><Text style={[styles.chipTxt, category === cc && styles.chipTxtOn]}>{Cap(cc)}</Text></TouchableOpacity>))}</View>

                <Text style={styles.label}>Rental type</Text>
                <View style={styles.chips}>{RENTAL_TYPES.map(rt => (<TouchableOpacity key={rt.k} style={[styles.chip, rentalType === rt.k && styles.chipOn]} onPress={() => setRentalType(rt.k)}><Text style={[styles.chipTxt, rentalType === rt.k && styles.chipTxtOn]}>{rt.l}</Text></TouchableOpacity>))}</View>

                <View style={styles.row}>
                    <View style={styles.col}><Text style={styles.label}>Price/day (Rs.){rentalType === 'self_drive' ? '' : ' *'}</Text><TextInput style={input} value={pricePerDay} onChangeText={setPricePerDay} placeholder="15000" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                    <View style={styles.col}><Text style={styles.label}>Min days</Text><TextInput style={input} value={minDays} onChangeText={setMinDays} placeholder="1" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                </View>
                {showSelf && (
                    <View style={styles.row}>
                        <View style={styles.col}><Text style={styles.label}>Self-drive price/day</Text><TextInput style={input} value={priceSelf} onChangeText={setPriceSelf} placeholder="9000" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                        <View style={styles.col}><Text style={styles.label}>Deposit (Rs.)</Text><TextInput style={input} value={deposit} onChangeText={setDeposit} placeholder="50000" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                    </View>
                )}

                <View style={styles.row}>
                    <View style={styles.col}><Text style={styles.label}>Transmission</Text>
                        <View style={styles.chips}>{TRANSMISSIONS.map(t => (<TouchableOpacity key={t} style={[styles.chipSm, transmission === t && styles.chipOn]} onPress={() => setTransmission(transmission === t ? null : t)}><Text style={[styles.chipTxt, transmission === t && styles.chipTxtOn]}>{Cap(t)}</Text></TouchableOpacity>))}</View>
                    </View>
                </View>
                <Text style={styles.label}>Fuel</Text>
                <View style={styles.chips}>{FUELS.map(f => (<TouchableOpacity key={f} style={[styles.chipSm, fuel === f && styles.chipOn]} onPress={() => setFuel(fuel === f ? null : f)}><Text style={[styles.chipTxt, fuel === f && styles.chipTxtOn]}>{Cap(f)}</Text></TouchableOpacity>))}</View>

                <Text style={styles.label}>City</Text>
                <TouchableOpacity style={styles.select} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                    <Text style={city ? styles.selectVal : styles.selectPh}>{city?.name || 'Select city'}</Text><Icon name="chevron-down" size={18} color="#9E9E9E" />
                </TouchableOpacity>
                <Text style={styles.label}>Area</Text><TextInput style={input} value={area} onChangeText={setArea} placeholder="e.g. DHA Phase 5" placeholderTextColor="#AAA" />
                <Text style={styles.label}>Color</Text><TextInput style={input} value={color} onChangeText={setColor} placeholder="White" placeholderTextColor="#AAA" />

                <Text style={styles.label}>Features</Text>
                <View style={styles.featureRow}>
                    <TextInput style={[input, { flex: 1, marginBottom: 0 }]} value={featureInput} onChangeText={setFeatureInput} placeholder="e.g. AC, GPS" placeholderTextColor="#AAA" onSubmitEditing={addFeature} returnKeyType="done" />
                    <TouchableOpacity style={styles.addFeature} onPress={addFeature}><Icon name="plus" size={20} color="#07163B" /></TouchableOpacity>
                </View>
                {!!features.length && <View style={[styles.chips, { marginTop: 10 }]}>{features.map((f, i) => (<TouchableOpacity key={i} style={styles.fChip} onPress={() => setFeatures(p => p.filter((_, idx) => idx !== i))}><Text style={styles.fChipTxt}>{f}</Text><Icon name="close" size={13} color="#5D5F62" /></TouchableOpacity>))}</View>}

                <Text style={styles.label}>Description</Text>
                <TextInput style={[input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Condition, rules, anything renters should know…" placeholderTextColor="#AAA" multiline />

                <TouchableOpacity style={styles.submit} onPress={submit} disabled={create.isPending} activeOpacity={0.85}>
                    {create.isPending ? <ActivityIndicator color="#07163B" /> : <Text style={styles.submitTxt}>{type === 'managed' ? 'Submit to EZRide' : 'List Rental'}</Text>}
                </TouchableOpacity>
                <View style={{ height: insets.bottom }} />
            </KeyboardAwareScrollView>

            <SelectSheet visible={cityOpen} onClose={() => setCityOpen(false)} title="Select City" items={filteredCities} loading={citiesQuery.isLoading}
                searchable search={citySearch} onSearch={setCitySearch} selectedId={city?.id} onSelect={(c) => { setCity(c); setCityOpen(false); }} />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    typeRow: { flexDirection: 'row', gap: 12 },
    typeCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EAEDEE', borderRadius: 14, padding: 14, gap: 4, alignItems: 'flex-start' },
    typeOn: { borderColor: '#FFD400', backgroundColor: '#FFFDF2' },
    typeTitle: { fontSize: 13.5, fontFamily: Fonts.semiBold, color: '#9AA0A6' },
    typeTitleOn: { color: '#07163B' },
    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginTop: 18, marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 14, color: '#202223' },
    textarea: { minHeight: 88, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12 }, col: { flex: 1 },
    addPhoto: { width: 84, height: 84, borderRadius: 12, borderWidth: 1.5, borderColor: '#D7DBDE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FFFFFF' },
    addPhotoTxt: { fontSize: 11, fontFamily: Fonts.medium, color: '#9AA0A6' },
    photoWrap: { width: 84, height: 84, borderRadius: 12, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoRm: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF' },
    chipSm: { borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#FFFFFF' },
    chipOn: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTxtOn: { color: '#FFFFFF' },
    select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13 },
    selectVal: { fontSize: 14, fontFamily: Fonts.medium, color: '#202223' },
    selectPh: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },
    featureRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    addFeature: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    fChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F1F3', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7 },
    fChipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#202223' },
    submit: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
    submitTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
});

export default ListRentalScreen;
