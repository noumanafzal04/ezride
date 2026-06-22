import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
    TextInput, Image, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { useCities } from '../../hooks/useLookup';
import { useMyInspections } from '../../hooks/useInspections';
import { useCreateListing } from '../../hooks/useMarketplace';
import SelectSheet from '../../components/SelectSheet';

const IMG_OPTIONS = { mediaType: 'photo', quality: 0.8, selectionLimit: 12 };
const TRANSMISSIONS = ['automatic', 'manual'];
const FUELS = ['petrol', 'diesel', 'hybrid', 'electric', 'cng'];
const CONDITIONS = ['used', 'new'];
const Cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const SellCarScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const [type, setType] = useState('self');           // self | managed
    const [images, setImages] = useState([]);           // {uri,type,fileName}
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [variant, setVariant] = useState('');
    const [year, setYear] = useState('');
    const [price, setPrice] = useState('');
    const [mileage, setMileage] = useState('');
    const [condition, setCondition] = useState('used');
    const [transmission, setTransmission] = useState(null);
    const [fuel, setFuel] = useState(null);
    const [engineCc, setEngineCc] = useState('');
    const [color, setColor] = useState('');
    const [city, setCity] = useState(null);
    const [area, setArea] = useState('');
    const [description, setDescription] = useState('');
    const [features, setFeatures] = useState([]);
    const [featureInput, setFeatureInput] = useState('');
    const [inspection, setInspection] = useState(null);

    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [inspOpen, setInspOpen] = useState(false);

    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase()));

    const inspQuery = useMyInspections();
    const completedInspections = (inspQuery.data?.pages || [])
        .flatMap(p => p.requests || [])
        .filter(r => r.status === 'completed')
        .map(r => ({ id: r.id, name: `${r.car_make || ''} ${r.car_model || ''}`.trim() + (r.overall_grade ? ` · Grade ${r.overall_grade}` : '') }));

    const create = useCreateListing({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: type === 'managed' ? 'Submitted to EZRide' : 'Listing posted' });
            navigation.goBack();
        },
        onError: (e) => Alert.alert('Could not post', e.response?.data?.message || 'Please try again.'),
    });

    const pickImages = async () => {
        const { launchImageLibrary } = require('react-native-image-picker');
        const res = await launchImageLibrary(IMG_OPTIONS);
        if (res.didCancel || !res.assets) return;
        setImages(prev => [...prev, ...res.assets].slice(0, 12));
    };
    const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

    const addFeature = () => {
        const f = featureInput.trim();
        if (f && !features.includes(f)) setFeatures(prev => [...prev, f]);
        setFeatureInput('');
    };

    const submit = () => {
        if (!make.trim() || !model.trim() || !year.trim()) {
            Alert.alert('Missing info', 'Make, model and year are required.');
            return;
        }
        if (type === 'self' && !price.trim()) {
            Alert.alert('Add a price', 'Please set a price, or choose “Sell with EZRide” to let us price it.');
            return;
        }
        const fd = new FormData();
        fd.append('listing_type', type);
        fd.append('make', make.trim());
        fd.append('model', model.trim());
        if (variant.trim()) fd.append('variant', variant.trim());
        fd.append('year', year.trim());
        if (price.trim()) fd.append('price', price.trim());
        if (mileage.trim()) fd.append('mileage', mileage.trim());
        fd.append('condition', condition);
        if (transmission) fd.append('transmission', transmission);
        if (fuel) fd.append('fuel_type', fuel);
        if (engineCc.trim()) fd.append('engine_cc', engineCc.trim());
        if (color.trim()) fd.append('color', color.trim());
        if (city) fd.append('city_id', String(city.id));
        if (area.trim()) fd.append('area', area.trim());
        if (description.trim()) fd.append('description', description.trim());
        features.forEach(f => fd.append('features[]', f));
        if (inspection) fd.append('inspection_request_id', String(inspection.id));
        images.forEach((img, i) => fd.append('images[]', {
            uri: img.uri, type: img.type || 'image/jpeg', name: img.fileName || `car_${i}.jpg`,
        }));

        create.mutate(fd);
    };

    const input = styles.input;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#07163B" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Sell a Car</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                {/* Listing type */}
                <View style={styles.typeRow}>
                    <TouchableOpacity style={[styles.typeCard, type === 'self' && styles.typeCardOn]} onPress={() => setType('self')} activeOpacity={0.85}>
                        <Icon name="account" size={20} color={type === 'self' ? '#07163B' : '#9AA0A6'} />
                        <Text style={[styles.typeTitle, type === 'self' && styles.typeTitleOn]}>Sell myself</Text>
                        <Text style={styles.typeSub}>You handle buyers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.typeCard, type === 'managed' && styles.typeCardOn]} onPress={() => setType('managed')} activeOpacity={0.85}>
                        <Icon name="shield-check" size={20} color={type === 'managed' ? '#07163B' : '#9AA0A6'} />
                        <Text style={[styles.typeTitle, type === 'managed' && styles.typeTitleOn]}>Sell with EZRide</Text>
                        <Text style={styles.typeSub}>We manage the sale</Text>
                    </TouchableOpacity>
                </View>
                {type === 'managed' && (
                    <View style={styles.managedNote}>
                        <Icon name="information" size={16} color="#92600B" />
                        <Text style={styles.managedNoteTxt}>EZRide will inspect, price and handle buyers for you. We’ll review your submission and get in touch.</Text>
                    </View>
                )}

                {/* Photos */}
                <Text style={styles.label}>Photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    <TouchableOpacity style={styles.addPhoto} onPress={pickImages}>
                        <Icon name="camera-plus-outline" size={24} color="#9AA0A6" />
                        <Text style={styles.addPhotoTxt}>Add</Text>
                    </TouchableOpacity>
                    {images.map((img, i) => (
                        <View key={i} style={styles.photoWrap}>
                            <Image source={{ uri: img.uri }} style={styles.photo} />
                            <TouchableOpacity style={styles.photoRemove} onPress={() => removeImage(i)}>
                                <Icon name="close" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                            {i === 0 && <View style={styles.primaryTag}><Text style={styles.primaryTagTxt}>Cover</Text></View>}
                        </View>
                    ))}
                </ScrollView>

                {/* Car info */}
                <Text style={styles.label}>Make *</Text>
                <TextInput style={input} value={make} onChangeText={setMake} placeholder="e.g. Honda" placeholderTextColor="#AAA" />
                <Text style={styles.label}>Model *</Text>
                <TextInput style={input} value={model} onChangeText={setModel} placeholder="e.g. Civic" placeholderTextColor="#AAA" />
                <View style={styles.row}>
                    <View style={styles.col}><Text style={styles.label}>Variant</Text><TextInput style={input} value={variant} onChangeText={setVariant} placeholder="Oriel" placeholderTextColor="#AAA" /></View>
                    <View style={styles.col}><Text style={styles.label}>Year *</Text><TextInput style={input} value={year} onChangeText={setYear} placeholder="2021" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}><Text style={styles.label}>Price (Rs.){type === 'managed' ? '' : ' *'}</Text><TextInput style={input} value={price} onChangeText={setPrice} placeholder={type === 'managed' ? 'Optional' : '7,200,000'} placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                    <View style={styles.col}><Text style={styles.label}>Mileage (km)</Text><TextInput style={input} value={mileage} onChangeText={setMileage} placeholder="32000" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                </View>

                <Text style={styles.label}>Condition</Text>
                <View style={styles.chips}>{CONDITIONS.map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, condition === c && styles.chipOn]} onPress={() => setCondition(c)}><Text style={[styles.chipTxt, condition === c && styles.chipTxtOn]}>{Cap(c)}</Text></TouchableOpacity>
                ))}</View>

                <Text style={styles.label}>Transmission</Text>
                <View style={styles.chips}>{TRANSMISSIONS.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, transmission === t && styles.chipOn]} onPress={() => setTransmission(transmission === t ? null : t)}><Text style={[styles.chipTxt, transmission === t && styles.chipTxtOn]}>{Cap(t)}</Text></TouchableOpacity>
                ))}</View>

                <Text style={styles.label}>Fuel type</Text>
                <View style={styles.chips}>{FUELS.map(f => (
                    <TouchableOpacity key={f} style={[styles.chip, fuel === f && styles.chipOn]} onPress={() => setFuel(fuel === f ? null : f)}><Text style={[styles.chipTxt, fuel === f && styles.chipTxtOn]}>{Cap(f)}</Text></TouchableOpacity>
                ))}</View>

                <View style={styles.row}>
                    <View style={styles.col}><Text style={styles.label}>Engine (cc)</Text><TextInput style={input} value={engineCc} onChangeText={setEngineCc} placeholder="1800" placeholderTextColor="#AAA" keyboardType="numeric" /></View>
                    <View style={styles.col}><Text style={styles.label}>Color</Text><TextInput style={input} value={color} onChangeText={setColor} placeholder="White" placeholderTextColor="#AAA" /></View>
                </View>

                <Text style={styles.label}>City</Text>
                <TouchableOpacity style={styles.select} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                    <Text style={city ? styles.selectVal : styles.selectPh}>{city?.name || 'Select city'}</Text>
                    <Icon name="chevron-down" size={18} color="#9E9E9E" />
                </TouchableOpacity>
                <Text style={styles.label}>Area / location</Text>
                <TextInput style={input} value={area} onChangeText={setArea} placeholder="e.g. DHA Phase 5" placeholderTextColor="#AAA" />

                {/* Features */}
                <Text style={styles.label}>Features</Text>
                <View style={styles.featureRow}>
                    <TextInput style={[input, { flex: 1, marginBottom: 0 }]} value={featureInput} onChangeText={setFeatureInput} placeholder="e.g. Sunroof" placeholderTextColor="#AAA" onSubmitEditing={addFeature} returnKeyType="done" />
                    <TouchableOpacity style={styles.addFeatureBtn} onPress={addFeature}><Icon name="plus" size={20} color="#07163B" /></TouchableOpacity>
                </View>
                {!!features.length && (
                    <View style={[styles.chips, { marginTop: 10 }]}>{features.map((f, i) => (
                        <TouchableOpacity key={i} style={styles.featureChip} onPress={() => setFeatures(prev => prev.filter((_, idx) => idx !== i))}>
                            <Text style={styles.featureChipTxt}>{f}</Text><Icon name="close" size={13} color="#5D5F62" />
                        </TouchableOpacity>
                    ))}</View>
                )}

                {/* Inspection link */}
                <Text style={styles.label}>EZRide inspection (optional)</Text>
                {completedInspections.length ? (
                    <TouchableOpacity style={styles.select} onPress={() => setInspOpen(true)}>
                        <Text style={inspection ? styles.selectVal : styles.selectPh}>{inspection?.name || 'Link a completed inspection'}</Text>
                        <Icon name="chevron-down" size={18} color="#9E9E9E" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.inspectCta} onPress={() => navigation.navigate('InspectionRequest')}>
                        <Icon name="clipboard-check-outline" size={18} color="#1D6AFF" />
                        <Text style={styles.inspectCtaTxt}>Get your car inspected to add a trust badge</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.label}>Description</Text>
                <TextInput style={[input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Condition, ownership, reason for selling…" placeholderTextColor="#AAA" multiline />

                <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={create.isPending} activeOpacity={0.85}>
                    {create.isPending ? <ActivityIndicator color="#07163B" /> : (
                        <Text style={styles.submitTxt}>{type === 'managed' ? 'Submit to EZRide' : 'Post Listing'}</Text>
                    )}
                </TouchableOpacity>
                <View style={{ height: insets.bottom }} />
            </ScrollView>

            <SelectSheet
                visible={cityOpen} onClose={() => setCityOpen(false)} title="Select City"
                items={filteredCities} loading={citiesQuery.isLoading}
                searchable search={citySearch} onSearch={setCitySearch}
                selectedId={city?.id} onSelect={(c) => { setCity(c); setCityOpen(false); }}
            />
            <SelectSheet
                visible={inspOpen} onClose={() => setInspOpen(false)} title="Link Inspection"
                items={completedInspections} selectedId={inspection?.id}
                onSelect={(i) => { setInspection(i); setInspOpen(false); }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    typeRow: { flexDirection: 'row', gap: 12 },
    typeCard: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EAEDEE', borderRadius: 14, padding: 14, gap: 4 },
    typeCardOn: { borderColor: '#FFD400', backgroundColor: '#FFFDF2' },
    typeTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#9AA0A6' },
    typeTitleOn: { color: '#07163B' },
    typeSub: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    managedNote: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginTop: 12 },
    managedNoteTxt: { flex: 1, fontSize: 12.5, fontFamily: Fonts.regular, color: '#92600B', lineHeight: 18 },

    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginTop: 18, marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 14, color: '#202223', marginBottom: 0 },
    textarea: { minHeight: 90, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },

    addPhoto: { width: 84, height: 84, borderRadius: 12, borderWidth: 1.5, borderColor: '#D7DBDE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FFFFFF' },
    addPhotoTxt: { fontSize: 11, fontFamily: Fonts.medium, color: '#9AA0A6' },
    photoWrap: { width: 84, height: 84, borderRadius: 12, overflow: 'hidden' },
    photo: { width: '100%', height: '100%' },
    photoRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
    primaryTag: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(7,22,59,0.75)', alignItems: 'center', paddingVertical: 2 },
    primaryTagTxt: { fontSize: 9, fontFamily: Fonts.semiBold, color: '#FFFFFF' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF' },
    chipOn: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTxtOn: { color: '#FFFFFF' },

    select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13 },
    selectVal: { fontSize: 14, fontFamily: Fonts.medium, color: '#202223' },
    selectPh: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },

    featureRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    addFeatureBtn: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    featureChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F1F3', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7 },
    featureChipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#202223' },

    inspectCta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF4FF', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 13 },
    inspectCtaTxt: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#1D6AFF' },

    submitBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 26 },
    submitTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
});

export default SellCarScreen;
