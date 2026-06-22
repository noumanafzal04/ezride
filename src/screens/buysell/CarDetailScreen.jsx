import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
    Image, ActivityIndicator, Dimensions, Linking, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { fileUrl } from '../../utils/media';
import chatService from '../../services/chatService';
import { useCarListing, useMarkListingSold, useDeleteListing } from '../../hooks/useMarketplace';

const { width } = Dimensions.get('window');
const SUPPORT_PHONE = '+923000000000'; // EZRide managed-sales line
const money = (n) => (n == null ? 'Price on request' : `Rs. ${Number(n).toLocaleString()}`);
const Cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

const SPEC_ICONS = {
    year: 'calendar', mileage: 'speedometer', transmission: 'car-shift-pattern',
    fuel_type: 'gas-station', engine_cc: 'engine', color: 'palette', condition: 'car-info', city: 'map-marker',
};

const CarDetailScreen = ({ navigation, route }) => {
    const { id } = route.params || {};
    const insets = useSafeAreaInsets();
    const { data: c, isLoading, isError } = useCarListing(id);
    const [active, setActive] = useState(0);

    const markSold = useMarkListingSold({ onSuccess: () => Alert.alert('Done', 'Marked as sold.') });
    const del = useDeleteListing({ onSuccess: () => navigation.goBack(), onError: (e) => Alert.alert('Failed', e.response?.data?.message || 'Try again.') });

    const call = (phone) => phone && Linking.openURL(`tel:${phone}`);

    const messageSeller = async () => {
        try {
            const res = await chatService.byListing(c.id);
            const conv = res.data?.data;
            if (conv?.id) navigation.navigate('ChatDetail', { conversationId: conv.id, conversation: conv });
        } catch (e) {
            Alert.alert('Could not open chat', e.response?.data?.message || 'Try again.');
        }
    };

    if (isLoading) return <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>;
    if (isError || !c) return <View style={styles.center}><Icon name="alert-circle-outline" size={40} color="#DDD" /><Text style={styles.muted}>Could not load this car.</Text></View>;

    const images = (c.images || []).map(i => fileUrl(i.path)).filter(Boolean);
    const specs = [
        ['year', c.year], ['mileage', c.mileage ? `${Number(c.mileage).toLocaleString()} km` : null],
        ['transmission', Cap(c.transmission)], ['fuel_type', Cap(c.fuel_type)],
        ['engine_cc', c.engine_cc ? `${c.engine_cc} cc` : null], ['color', c.color],
        ['condition', Cap(c.condition)], ['city', c.city?.name],
    ].filter(([, v]) => v != null && v !== '—');

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#000000" barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Gallery */}
                <View style={styles.gallery}>
                    {images.length ? (
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / width))}>
                            {images.map((uri, i) => <Image key={i} source={{ uri }} style={styles.galleryImg} resizeMode="cover" />)}
                        </ScrollView>
                    ) : <View style={[styles.galleryImg, styles.galleryPh]}><Icon name="car" size={60} color="#CBD0D6" /></View>}

                    {images.length > 1 && (
                        <View style={styles.dots}>
                            {images.map((_, i) => <View key={i} style={[styles.dot, i === active && styles.dotOn]} />)}
                        </View>
                    )}
                    <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.galleryBadges}>
                        {c.is_managed && <View style={styles.bManaged}><Icon name="shield-check" size={12} color="#07163B" /><Text style={styles.bManagedTxt}>EZRide Managed</Text></View>}
                        {c.is_inspected && <View style={styles.bInspected}><Icon name="clipboard-check" size={12} color="#FFF" /><Text style={styles.bInspectedTxt}>Inspected · Grade {c.inspection?.grade}</Text></View>}
                    </View>
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>{c.title}</Text>
                    <Text style={styles.price}>{money(c.price)}</Text>
                    {!!c.area && <Text style={styles.sub}><Icon name="map-marker-outline" size={13} color="#9AA0A6" /> {[c.area, c.city?.name].filter(Boolean).join(', ')}</Text>}

                    {/* Inspected card */}
                    {c.is_inspected && (
                        <View style={styles.inspectCard}>
                            <Icon name="shield-check" size={22} color="#109F2A" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inspectTitle}>EZRide Inspected</Text>
                                <Text style={styles.inspectSub}>Overall grade {c.inspection?.grade}{c.inspection?.score ? ` · ${c.inspection.score}/100` : ''}</Text>
                            </View>
                        </View>
                    )}

                    {/* Specs */}
                    <Text style={styles.section}>Details</Text>
                    <View style={styles.specGrid}>
                        {specs.map(([k, v]) => (
                            <View key={k} style={styles.specItem}>
                                <Icon name={SPEC_ICONS[k] || 'information-outline'} size={17} color="#07163B" />
                                <View>
                                    <Text style={styles.specVal}>{v}</Text>
                                    <Text style={styles.specKey}>{Cap(k.replace('_', ' '))}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Features */}
                    {!!(c.features && c.features.length) && (
                        <>
                            <Text style={styles.section}>Features</Text>
                            <View style={styles.chips}>
                                {c.features.map((f, i) => <View key={i} style={styles.chip}><Text style={styles.chipTxt}>{f}</Text></View>)}
                            </View>
                        </>
                    )}

                    {/* Description */}
                    {!!c.description && (
                        <>
                            <Text style={styles.section}>Description</Text>
                            <Text style={styles.desc}>{c.description}</Text>
                        </>
                    )}

                    {/* Seller (self listings only) */}
                    {!c.is_managed && !c.is_mine && !!c.seller && (
                        <>
                            <Text style={styles.section}>Seller</Text>
                            <View style={styles.sellerRow}>
                                <View style={styles.sellerAvatar}><Text style={styles.sellerInit}>{(c.seller.name?.[0] || 'S').toUpperCase()}</Text></View>
                                <Text style={styles.sellerName}>{c.seller.name}</Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Bottom action bar */}
            <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
                {c.is_mine ? (
                    c.status === 'sold' ? (
                        <View style={styles.soldNote}><Icon name="check-circle" size={18} color="#109F2A" /><Text style={styles.soldTxt}>Sold</Text></View>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.outlineBtn} onPress={() => del.mutate(c.id)}>
                                <Icon name="trash-can-outline" size={18} color="#D83F54" /><Text style={[styles.outlineTxt, { color: '#D83F54' }]}>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => markSold.mutate(c.id)}>
                                <Text style={styles.primaryTxt}>Mark as Sold</Text>
                            </TouchableOpacity>
                        </>
                    )
                ) : c.is_managed ? (
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => call(SUPPORT_PHONE)}>
                        <Icon name="shield-account" size={18} color="#07163B" /><Text style={styles.primaryTxt}>Contact EZRide</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity style={styles.outlineBtn} onPress={() => call(c.seller?.phone)}>
                            <Icon name="phone" size={18} color="#07163B" /><Text style={styles.outlineTxt}>Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryBtn} onPress={messageSeller}>
                            <Icon name="message-text-outline" size={18} color="#07163B" /><Text style={styles.primaryTxt}>Message Seller</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF' },
    muted: { fontSize: 13, fontFamily: Fonts.regular, color: '#AAAAAA' },

    gallery: { height: 280, backgroundColor: '#000000' },
    galleryImg: { width, height: 280 },
    galleryPh: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F1F3' },
    dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 5 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotOn: { width: 18, backgroundColor: '#FFD400' },
    backBtn: { position: 'absolute', left: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
    galleryBadges: { position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', gap: 8 },
    bManaged: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFD400', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
    bManagedTxt: { fontSize: 10.5, fontFamily: Fonts.bold, color: '#07163B' },
    bInspected: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#109F2A', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
    bInspectedTxt: { fontSize: 10.5, fontFamily: Fonts.bold, color: '#FFFFFF' },

    body: { padding: 18 },
    title: { fontSize: 20, fontFamily: Fonts.bold, color: '#07163B' },
    price: { fontSize: 22, fontFamily: Fonts.bold, color: '#07163B', marginTop: 4 },
    sub: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 4 },

    inspectCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#E8F8EE', borderRadius: 14, padding: 14, marginTop: 16 },
    inspectTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#0B6B22' },
    inspectSub: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#3B7A4C', marginTop: 1 },

    section: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 22, marginBottom: 12 },
    specGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    specItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    specVal: { fontSize: 13.5, fontFamily: Fonts.semiBold, color: '#202223' },
    specKey: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: '#F5F5F7', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
    chipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B' },
    desc: { fontSize: 14, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 22 },

    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    sellerInit: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B' },
    sellerName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },

    bar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EAEDEE' },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#D7DBDE' },
    outlineTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16 },
    primaryTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    soldNote: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8F8EE', borderRadius: 12, paddingVertical: 16 },
    soldTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#109F2A' },
});

export default CarDetailScreen;
