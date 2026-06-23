import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../constants/fonts';
import { useServiceCategories } from '../hooks/useServices';
import { useCurrentLocation } from '../hooks/useLocation';

// Every module the user can reach from one place. `keywords` widen search hits.
const MODULES = [
    {
        key: 'ride',
        icon: 'car-multiple',
        title: 'Find a Ride',
        desc: 'Book a seat city-to-city',
        tint: '#EEF4FF', ic: '#1D6AFF',
        route: 'AvailableRides',
        keywords: 'ride travel carpool seat trip lift commute',
    },
    {
        key: 'services',
        icon: 'wrench',
        title: 'Find Services',
        desc: 'Mechanic, wash, tyres & more',
        tint: '#EDFFF4', ic: '#16A34A',
        route: 'Services',
        keywords: 'service mechanic wash tyre battery repair detailing fuel',
    },
    {
        key: 'inspect',
        icon: 'clipboard-check-outline',
        title: 'Book Inspection',
        desc: '120-point certified report',
        tint: '#F3EEFF', ic: '#7C3AED',
        route: 'InspectionRequest',
        keywords: 'inspection check report certified buy verify',
    },
    {
        key: 'buysell',
        icon: 'tag-outline',
        title: 'Buy / Sell Cars',
        desc: 'Browse & list cars for sale',
        tint: '#FFF7ED', ic: '#EA580C',
        route: 'Marketplace',
        keywords: 'buy sell car marketplace listing used new',
    },
    {
        key: 'rent',
        icon: 'car-key',
        title: 'Rent a Car',
        desc: 'Self-drive & with driver',
        tint: '#FFF1F2', ic: '#E11D48',
        route: 'Rentals',
        keywords: 'rent rental hire self drive lease',
    },
];

const DiscoverScreen = ({ navigation }) => {
    const [q, setQ] = useState('');
    const { data: categories = [] } = useServiceCategories();
    const { city } = useCurrentLocation();

    const modules = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return MODULES;
        return MODULES.filter(m =>
            `${m.title} ${m.desc} ${m.keywords}`.toLowerCase().includes(t)
        );
    }, [q]);

    const open = (m) => {
        if (m.soon || !m.route) {
            Toast.show({ type: 'info', text1: 'Coming soon', text2: `${m.title} is on the way.` });
            return;
        }
        navigation.navigate(m.route);
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                ) : <View style={styles.headerSide} />}
                <Text style={styles.headerTitle}>Discover</Text>
                <View style={styles.headerSide} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.locPill}>
                    <Icon name="map-marker" size={14} color="#07163B" />
                    <Text style={styles.locText} numberOfLines={1}>
                        {city?.name || 'Locating you…'}
                    </Text>
                    {!!city?.name && <Text style={styles.locHint}>· nearby first</Text>}
                </View>
                <Text style={styles.lead}>What do you need today?</Text>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={20} color="#9AA0A6" />
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Search rides, services, inspection…"
                        placeholderTextColor="#9AA0A6"
                        style={styles.searchInput}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {!!q && (
                        <TouchableOpacity onPress={() => setQ('')}>
                            <Icon name="close-circle" size={18} color="#C4C9CF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Popular service categories */}
                {!q && categories.length > 0 && (
                    <View style={styles.chipsSection}>
                        <Text style={styles.chipsTitle}>Popular services</Text>
                        <FlatList
                            data={categories.slice(0, 10)}
                            keyExtractor={c => String(c.id)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipsRow}
                            renderItem={({ item: c }) => (
                                <TouchableOpacity
                                    style={styles.chip}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('ServiceProviders', { category: c })}
                                >
                                    <Icon name={c.icon || 'wrench'} size={15} color="#07163B" />
                                    <Text style={styles.chipText} numberOfLines={1}>{c.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Module cards */}
                <View style={styles.cards}>
                    {modules.map(m => (
                        <TouchableOpacity key={m.key} style={styles.card} activeOpacity={0.85} onPress={() => open(m)}>
                            <View style={[styles.cardIcon, { backgroundColor: m.tint }]}>
                                <Icon name={m.icon} size={24} color={m.ic} />
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.cardTitleRow}>
                                    <Text style={styles.cardTitle}>{m.title}</Text>
                                    {m.soon && <View style={styles.soonPill}><Text style={styles.soonText}>Soon</Text></View>}
                                </View>
                                <Text style={styles.cardDesc}>{m.desc}</Text>
                            </View>
                            <Icon name="chevron-right" size={22} color="#C7CBD1" />
                        </TouchableOpacity>
                    ))}

                    {modules.length === 0 && (
                        <View style={styles.empty}>
                            <Icon name="magnify-close" size={42} color="#DDDDDD" />
                            <Text style={styles.emptyText}>Nothing matches “{q}”.</Text>
                        </View>
                    )}
                </View>
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

    scroll: { padding: 16, paddingBottom: 40 },
    locPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
    locText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B', maxWidth: 200 },
    locHint: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    lead: { fontSize: 22, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 14 },

    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223', padding: 0 },

    chipsSection: { marginTop: 18 },
    chipsTitle: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62', marginBottom: 10 },
    chipsRow: { gap: 8, paddingRight: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    },
    chipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#202223', maxWidth: 120 },

    cards: { marginTop: 22, gap: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        padding: 16,
    },
    cardIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1, gap: 3 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 15.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    cardDesc: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#9AA0A6' },
    soonPill: { backgroundColor: '#FFF4C2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    soonText: { fontSize: 10, fontFamily: Fonts.semiBold, color: '#92600B' },

    empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
    emptyText: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },
});

export default DiscoverScreen;
