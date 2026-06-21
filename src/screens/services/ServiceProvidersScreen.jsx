import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useServiceProviders } from '../../hooks/useServices';
import { useCities } from '../../hooks/useLookup';
import SelectSheet from '../../components/SelectSheet';

const ServiceProvidersScreen = ({ navigation, route }) => {
    const category = route?.params?.category || null;
    const [city, setCity] = useState(null);

    const query = useServiceProviders(category?.id, city?.id);
    const items = (query.data?.pages || []).flatMap(p => p.providers || []);

    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    const renderItem = ({ item }) => {
        const rating = item.rating_avg != null ? Number(item.rating_avg).toFixed(1) : null;
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ServiceProviderDetail', { id: item.id })}
            >
                <View style={styles.avatar}><Text style={styles.avatarInitial}>{(item.business_name?.[0] || '?').toUpperCase()}</Text></View>
                <View style={styles.cardBody}>
                    <View style={styles.nameRow}>
                        <Text style={styles.bizName} numberOfLines={1}>{item.business_name}</Text>
                        {item.is_mine && <View style={styles.mineTag}><Text style={styles.mineTagText}>Your listing</Text></View>}
                    </View>
                    <View style={styles.metaRow}>
                        {!!item.city?.name && (<><Icon name="map-marker-outline" size={12} color="#9AA0A6" /><Text style={styles.meta}>{item.city.name}</Text></>)}
                        {rating && (<><Icon name="star" size={12} color="#FFC107" /><Text style={styles.meta}>{rating}</Text></>)}
                        <Text style={styles.meta}>· {item.total_jobs || 0} jobs</Text>
                    </View>
                    <View style={styles.tags}>
                        {(item.categories || []).slice(0, 3).map(c => (
                            <View key={c.id} style={styles.tag}><Text style={styles.tagText}>{c.name}</Text></View>
                        ))}
                    </View>
                </View>
                <Icon name="chevron-right" size={20} color="#C7CBD1" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{category?.name || 'Providers'}</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* City filter */}
            <View style={styles.filterRow}>
                <TouchableOpacity style={styles.cityChip} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                    <Icon name="map-marker-outline" size={15} color="#07163B" />
                    <Text style={styles.cityChipText}>{city?.name || 'All cities'}</Text>
                    <Icon name="chevron-down" size={15} color="#5D5F62" />
                </TouchableOpacity>
                {!!city && (
                    <TouchableOpacity onPress={() => setCity(null)}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={items.length ? { paddingBottom: 16 } : styles.emptyWrap}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : null}
                ListEmptyComponent={
                    query.isLoading ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : (
                        <View style={styles.empty}>
                            <Icon name="tools" size={46} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No providers yet</Text>
                            <Text style={styles.emptySub}>Check back soon or try another city.</Text>
                        </View>
                    )
                }
            />

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
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerSpacer: { width: 24 },

    filterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F3F5' },
    cityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
    cityChipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B' },
    clearText: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

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
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
    tag: { backgroundColor: '#F5F5F7', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
    tagText: { fontSize: 11, fontFamily: Fonts.medium, color: '#5D5F62' },

    spin: { marginVertical: 20 },
    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 90, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default ServiceProvidersScreen;
