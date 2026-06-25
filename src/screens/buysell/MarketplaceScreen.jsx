import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
    Image, ActivityIndicator, TextInput, Modal, ScrollView, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import Toast from 'react-native-toast-message';
import { fileUrl } from '../../utils/media';
import { formatMoney } from '../../utils/money';
import { CarGridSkeleton, RowListSkeleton } from '../../components/Skeletons';
import { useCurrentLocation } from '../../hooks/useLocation';
import { useCities } from '../../hooks/useLookup';
import SelectSheet from '../../components/SelectSheet';
import {
    useCarListings, useMyListings, useMarkListingSold, useDeleteListing,
} from '../../hooks/useMarketplace';

const money = (n) => formatMoney(n);
const TRANSMISSIONS = ['automatic', 'manual'];
const FUELS = ['petrol', 'diesel', 'hybrid', 'electric', 'cng'];
const SORTS = [
    { key: '', label: 'Nearby' },
    { key: 'newest', label: 'Newest' },
    { key: 'price_asc', label: 'Price ↑' },
    { key: 'price_desc', label: 'Price ↓' },
];
const STATUS_META = {
    active: { label: 'Active', color: '#109F2A', bg: '#E8F8EE' },
    pending: { label: 'In review', color: '#D97706', bg: '#FFF7ED' },
    sold: { label: 'Sold', color: '#5D5F62', bg: '#F1F2F4' },
    rejected: { label: 'Rejected', color: '#D83F54', bg: '#FFF0F2' },
    draft: { label: 'Draft', color: '#5D5F62', bg: '#F1F2F4' },
    inactive: { label: 'Inactive', color: '#5D5F62', bg: '#F1F2F4' },
};

const Cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const ListingCard = ({ item, onPress }) => {
    const img = fileUrl(item.primary_image);
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
            <View style={styles.cardImgWrap}>
                {img ? <Image source={{ uri: img }} style={styles.cardImg} resizeMode="cover" />
                    : <View style={styles.cardImgPh}><Icon name="car" size={34} color="#CBD0D6" /></View>}
                {item.is_managed && (
                    <View style={styles.badgeManaged}><Icon name="shield-check" size={11} color="#07163B" /><Text style={styles.badgeManagedTxt}>EZRide</Text></View>
                )}
                {item.is_inspected && (
                    <View style={styles.badgeInspected}><Icon name="clipboard-check" size={11} color="#FFFFFF" /><Text style={styles.badgeInspectedTxt}>Grade {item.inspection?.grade}</Text></View>
                )}
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardPrice}>{money(item.price)}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                    {[item.year, item.mileage ? `${Number(item.mileage).toLocaleString()} km` : null, item.city?.name].filter(Boolean).join(' · ')}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const MarketplaceScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [tab, setTab] = useState('buy');
    const [q, setQ] = useState('');
    const [filters, setFilters] = useState({});
    const [draft, setDraft] = useState({});
    const [sheet, setSheet] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const { city } = useCurrentLocation();

    const appliedQ = { ...filters, ...(q.trim() ? { q: q.trim() } : {}) };
    const buy = useCarListings(appliedQ);
    const mine = useMyListings();
    const listings = (buy.data?.pages || []).flatMap(p => p.listings || []);
    const myListings = (mine.data?.pages || []).flatMap(p => p.listings || []);

    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase()));

    const markSold = useMarkListingSold();
    const del = useDeleteListing({ onError: (e) => Toast.show({ type: 'error', text1: 'Could not delete', text2: e.response?.data?.message || 'Try again.' }) });

    const openFilters = () => { setDraft(filters); setSheet(true); };
    const applyFilters = () => { setFilters(draft); setSheet(false); };
    const clearFilters = () => { setDraft({}); setFilters({}); setSheet(false); };
    const activeFilterCount = Object.keys(filters).filter(k => !k.startsWith('_') && filters[k] !== undefined && filters[k] !== '' && filters[k] !== null).length;

    const setD = (k, v) => setDraft(p => ({ ...p, [k]: p[k] === v ? undefined : v }));

    const confirmSold = (l) => Alert.alert('Mark as sold?', `${l.title} will be hidden from buyers.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark sold', onPress: () => markSold.mutate(l.id) },
    ]);
    const confirmDelete = (l) => Alert.alert('Delete listing?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => del.mutate(l.id) },
    ]);

    const renderMine = ({ item }) => {
        const st = STATUS_META[item.status] || STATUS_META.active;
        const img = fileUrl(item.primary_image);
        return (
            <View style={styles.mineCard}>
                <TouchableOpacity style={styles.mineMain} activeOpacity={0.85} onPress={() => navigation.navigate('CarDetail', { id: item.id })}>
                    {img ? <Image source={{ uri: img }} style={styles.mineImg} /> : <View style={[styles.mineImg, styles.cardImgPh]}><Icon name="car" size={22} color="#CBD0D6" /></View>}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.mineTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.minePrice}>{money(item.price)}</Text>
                        <View style={styles.mineBadges}>
                            <View style={[styles.statusPill, { backgroundColor: st.bg }]}><Text style={[styles.statusTxt, { color: st.color }]}>{st.label}</Text></View>
                            {item.is_managed && <Text style={styles.mineTag}>EZRide managed</Text>}
                        </View>
                    </View>
                </TouchableOpacity>
                {item.status !== 'sold' && (
                    <View style={styles.mineActions}>
                        <TouchableOpacity style={styles.mineActBtn} onPress={() => confirmSold(item)}>
                            <Icon name="check-circle-outline" size={18} color="#109F2A" /><Text style={styles.mineActTxt}>Sold</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mineActBtn} onPress={() => confirmDelete(item)}>
                            <Icon name="trash-can-outline" size={18} color="#D83F54" /><Text style={[styles.mineActTxt, { color: '#D83F54' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hSide}><Icon name="arrow-left" size={24} color="#07163B" /></TouchableOpacity>
                ) : <View style={styles.hSide} />}
                <Text style={styles.headerTitle}>Marketplace</Text>
                <View style={styles.hSide} />
            </View>

            <View style={styles.tabs}>
                {['buy', 'mine'].map(t => (
                    <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                        <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>{t === 'buy' ? 'Buy Cars' : 'My Listings'}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {tab === 'buy' ? (
                <>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Icon name="magnify" size={19} color="#9AA0A6" />
                            <TextInput value={q} onChangeText={setQ} placeholder="Search make or model…" placeholderTextColor="#9AA0A6"
                                style={styles.searchInput} autoCapitalize="none" returnKeyType="search" />
                            {!!q && <TouchableOpacity onPress={() => setQ('')}><Icon name="close-circle" size={17} color="#C4C9CF" /></TouchableOpacity>}
                        </View>
                        <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
                            <Icon name="tune-variant" size={20} color="#07163B" />
                            {activeFilterCount > 0 && <View style={styles.filterDot}><Text style={styles.filterDotTxt}>{activeFilterCount}</Text></View>}
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={listings}
                        keyExtractor={i => String(i.id)}
                        numColumns={2}
                        columnWrapperStyle={listings.length ? styles.grid : undefined}
                        contentContainerStyle={styles.listPadFab}
                        renderItem={({ item }) => <ListingCard item={item} onPress={() => navigation.navigate('CarDetail', { id: item.id })} />}
                        ListHeaderComponent={!filters.city_id && city?.name ? (
                            <View style={styles.locPill}><Icon name="map-marker" size={13} color="#07163B" /><Text style={styles.locTxt}>Showing near {city.name}</Text></View>
                        ) : null}
                        showsVerticalScrollIndicator={false}
                        refreshing={buy.isRefetching}
                        onRefresh={buy.refetch}
                        onEndReachedThreshold={0.5}
                        onEndReached={() => { if (buy.hasNextPage && !buy.isFetchingNextPage) buy.fetchNextPage(); }}
                        ListFooterComponent={buy.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={{ marginVertical: 20 }} /> : null}
                        ListEmptyComponent={buy.isLoading ? <CarGridSkeleton /> : (
                            <View style={styles.empty}><Icon name="car-off" size={44} color="#DDDDDD" /><Text style={styles.emptyTitle}>No cars found</Text><Text style={styles.emptySub}>Try clearing filters.</Text></View>
                        )}
                    />
                </>
            ) : (
                <FlatList
                    data={myListings}
                    keyExtractor={i => String(i.id)}
                    contentContainerStyle={[styles.listPad, { paddingBottom: insets.bottom + 24 }]}
                    renderItem={renderMine}
                    ListHeaderComponent={
                        <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('SellCar')} activeOpacity={0.9}>
                            <Icon name="plus-circle" size={20} color="#07163B" /><Text style={styles.postBtnTxt}>Post a car for sale</Text>
                        </TouchableOpacity>
                    }
                    showsVerticalScrollIndicator={false}
                    refreshing={mine.isRefetching}
                    onRefresh={mine.refetch}
                    onEndReachedThreshold={0.5}
                    onEndReached={() => { if (mine.hasNextPage && !mine.isFetchingNextPage) mine.fetchNextPage(); }}
                    ListEmptyComponent={mine.isLoading ? <RowListSkeleton /> : (
                        <View style={styles.empty}><Icon name="tag-outline" size={44} color="#DDDDDD" /><Text style={styles.emptyTitle}>No listings yet</Text><Text style={styles.emptySub}>Post your first car above.</Text></View>
                    )}
                />
            )}

            {/* Floating "Sell a Car" button (absolute, above the bottom) */}
            {tab === 'buy' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: insets.bottom + 18 }]}
                    onPress={() => navigation.navigate('SellCar')}
                    activeOpacity={0.9}
                >
                    <Icon name="plus" size={20} color="#07163B" />
                    <Text style={styles.fabText}>Sell a Car</Text>
                </TouchableOpacity>
            )}

            <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheet(false)} />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Filters</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.fLabel}>City</Text>
                        <TouchableOpacity style={styles.fSelect} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                            <Text style={draft.city_id ? styles.fSelectVal : styles.fSelectPh}>{draft._cityName || 'Any city'}</Text>
                            <Icon name="chevron-down" size={18} color="#9E9E9E" />
                        </TouchableOpacity>

                        <Text style={styles.fLabel}>Price (Rs.)</Text>
                        <View style={styles.fRow}>
                            <TextInput style={styles.fInput} placeholder="Min" placeholderTextColor="#AAA" keyboardType="numeric"
                                value={draft.price_min ? String(draft.price_min) : ''} onChangeText={v => setDraft(p => ({ ...p, price_min: v.replace(/[^0-9]/g, '') || undefined }))} />
                            <TextInput style={styles.fInput} placeholder="Max" placeholderTextColor="#AAA" keyboardType="numeric"
                                value={draft.price_max ? String(draft.price_max) : ''} onChangeText={v => setDraft(p => ({ ...p, price_max: v.replace(/[^0-9]/g, '') || undefined }))} />
                        </View>

                        <Text style={styles.fLabel}>Year</Text>
                        <View style={styles.fRow}>
                            <TextInput style={styles.fInput} placeholder="From" placeholderTextColor="#AAA" keyboardType="numeric"
                                value={draft.year_min ? String(draft.year_min) : ''} onChangeText={v => setDraft(p => ({ ...p, year_min: v.replace(/[^0-9]/g, '') || undefined }))} />
                            <TextInput style={styles.fInput} placeholder="To" placeholderTextColor="#AAA" keyboardType="numeric"
                                value={draft.year_max ? String(draft.year_max) : ''} onChangeText={v => setDraft(p => ({ ...p, year_max: v.replace(/[^0-9]/g, '') || undefined }))} />
                        </View>

                        <Text style={styles.fLabel}>Transmission</Text>
                        <View style={styles.chipsRow}>
                            {TRANSMISSIONS.map(t => (
                                <TouchableOpacity key={t} style={[styles.chip, draft.transmission === t && styles.chipOn]} onPress={() => setD('transmission', t)}>
                                    <Text style={[styles.chipTxt, draft.transmission === t && styles.chipTxtOn]}>{Cap(t)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fLabel}>Fuel</Text>
                        <View style={styles.chipsRow}>
                            {FUELS.map(f => (
                                <TouchableOpacity key={f} style={[styles.chip, draft.fuel_type === f && styles.chipOn]} onPress={() => setD('fuel_type', f)}>
                                    <Text style={[styles.chipTxt, draft.fuel_type === f && styles.chipTxtOn]}>{Cap(f)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fLabel}>Sort</Text>
                        <View style={styles.chipsRow}>
                            {SORTS.map(s => (
                                <TouchableOpacity key={s.key} style={[styles.chip, (draft.sort || '') === s.key && styles.chipOn]} onPress={() => setDraft(p => ({ ...p, sort: s.key || undefined }))}>
                                    <Text style={[styles.chipTxt, (draft.sort || '') === s.key && styles.chipTxtOn]}>{s.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    <View style={styles.sheetActions}>
                        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}><Text style={styles.clearTxt}>Clear all</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}><Text style={styles.applyTxt}>Show results</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <SelectSheet
                visible={cityOpen}
                onClose={() => setCityOpen(false)}
                title="Filter by City"
                items={filteredCities}
                loading={citiesQuery.isLoading}
                searchable search={citySearch} onSearch={setCitySearch}
                selectedId={draft.city_id}
                onSelect={(c) => { setDraft(p => ({ ...p, city_id: c.id, _cityName: c.name })); setCityOpen(false); }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    hSide: { minWidth: 60, justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    tab: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: '#FFD400' },
    tabTxt: { fontSize: 14, fontFamily: Fonts.medium, color: '#9AA0A6' },
    tabTxtActive: { color: '#07163B', fontFamily: Fonts.semiBold },

    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223', padding: 0 },
    filterBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#EAEDEE', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    filterDot: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    filterDotTxt: { fontSize: 9, fontFamily: Fonts.bold, color: '#07163B' },

    locPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, marginLeft: 4 },
    locTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },

    listPad: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
    listPadFab: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
    grid: { gap: 12 },

    fab: {
        position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFD400', borderRadius: 30, paddingHorizontal: 24, paddingVertical: 15,
        elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10,
    },
    fabText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },

    card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden', marginBottom: 12 },
    cardImgWrap: { height: 110, backgroundColor: '#F0F1F3' },
    cardImg: { width: '100%', height: '100%' },
    cardImgPh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    badgeManaged: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFD400', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    badgeManagedTxt: { fontSize: 9, fontFamily: Fonts.bold, color: '#07163B' },
    badgeInspected: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#109F2A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    badgeInspectedTxt: { fontSize: 9, fontFamily: Fonts.bold, color: '#FFFFFF' },
    cardBody: { padding: 10, gap: 2 },
    cardTitle: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223' },
    cardPrice: { fontSize: 14, fontFamily: Fonts.bold, color: '#07163B' },
    cardMeta: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },

    postBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 14, marginBottom: 14 },
    postBtnTxt: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
    mineCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', marginBottom: 12, overflow: 'hidden' },
    mineMain: { flexDirection: 'row', gap: 12, padding: 12 },
    mineImg: { width: 80, height: 64, borderRadius: 10, backgroundColor: '#F0F1F3' },
    mineTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    minePrice: { fontSize: 14, fontFamily: Fonts.bold, color: '#07163B', marginTop: 2 },
    mineBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    statusPill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
    statusTxt: { fontSize: 10.5, fontFamily: Fonts.semiBold },
    mineTag: { fontSize: 10.5, fontFamily: Fonts.medium, color: '#92600B' },
    mineActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    mineActBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
    mineActTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#109F2A' },

    empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },

    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, maxHeight: '85%' },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 14 },
    sheetTitle: { fontSize: 18, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 12 },
    fLabel: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginTop: 14, marginBottom: 8 },
    fSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
    fSelectVal: { fontSize: 14, fontFamily: Fonts.medium, color: '#202223' },
    fSelectPh: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },
    fRow: { flexDirection: 'row', gap: 10 },
    fInput: { flex: 1, borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontFamily: Fonts.regular, fontSize: 14, color: '#202223' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    chipOn: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTxtOn: { color: '#FFFFFF' },
    sheetActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
    clearBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#EAEDEE', alignItems: 'center', justifyContent: 'center' },
    clearTxt: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    applyBtn: { flex: 1, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    applyTxt: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
});

export default MarketplaceScreen;
