import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../constants/fonts';
import { useServiceCategories } from '../hooks/useServices';
import { useCurrentLocation } from '../hooks/useLocation';
import { useBottomInset } from '../hooks/useBottomInset';

// Every module the user can reach from one place. `keywords` widen search hits.
const MODULES = [
    { key: 'ride', icon: 'car-multiple', title: 'Find a Ride', desc: 'Book a seat city-to-city', tint: '#EEF4FF', ic: '#1D6AFF', route: 'AvailableRides', keywords: 'ride travel carpool seat trip lift commute' },
    { key: 'rent', icon: 'car-key', title: 'Rent a Car', desc: 'Self-drive & with driver', tint: '#FFF1F2', ic: '#E11D48', route: 'Rentals', keywords: 'rent rental hire self drive lease' },
    { key: 'services', icon: 'wrench', title: 'Car Services', desc: 'Mechanic, wash, tyres & more', tint: '#EDFFF4', ic: '#16A34A', route: 'Services', keywords: 'service mechanic wash tyre battery repair detailing fuel' },
    { key: 'inspect', icon: 'clipboard-check-outline', title: 'Inspection', desc: '120-point certified report', tint: '#F3EEFF', ic: '#7C3AED', route: 'InspectionRequest', keywords: 'inspection check report certified buy verify' },
    { key: 'buysell', icon: 'tag-outline', title: 'Buy / Sell', desc: 'Browse & list cars for sale', tint: '#FFF7ED', ic: '#EA580C', route: 'Marketplace', keywords: 'buy sell car marketplace listing used new' },
];

const SUGGESTIONS = ['Mechanic', 'Car wash', 'Rent SUV', 'Inspection', 'Find a ride'];

