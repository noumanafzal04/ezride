import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
    Image, ActivityIndicator, TextInput, Alert, Linking, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { fileUrl } from '../../utils/media';
import TopTabs from '../../components/TopTabs';
import { RentalGridSkeleton, RowListSkeleton } from '../../components/Skeletons';
import RentalFilterSheet from '../../components/RentalFilterSheet';
import ReviewSheet from '../../components/ReviewSheet';
import { formatMoney } from '../../utils/money';
import { useCurrentLocation } from '../../hooks/useLocation';
import { useRentals, useRentalModels, useMyRentalBookings, useCancelRentalBooking, useOwnerRentalBookings, useRentalBookingAction, useRateRentalBooking } from '../../hooks/useRentals';
import Toast from 'react-native-toast-message';
import chatService from '../../services/chatService';

const CHATTABLE = ['confirmed', 'active', 'completed'];

const money = (n) => formatMoney(n);
const CATS = [{ k: '', l: 'All' }, { k: 'economy', l: 'Economy' }, { k: 'sedan', l: 'Sedan' }, { k: 'suv', l: 'SUV' }, { k: 'luxury', l: 'Luxury' }, { k: 'van', l: 'Van' }];
const Cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const BOOK_STATUS = {
    requested: { label: 'Requested', color: '#D97706', bg: '#FFF7ED' },
    confirmed: { label: 'Confirmed', color: '#109F2A', bg: '#E8F8EE' },
    active: { label: 'Active', color: '#1D6AFF', bg: '#EEF4FF' },
    completed: { label: 'Completed', color: '#5D5F62', bg: '#F1F2F4' },
    cancelled: { label: 'Cancelled', color: '#D83F54', bg: '#FFF0F2' },
    rejected: { label: 'Declined', color: '#D83F54', bg: '#FFF0F2' },
};

const RentalsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [tab, setTab] = useState('browse');
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [adv, setAdv] = useState({}); // advanced filters from the sheet (category, transmission, price_min/max, rating_min, make, model, sort)
    const [filterOpen, setFilterOpen] = useState(false);
    const { city } = useCurrentLocation();

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    const cleanAdv = Object.fromEntries(Object.entries(adv).filter(([, v]) => v !== '' && v != null));
    const filters = { ...(debouncedQ ? { q: debouncedQ } : {}), ...cleanAdv };
    const advCount = Object.keys(cleanAdv).length;
    const browse = useRentals(filters);
    const rentals = (browse.data?.pages || []).flatMap(p => p.rentals || []);
    const modelsQ = useRentalModels();

    const bookingsQ = useMyRentalBookings();
    const bookings = (bookingsQ.data?.pages || []).flatMap(p => p.bookings || []);
    const cancel = useCancelRentalBooking({ onError: (e) => Toast.show({ type: 'error', text1: 'Could not cancel', text2: e.response?.data?.message || 'Try again.' }) });

    const [rateFor, setRateFor] = useState(null); // booking being rated
    const rate = useRateRentalBooking({
        onSuccess: () => { setRateFor(null); Toast.show({ type: 'success', text1: 'Thanks for your review!' }); },
        onError: (e) => Toast.show({ type: 'error', text1: 'Could not submit', text2: e.response?.data?.message || 'Try again.' }),
    });

    const ownerQ = useOwnerRentalBookings();
    const ownerBookings = (ownerQ.data?.pages || []).flatMap(p => p.bookings || []);
    const ownerAct = useRentalBookingAction({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Booking updated' }),
        onError: (e) => Toast.show({ type: 'error', text1: 'Could not update', text2: e.response?.data?.message || 'Try again.' }),
    });

    const openChat = async (bookingId) => {
        try {
            const res = await chatService.byRentalBooking(bookingId);
            const conv = res.data?.data;
            if (conv?.id) navigation.navigate('ChatDetail', { conversationId: conv.id, conversation: conv });
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Could not open chat', text2: e.response?.data?.message || 'Try again.' });
        }
    };

    const renderCard = ({ item }) => {
        const img = fileUrl(item.primary_image);
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('RentalDetail', { id: item.id })}>
                <View style={styles.cardImg}>
                    {img ? <Image source={{ uri: img }} style={styles.cardImgInner} resizeMode="cover" /> : <View style={styles.ph}><Icon name="car-key" size={30} color="#CBD0D6" /></View>}
                    {item.is_managed && <View style={styles.bManaged}><Text style={styles.bManagedTxt}>EZRide</Text></View>}
                    {item.is_inspected && <View style={styles.bInsp}><Icon name="clipboard-check" size={10} color="#FFF" /><Text style={styles.bInspTxt}>{item.inspection?.grade}</Text></View>}
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardPrice}>{money(item.price_per_day)}<Text style={styles.perDay}>/day</Text></Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                        {[Cap(item.category), item.seats ? `${item.seats} seats` : null, item.city?.name].filter(Boolean).join(' · ')}
                    </Text>
                    <View style={styles.cardFootRow}>
                        <Text style={styles.driverTag}>{item.rental_type === 'self_drive' ? 'Self-drive' : item.rental_type === 'both' ? 'Driver / Self' : 'With driver'}</Text>
                        <View style={styles.ratingRow}>
                            <Icon name="star" size={11} color={item.rating != null ? '#FFC107' : '#D7DBDE'} />
                            <Text style={styles.ratingTxt}>{item.rating != null ? Number(item.rating).toFixed(1) : 'New'}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderBooking = ({ item }) => {
        const st = BOOK_STATUS[item.status] || BOOK_STATUS.requested;
        const canCancel = ['requested', 'confirmed'].includes(item.status);
        return (
            <View style={styles.bkCard}>
                <View style={styles.bkTop}>
                    <Text style={styles.bkTitle} numberOfLines={1}>{item.rental_car?.title || 'Rental'}</Text>
                    <View style={[styles.pill, { backgroundColor: st.bg }]}><Text style={[styles.pillTxt, { color: st.color }]}>{st.label}</Text></View>
                </View>
                <Text style={styles.bkMeta}>{item.start_date} → {item.end_date} · {item.days} day{item.days > 1 ? 's' : ''}</Text>
                <Text style={styles.bkMeta}>{item.with_driver ? 'With driver' : 'Self-drive'}{item.total_amount != null ? ` · ${money(item.total_amount)}` : ''}</Text>
                <View style={styles.bkActions}>
                    {CHATTABLE.includes(item.status) && (
                        <TouchableOpacity style={styles.bkBtn} onPress={() => openChat(item.id)}>
                            <Icon name="message-outline" size={15} color="#07163B" /><Text style={styles.bkBtnTxt}>Message</Text>
                        </TouchableOpacity>
                    )}
                    {!!item.owner?.phone && (
                        <TouchableOpacity style={styles.bkBtn} onPress={() => Linking.openURL(`tel:${item.owner.phone}`)}>
                            <Icon name="phone" size={15} color="#07163B" /><Text style={styles.bkBtnTxt}>Call</Text>
                        </TouchableOpacity>
                    )}
                    {canCancel && (
                        <TouchableOpacity style={[styles.bkBtn, styles.bkCancel]} onPress={() => Alert.alert('Cancel booking?', '', [{ text: 'Keep', style: 'cancel' }, { text: 'Cancel', style: 'destructive', onPress: () => cancel.mutate(item.id) }])}>
                            <Text style={[styles.bkBtnTxt, { color: '#D83F54' }]}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                    {item.can_rate && (
                        <TouchableOpacity style={[styles.bkPrimary, styles.bkPrimaryRow]} onPress={() => setRateFor(item)}>
                            <Icon name="star" size={15} color="#07163B" /><Text style={styles.bkPrimaryTxt}>Rate owner</Text>
                        </TouchableOpacity>
                    )}
                    {item.is_rated && (
                        <View style={styles.ratedTag}>
                            <Icon name="star" size={13} color="#92600B" /><Text style={styles.ratedTagTxt}>Reviewed</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderOwnerBooking = ({ item }) => {
        const st = BOOK_STATUS[item.status] || BOOK_STATUS.requested;
        const busy = ownerAct.isPending && ownerAct.variables?.id === item.id;
        const act = (action) => ownerAct.mutate({ id: item.id, action });
        return (
            <View style={styles.bkCard}>
                <View style={styles.bkTop}>
                    <Text style={styles.bkTitle} numberOfLines={1}>{item.rental_car?.title || 'Rental'}</Text>
                    <View style={[styles.pill, { backgroundColor: st.bg }]}><Text style={[styles.pillTxt, { color: st.color }]}>{st.label}</Text></View>
                </View>
                <Text style={styles.bkMeta}>{item.customer?.name || 'Customer'} · {item.start_date} → {item.end_date} ({item.days}d)</Text>
                <Text style={styles.bkMeta}>{item.with_driver ? 'With driver' : 'Self-drive'}{item.total_amount != null ? ` · ${money(item.total_amount)}` : ''}</Text>
                <View style={styles.bkActions}>
                    {CHATTABLE.includes(item.status) && (
                        <TouchableOpacity style={styles.bkBtn} onPress={() => openChat(item.id)}>
                            <Icon name="message-outline" size={15} color="#07163B" /><Text style={styles.bkBtnTxt}>Message</Text>
                        </TouchableOpacity>
                    )}
                    {!!item.customer?.phone && (
                        <TouchableOpacity style={styles.bkBtn} onPress={() => Linking.openURL(`tel:${item.customer.phone}`)}>
                            <Icon name="phone" size={15} color="#07163B" /><Text style={styles.bkBtnTxt}>Call</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'requested' && (
                        <>
                            <TouchableOpacity style={[styles.bkBtn, styles.bkCancel]} disabled={busy} onPress={() => act('reject')}><Text style={[styles.bkBtnTxt, { color: '#D83F54' }]}>Decline</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.bkPrimary} disabled={busy} onPress={() => act('accept')}><Text style={styles.bkPrimaryTxt}>Accept</Text></TouchableOpacity>
                        </>
                    )}
                    {item.status === 'confirmed' && <TouchableOpacity style={styles.bkPrimary} disabled={busy} onPress={() => act('start')}><Text style={styles.bkPrimaryTxt}>Start rental</Text></TouchableOpacity>}
                    {item.status === 'active' && <TouchableOpacity style={styles.bkPrimary} disabled={busy} onPress={() => act('complete')}><Text style={styles.bkPrimaryTxt}>Mark complete</Text></TouchableOpacity>}
                </View>
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
                <Text style={styles.headerTitle}>Rent a Car</Text>
                <View style={styles.hSide} />
            </View>

            <TopTabs tabs={[{ key: 'browse', label: 'Browse' }, { key: 'bookings', label: 'My Bookings' }, { key: 'requests', label: 'Requests' }]} active={tab} onChange={setTab} />

            {tab === 'browse' ? (
                <>
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Icon name="magnify" size={19} color="#9AA0A6" />
                            <TextInput value={q} onChangeText={setQ} placeholder="Search make or model…" placeholderTextColor="#9AA0A6" style={styles.searchInput} autoCapitalize="none" returnKeyType="search" />
                            {!!q && <TouchableOpacity onPress={() => setQ('')}><Icon name="close-circle" size={17} color="#C4C9CF" /></TouchableOpacity>}
                        </View>
                        <TouchableOpacity style={[styles.filterBtn, advCount > 0 && styles.filterBtnOn]} onPress={() => setFilterOpen(true)} activeOpacity={0.85}>
                            <Icon name="tune-variant" size={19} color={advCount > 0 ? '#07163B' : '#5D5F62'} />
                            {advCount > 0 && <View style={styles.filterCount}><Text style={styles.filterCountTxt}>{advCount}</Text></View>}
                        </TouchableOpacity>
                    </View>

                    {/* Quick category chips (synced with the filter sheet) */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsWrap}>
                        {CATS.map(c => {
                            const on = (adv.category || '') === c.k;
                            return (
                                <TouchableOpacity key={c.k} style={[styles.chip, on && styles.chipOn]} onPress={() => setAdv(a => ({ ...a, category: c.k }))}>
                                    <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c.l}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <FlatList
                        data={rentals}
                        keyExtractor={i => String(i.id)}
                        numColumns={2}
                        columnWrapperStyle={rentals.length ? styles.grid : undefined}
                        contentContainerStyle={styles.listPad}
                        renderItem={renderCard}
                        ListHeaderComponent={
                            <View style={styles.listHead}>
                                {city?.name && !filters.city_id ? (
                                    <View style={styles.locPill}><Icon name="map-marker" size={13} color="#07163B" /><Text style={styles.locTxt}>Near {city.name}</Text></View>
                                ) : <View />}
                                {rentals.length > 0 && <Text style={styles.resultCount}>{browse.data?.pages?.[0]?.meta?.total ?? rentals.length} cars</Text>}
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                        refreshing={browse.isRefetching}
                        onRefresh={browse.refetch}
                        onEndReachedThreshold={0.5}
                        onEndReached={() => { if (browse.hasNextPage && !browse.isFetchingNextPage) browse.fetchNextPage(); }}
                        ListFooterComponent={browse.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={{ marginVertical: 16 }} /> : null}
                        ListEmptyComponent={browse.isLoading ? <RentalGridSkeleton /> : (
                            <View style={styles.empty}>
                                <Icon name="car-off" size={44} color="#DDDDDD" />
                                <Text style={styles.emptyTitle}>No cars match</Text>
                                {(advCount > 0 || debouncedQ) && (
                                    <TouchableOpacity onPress={() => { setAdv({}); setQ(''); }}><Text style={styles.clearLink}>Clear filters</Text></TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                    <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 18 }]} onPress={() => navigation.navigate('ListRental')} activeOpacity={0.9}>
                        <Icon name="plus" size={20} color="#07163B" /><Text style={styles.fabTxt}>List your car</Text>
                    </TouchableOpacity>
                </>
            ) : tab === 'bookings' ? (
                <FlatList
                    data={bookings}
                    keyExtractor={i => String(i.id)}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    renderItem={renderBooking}
                    showsVerticalScrollIndicator={false}
                    refreshing={bookingsQ.isRefetching}
                    onRefresh={bookingsQ.refetch}
                    onEndReachedThreshold={0.5}
                    onEndReached={() => { if (bookingsQ.hasNextPage && !bookingsQ.isFetchingNextPage) bookingsQ.fetchNextPage(); }}
                    ListEmptyComponent={bookingsQ.isLoading ? <RowListSkeleton /> : (
                        <View style={styles.empty}><Icon name="calendar-blank" size={44} color="#DDDDDD" /><Text style={styles.emptyTitle}>No rental bookings yet</Text></View>
                    )}
                />
            ) : (
                <FlatList
                    data={ownerBookings}
                    keyExtractor={i => String(i.id)}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    renderItem={renderOwnerBooking}
                    showsVerticalScrollIndicator={false}
                    refreshing={ownerQ.isRefetching}
                    onRefresh={ownerQ.refetch}
                    onEndReachedThreshold={0.5}
                    onEndReached={() => { if (ownerQ.hasNextPage && !ownerQ.isFetchingNextPage) ownerQ.fetchNextPage(); }}
                    ListEmptyComponent={ownerQ.isLoading ? <RowListSkeleton /> : (
                        <View style={styles.empty}><Icon name="inbox-outline" size={44} color="#DDDDDD" /><Text style={styles.emptyTitle}>No booking requests</Text><Text style={styles.emptySub}>Requests on your listed cars appear here.</Text></View>
                    )}
                />
            )}

            <RentalFilterSheet
                visible={filterOpen}
                onClose={() => setFilterOpen(false)}
                initial={adv}
                models={modelsQ.data || []}
                onApply={setAdv}
            />

            <ReviewSheet
                visible={!!rateFor}
                onClose={() => setRateFor(null)}
                submitting={rate.isPending}
                title="Rate this rental"
                subtitle={rateFor ? `How was your experience with ${rateFor.owner?.name || 'the owner'}?` : ''}
                onSubmit={(rating, review) => rateFor && rate.mutate({ id: rateFor.id, payload: { rating, review } })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    hSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223', padding: 0 },
    filterBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#EAEDEE', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    filterBtnOn: { borderColor: '#FFD400', backgroundColor: '#FFF9DB' },
    filterCount: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#07163B', alignItems: 'center', justifyContent: 'center' },
    filterCountTxt: { fontSize: 10, fontFamily: Fonts.bold, color: '#FFFFFF' },

    listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    resultCount: { fontSize: 12, fontFamily: Fonts.medium, color: '#9AA0A6' },
    cardFootRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingTxt: { fontSize: 10.5, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    clearLink: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF', marginTop: 6 },
    chipsWrap: { maxHeight: 56 },
    chips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    chip: { borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#FFFFFF', height: 34 },
    chipOn: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTxtOn: { color: '#FFFFFF' },

    locPill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, marginLeft: 4 },
    locTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    listPad: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 96 },
    grid: { gap: 12 },

    card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden', marginBottom: 12 },
    cardImg: { height: 110, backgroundColor: '#F0F1F3' },
    cardImgInner: { width: '100%', height: '100%' },
    ph: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    bManaged: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FFD400', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    bManagedTxt: { fontSize: 9, fontFamily: Fonts.bold, color: '#07163B' },
    bInsp: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#109F2A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    bInspTxt: { fontSize: 9, fontFamily: Fonts.bold, color: '#FFFFFF' },
    cardBody: { padding: 10, gap: 2 },
    cardTitle: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223' },
    cardPrice: { fontSize: 14, fontFamily: Fonts.bold, color: '#07163B' },
    perDay: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    cardMeta: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    driverTag: { fontSize: 10.5, fontFamily: Fonts.semiBold, color: '#1D6AFF', marginTop: 2 },

    bkCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, gap: 4 },
    bkTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    bkTitle: { flex: 1, fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    pill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
    pillTxt: { fontSize: 10.5, fontFamily: Fonts.semiBold },
    bkMeta: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62' },
    bkActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    bkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#D7DBDE', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    bkBtnTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    bkCancel: { borderColor: '#D83F54' },
    bkPrimary: { backgroundColor: '#FFD400', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
    bkPrimaryRow: { flexDirection: 'row', gap: 6 },
    bkPrimaryTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    ratedTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF4C2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    ratedTagTxt: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#92600B' },

    empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },

    fab: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFD400', borderRadius: 30, paddingHorizontal: 24, paddingVertical: 15, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
    fabTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
});

export default RentalsScreen;
