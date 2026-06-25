import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useServiceCategories, useServiceProviders } from '../../hooks/useServices';
import { useCities } from '../../hooks/useLookup';
import SelectSheet from '../../components/SelectSheet';
import { RowListSkeleton } from '../../components/Skeletons';
import TopTabs from '../../components/TopTabs';
import MyServiceRequestsScreen from './MyServiceRequestsScreen';
import { useBottomInset } from '../../hooks/useBottomInset';

// Provider list row.
const ProviderCard = ({ item, onPress }) => {
    const rating = item.rating_avg != null ? Number(item.rating_avg).toFixed(1) : null;
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{(item.business_name?.[0] || '?').toUpperCase()}</Text>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                    <Text style={styles.bizName} numberOfLines={1}>{item.business_name}</Text>
                    {item.is_mine && <View style={styles.mineTag}><Text style={styles.mineTagText}>You</Text></View>}
                </View>
                <View style={styles.metaRow}>
                    {!!item.city?.name && (<><Icon name="map-marker-outline" size={12} color="#9AA0A6" /><Text style={styles.meta}>{item.city.name}{item.area ? `, ${item.area}` : ''}</Text></>)}
                    {rating
                        ? (<><Icon name="star" size={12} color="#FFC107" /><Text style={styles.meta}>{rating}</Text></>)
                        : <Text style={styles.meta}>New</Text>}
                    <Text style={styles.meta}>· {item.total_jobs || 0} jobs</Text>
                </View>
                <View style={styles.tags}>
                    {(item.categories || []).slice(0, 3).map(c => (
                        <View key={c.id} style={styles.tag}><Text style={styles.tagText}>{c.name}</Text></View>
                    ))}
                    {(item.categories || []).length > 3 && (
                        <Text style={styles.moreTag}>+{item.categories.length - 3}</Text>
                    )}
                </View>
            </View>
            <Icon name="chevron-right" size={20} color="#C7CBD1" />
        </TouchableOpacity>
    );
};

const ServicesScreen = ({ navigation }) => {
    const pb = useBottomInset();
    const [tab, setTab] = useState('browse');

    // Search (debounced) + filters
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [city, setCity] = useState(null);
    const [category, setCategory] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    const query = useServiceProviders(category?.id, city?.id, debouncedQ);
    const items = (query.data?.pages || []).flatMap(p => p.providers || []);
    const hasFilters = !!city || !!category || !!debouncedQ;

    // Filter sheets
    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    const [catOpen, setCatOpen] = useState(false);
    const categoriesQuery = useServiceCategories();
    const categories = categoriesQuery.data || [];

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                ) : <View style={styles.headerSide} />}
                <Text style={styles.headerTitle}>Car Services</Text>
                <View style={styles.headerSide} />
            </View>

            <TopTabs
                tabs={[{ key: 'browse', label: 'Providers' }, { key: 'requests', label: 'My Requests' }]}
                active={tab}
                onChange={setTab}
            />

            {tab === 'requests' ? (
                <MyServiceRequestsScreen navigation={navigation} embedded />
            ) : (
                <>
                    {/* Search */}
                    <View style={styles.searchWrap}>
                        <View style={styles.searchBox}>
                            <Icon name="magnify" size={19} color="#9AA0A6" />
                            <TextInput
                                value={q}
                                onChangeText={setQ}
                                placeholder="Search providers…"
                                placeholderTextColor="#9AA0A6"
                                style={styles.searchInput}
                                autoCapitalize="none"
                                returnKeyType="search"
                            />
                            {!!q && (
                                <TouchableOpacity onPress={() => setQ('')}>
                                    <Icon name="close-circle" size={17} color="#C4C9CF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Filters */}
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.chip, city && styles.chipActive]}
                            onPress={() => { setCityOpen(true); setCitySearch(''); }}
                        >
                            <Icon name="map-marker-outline" size={15} color={city ? '#07163B' : '#5D5F62'} />
                            <Text style={[styles.chipText, city && styles.chipTextActive]} numberOfLines={1}>{city?.name || 'All cities'}</Text>
                            <Icon name="chevron-down" size={15} color="#9AA0A6" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.chip, category && styles.chipActive]}
                            onPress={() => setCatOpen(true)}
                        >
                            <Icon name="wrench-outline" size={15} color={category ? '#07163B' : '#5D5F62'} />
                            <Text style={[styles.chipText, category && styles.chipTextActive]} numberOfLines={1}>{category?.name || 'All services'}</Text>
                            <Icon name="chevron-down" size={15} color="#9AA0A6" />
                        </TouchableOpacity>

                        {hasFilters && (
                            <TouchableOpacity onPress={() => { setCity(null); setCategory(null); setQ(''); }}>
                                <Text style={styles.clearText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={items}
                        keyExtractor={item => String(item.id)}
                        renderItem={({ item }) => (
                            <ProviderCard item={item} onPress={() => navigation.navigate('ServiceProviderDetail', { id: item.id })} />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={items.length ? { paddingBottom: pb } : styles.emptyWrap}
                        refreshing={query.isRefetching}
                        onRefresh={query.refetch}
                        onEndReachedThreshold={0.5}
                        onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                        ListHeaderComponent={items.length ? (
                            <Text style={styles.resultCount}>
                                {query.data?.pages?.[0]?.meta?.total ?? items.length} providers
                            </Text>
                        ) : null}
                        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : null}
                        ListEmptyComponent={
                            query.isLoading ? <RowListSkeleton /> : (
                                <View style={styles.empty}>
                                    <Icon name={hasFilters ? 'magnify-close' : 'tools'} size={46} color="#DDDDDD" />
                                    <Text style={styles.emptyTitle}>No providers found</Text>
                                    <Text style={styles.emptySub}>
                                        {hasFilters ? 'Try clearing filters or another city.' : 'Check back soon.'}
                                    </Text>
                                </View>
                            )
                        }
                    />
                </>
            )}

            <SelectSheet
                visible={cityOpen}
                onClose={() => setCityOpen(false)}
                title="Filter by City"
                items={filteredCities}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={city?.id}
                onSelect={(c) => { setCity(c); setCityOpen(false); }}
            />

            <SelectSheet
                visible={catOpen}
                onClose={() => setCatOpen(false)}
                title="Filter by Service"
                items={categories}
                loading={categoriesQuery.isLoading}
                selectedId={category?.id}
                onSelect={(c) => { setCategory(c); setCatOpen(false); }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerSide: { minWidth: 64, justifyContent: 'center' },

    searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 9,
        backgroundColor: '#F5F6F8', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223', padding: 0 },

    filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    chip: {
        flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7,
    },
    chipActive: { borderColor: '#FFD400', backgroundColor: '#FFF9DB' },
    chipText: { flexShrink: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTextActive: { color: '#07163B', fontFamily: Fonts.semiBold },
    clearText: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

    resultCount: { fontSize: 12, fontFamily: Fonts.medium, color: '#9AA0A6', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 2 },

    card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F2F3F5' },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B' },
    cardBody: { flex: 1, gap: 3 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bizName: { flexShrink: 1, fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#202223' },
    mineTag: { backgroundColor: '#FFF4C2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    mineTagText: { fontSize: 10, fontFamily: Fonts.semiBold, color: '#92600B' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    meta: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 },
    tag: { backgroundColor: '#F5F5F7', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
    tagText: { fontSize: 11, fontFamily: Fonts.medium, color: '#5D5F62' },
    moreTag: { fontSize: 11, fontFamily: Fonts.medium, color: '#9AA0A6' },

    spin: { marginVertical: 20 },
    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default ServicesScreen;