const DiscoverScreen = ({ navigation }) => {
    const [q, setQ] = useState('');
    const { data: categories = [] } = useServiceCategories();
    const { city } = useCurrentLocation();
    const pb = useBottomInset();
    const term = q.trim().toLowerCase();

    const open = (m) => {
        if (m.soon || !m.route) {
            Toast.show({ type: 'info', text1: 'Coming soon', text2: `${m.title} is on the way.` });
            return;
        }
        navigation.navigate(m.route);
    };

    // Live results combine modules + service categories.
    const moduleHits = useMemo(() =>
        !term ? [] : MODULES.filter(m => `${m.title} ${m.desc} ${m.keywords}`.toLowerCase().includes(term)),
        [term]);
    const categoryHits = useMemo(() =>
        !term ? [] : categories.filter(c => c.name.toLowerCase().includes(term)).slice(0, 8),
        [term, categories]);
    const noResults = term && moduleHits.length === 0 && categoryHits.length === 0;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                ) : <View style={styles.headerSide} />}
                <Text style={styles.headerTitle}>Search</Text>
                <View style={styles.headerSide} />
            </View>

            {/* Search bar — pinned so it's always obvious */}
            <View style={styles.searchWrap}>
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={20} color="#9AA0A6" />
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Try “mechanic”, “rent SUV”, “ride”…"
                        placeholderTextColor="#9AA0A6"
                        style={styles.searchInput}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {!!q && (
                        <TouchableOpacity onPress={() => setQ('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Icon name="close-circle" size={18} color="#C4C9CF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: pb }]} keyboardShouldPersistTaps="handled">
                {term ? (
                    /* ── Search results ── */
                    <>
                        {moduleHits.length > 0 && (
                            <>
                                <Text style={styles.resultLabel}>Services & tools</Text>
                                {moduleHits.map(m => (
                                    <TouchableOpacity key={m.key} style={styles.resultRow} activeOpacity={0.8} onPress={() => open(m)}>
                                        <View style={[styles.resultIcon, { backgroundColor: m.tint }]}><Icon name={m.icon} size={20} color={m.ic} /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.resultTitle}>{m.title}</Text>
                                            <Text style={styles.resultDesc}>{m.desc}</Text>
                                        </View>
                                        <Icon name="chevron-right" size={20} color="#C7CBD1" />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {categoryHits.length > 0 && (
                            <>
                                <Text style={styles.resultLabel}>Service categories</Text>
                                {categoryHits.map(c => (
                                    <TouchableOpacity key={c.id} style={styles.resultRow} activeOpacity={0.8} onPress={() => navigation.navigate('ServiceProviders', { category: c })}>
                                        <View style={[styles.resultIcon, { backgroundColor: '#EDFFF4' }]}><Icon name={c.icon || 'wrench'} size={19} color="#16A34A" /></View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.resultTitle}>{c.name}</Text>
                                            <Text style={styles.resultDesc}>{(c.providers_count ?? 0)} provider{(c.providers_count ?? 0) === 1 ? '' : 's'}</Text>
                                        </View>
                                        <Icon name="chevron-right" size={20} color="#C7CBD1" />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {noResults && (
                            <View style={styles.empty}>
                                <Icon name="magnify-close" size={44} color="#DDDDDD" />
                                <Text style={styles.emptyTitle}>No matches for “{q}”</Text>
                                <Text style={styles.emptySub}>Try a service name, a car type, or “ride”.</Text>
                            </View>
                        )}
                    </>
                ) : (
                    /* ── Default browse ── */
                    <>
                        <View style={styles.locPill}>
                            <Icon name="map-marker" size={14} color="#07163B" />
                            <Text style={styles.locText} numberOfLines={1}>{city?.name || 'Locating you…'}</Text>
                            {!!city?.name && <Text style={styles.locHint}>· nearby first</Text>}
                        </View>

                        {/* Suggestion pills — make search feel approachable */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggRow}>
                            {SUGGESTIONS.map(s => (
                                <TouchableOpacity key={s} style={styles.suggChip} onPress={() => setQ(s)} activeOpacity={0.8}>
                                    <Icon name="magnify" size={13} color="#5D5F62" />
                                    <Text style={styles.suggTxt}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.sectionTitle}>What do you need?</Text>
                        <View style={styles.grid}>
                            {MODULES.map(m => (
                                <TouchableOpacity key={m.key} style={styles.tile} activeOpacity={0.85} onPress={() => open(m)}>
                                    <View style={[styles.tileIcon, { backgroundColor: m.tint }]}>
                                        <Icon name={m.icon} size={24} color={m.ic} />
                                    </View>
                                    <Text style={styles.tileTitle}>{m.title}</Text>
                                    <Text style={styles.tileDesc} numberOfLines={2}>{m.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {categories.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Popular services</Text>
                                <View style={styles.chipsWrap}>
                                    {categories.slice(0, 10).map(c => (
                                        <TouchableOpacity key={c.id} style={styles.chip} activeOpacity={0.8} onPress={() => navigation.navigate('ServiceProviders', { category: c })}>
                                            <Icon name={c.icon || 'wrench'} size={15} color="#07163B" />
                                            <Text style={styles.chipText} numberOfLines={1}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14,
        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerSide: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    searchWrap: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F5F6F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    },
    searchInput: { flex: 1, fontSize: 14.5, fontFamily: Fonts.regular, color: '#202223', padding: 0 },

    scroll: { padding: 16, paddingBottom: 40 },

    locPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
    locText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B', maxWidth: 200 },
    locHint: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },

    suggRow: { gap: 8, paddingRight: 8, paddingBottom: 4 },
    suggChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
    suggTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },

    sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 22, marginBottom: 12 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: {
        width: '47.7%', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        padding: 14, gap: 6,
    },
    tileIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    tileTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    tileDesc: { fontSize: 11.5, fontFamily: Fonts.regular, color: '#9AA0A6', lineHeight: 16 },

    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
    chipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#202223', maxWidth: 130 },

    resultLabel: { fontSize: 12, fontFamily: Fonts.semiBold, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 8, marginBottom: 8 },
    resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 12, marginBottom: 10 },
    resultIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    resultTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    resultDesc: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 1 },

    empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default DiscoverScreen;
