import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
    Image, Dimensions, Linking, TextInput, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { fileUrl } from '../../utils/media';
import { DetailSkeleton } from '../../components/Skeletons';
import { useRental, useBookRental } from '../../hooks/useRentals';

const { width } = Dimensions.get('window');
const SUPPORT_PHONE = '+923000000000';
const money = (n) => (n == null ? 'On request' : `Rs. ${Number(n).toLocaleString()}`);
const Cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const ymd = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const niceDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const RentalDetailScreen = ({ navigation, route }) => {
    const { id } = route.params || {};
    const insets = useSafeAreaInsets();
    const { data: c, isLoading, isError } = useRental(id);

    const [active, setActive] = useState(0);
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [pickup, setPickup] = useState('');
    const [withDriver, setWithDriver] = useState(true);
    const [picker, setPicker] = useState(null); // 'start' | 'end'

    const book = useBookRental({
        onSuccess: () => { Toast.show({ type: 'success', text1: 'Request sent', text2: 'The owner will confirm shortly.' }); navigation.goBack(); },
        onError: (e) => Alert.alert('Could not book', e.response?.data?.message || 'Try again.'),
    });

    if (isLoading) return <View style={styles.root}><StatusBar backgroundColor="#000" barStyle="light-content" /><DetailSkeleton /></View>;
    if (isError || !c) return <View style={styles.center}><Icon name="alert-circle-outline" size={40} color="#DDD" /><Text style={styles.muted}>Could not load this car.</Text></View>;

    const images = (c.images || []).map(i => fileUrl(i.path)).filter(Boolean);
    const driverMode = c.rental_type;            // with_driver | self_drive | both
    const effectiveDriver = driverMode === 'both' ? withDriver : driverMode === 'with_driver';
    const rate = effectiveDriver ? c.price_per_day : (c.price_per_day_self ?? c.price_per_day);
    const days = start && end ? Math.max(1, Math.round((end - start) / 86400000) + 1) : 0;
    const estimate = rate && days ? rate * days : null;

    const specs = [
        ['car-info', Cap(c.category)], ['account-multiple', c.seats ? `${c.seats} seats` : null],
        ['car-shift-pattern', Cap(c.transmission)], ['gas-station', Cap(c.fuel_type)],
        ['palette', c.color], ['map-marker', c.city?.name], ['calendar-range', `Min ${c.min_days} day${c.min_days > 1 ? 's' : ''}`],
    ].filter(([, v]) => v && v !== '—');

    const submit = () => {
        if (!start || !end) { Alert.alert('Pick dates', 'Choose pickup and return dates.'); return; }
        book.mutate({ id: c.id, payload: { start_date: ymd(start), end_date: ymd(end), with_driver: effectiveDriver, pickup_location: pickup.trim() || null } });
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#000" barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
                <View style={styles.gallery}>
                    {images.length ? (
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / width))}>
                            {images.map((uri, i) => <Image key={i} source={{ uri }} style={styles.gImg} resizeMode="cover" />)}
                        </ScrollView>
                    ) : <View style={[styles.gImg, styles.gPh]}><Icon name="car-key" size={60} color="#CBD0D6" /></View>}
                    <TouchableOpacity style={[styles.back, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}><Icon name="arrow-left" size={22} color="#FFF" /></TouchableOpacity>
                    <View style={styles.gBadges}>
                        {c.is_managed && <View style={styles.bManaged}><Icon name="shield-check" size={12} color="#07163B" /><Text style={styles.bManagedTxt}>EZRide Managed</Text></View>}
                        {c.is_inspected && <View style={styles.bInsp}><Icon name="clipboard-check" size={12} color="#FFF" /><Text style={styles.bInspTxt}>Inspected · {c.inspection?.grade}</Text></View>}
                    </View>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>{c.title}</Text>
                    <Text style={styles.price}>{money(rate)}<Text style={styles.perDay}> / day{effectiveDriver ? ' · with driver' : ' · self-drive'}</Text></Text>

                    {/* Driver mode toggle for "both" */}
                    {driverMode === 'both' && !c.is_mine && (
                        <View style={styles.toggle}>
                            {[{ k: true, l: 'With driver' }, { k: false, l: 'Self-drive' }].map(o => (
                                <TouchableOpacity key={String(o.k)} style={[styles.toggleBtn, withDriver === o.k && styles.toggleOn]} onPress={() => setWithDriver(o.k)}>
                                    <Text style={[styles.toggleTxt, withDriver === o.k && styles.toggleTxtOn]}>{o.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {!effectiveDriver && c.deposit != null && <Text style={styles.deposit}>Security deposit: {money(c.deposit)}</Text>}

                    <Text style={styles.section}>Details</Text>
                    <View style={styles.specGrid}>
                        {specs.map(([ic, v], i) => (
                            <View key={i} style={styles.specItem}><Icon name={ic} size={17} color="#07163B" /><Text style={styles.specVal}>{v}</Text></View>
                        ))}
                    </View>

                    {!!(c.features && c.features.length) && (
                        <>
                            <Text style={styles.section}>Features</Text>
                            <View style={styles.chips}>{c.features.map((f, i) => <View key={i} style={styles.fChip}><Text style={styles.fChipTxt}>{f}</Text></View>)}</View>
                        </>
                    )}
                    {!!c.description && (<><Text style={styles.section}>About</Text><Text style={styles.desc}>{c.description}</Text></>)}

                    {/* Booking dates */}
                    {!c.is_mine && !c.is_managed && (
                        <>
                            <Text style={styles.section}>Rental dates</Text>
                            <View style={styles.dateRow}>
                                <TouchableOpacity style={styles.dateBox} onPress={() => setPicker('start')}>
                                    <Text style={styles.dateLabel}>Pickup</Text>
                                    <Text style={start ? styles.dateVal : styles.datePh}>{start ? niceDate(start) : 'Select'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.dateBox} onPress={() => setPicker('end')}>
                                    <Text style={styles.dateLabel}>Return</Text>
                                    <Text style={end ? styles.dateVal : styles.datePh}>{end ? niceDate(end) : 'Select'}</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput style={styles.input} value={pickup} onChangeText={setPickup} placeholder="Pickup location (optional)" placeholderTextColor="#9AA0A6" />
                            {!!estimate && <Text style={styles.estimate}>Estimate: {money(estimate)} for {days} day{days > 1 ? 's' : ''}</Text>}
                        </>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
                {c.is_mine ? (
                    <View style={styles.mineNote}><Icon name="information-outline" size={16} color="#92600B" /><Text style={styles.mineTxt}>This is your own rental listing.</Text></View>
                ) : c.is_managed ? (
                    <TouchableOpacity style={styles.primary} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}>
                        <Icon name="shield-account" size={18} color="#07163B" /><Text style={styles.primaryTxt}>Contact EZRide</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity style={styles.outline} onPress={() => c.owner?.phone && Linking.openURL(`tel:${c.owner.phone}`)}>
                            <Icon name="phone" size={18} color="#07163B" /><Text style={styles.outlineTxt}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primary} onPress={submit} disabled={book.isPending}>
                            <Text style={styles.primaryTxt}>{book.isPending ? 'Sending…' : 'Request to Book'}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {picker && (
                <DateTimePicker
                    value={(picker === 'start' ? start : end) || new Date()}
                    mode="date"
                    minimumDate={picker === 'end' && start ? start : new Date()}
                    onChange={(e, d) => { setPicker(null); if (e.type !== 'dismissed' && d) { picker === 'start' ? setStart(d) : setEnd(d); } }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF' },
    muted: { fontSize: 13, fontFamily: Fonts.regular, color: '#AAA' },
    gallery: { height: 260, backgroundColor: '#000' },
    gImg: { width, height: 260 },
    gPh: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F1F3' },
    back: { position: 'absolute', left: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    gBadges: { position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', gap: 8 },
    bManaged: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFD400', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
    bManagedTxt: { fontSize: 10.5, fontFamily: Fonts.bold, color: '#07163B' },
    bInsp: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#109F2A', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
    bInspTxt: { fontSize: 10.5, fontFamily: Fonts.bold, color: '#FFF' },

    body: { padding: 18 },
    title: { fontSize: 20, fontFamily: Fonts.bold, color: '#07163B' },
    price: { fontSize: 20, fontFamily: Fonts.bold, color: '#07163B', marginTop: 4 },
    perDay: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#9AA0A6' },
    toggle: { flexDirection: 'row', gap: 8, marginTop: 12 },
    toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#EAEDEE' },
    toggleOn: { borderColor: '#07163B', backgroundColor: '#07163B' },
    toggleTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    toggleTxtOn: { color: '#FFFFFF' },
    deposit: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#92600B', marginTop: 8 },

    section: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 20, marginBottom: 12 },
    specGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    specItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    specVal: { fontSize: 13.5, fontFamily: Fonts.medium, color: '#202223' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fChip: { backgroundColor: '#F5F5F7', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
    fChipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B' },
    desc: { fontSize: 14, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 22 },

    dateRow: { flexDirection: 'row', gap: 12 },
    dateBox: { flex: 1, borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12, padding: 12 },
    dateLabel: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    dateVal: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginTop: 3 },
    datePh: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA', marginTop: 3 },
    input: { borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 14, color: '#202223', marginTop: 12 },
    estimate: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 12 },

    bar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EAEDEE' },
    outline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#D7DBDE' },
    outlineTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    primary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16 },
    primaryTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    mineNote: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FCE7A0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
    mineTxt: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#92600B' },
});

export default RentalDetailScreen;
