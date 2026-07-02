import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, Modal, ActivityIndicator, PanResponder, Alert, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import Sidebar from '../../components/Sidebar';
import AppHeader from '../../components/AppHeader';
import BottomSheet from '../../components/BottomSheet';
import ReviewSheet from '../../components/ReviewSheet';
import { RideCardSkeleton } from '../../components/Skeletons';
import Avatar from '../../components/Avatar';
import { formatMoney } from '../../utils/money';
import useRidePosts, { useCancelRidePost, useRideLifecycle } from '../../hooks/useRidePosts';
import { useDriverBookings, useBookingActions } from '../../hooks/useDriverBookings';
import { useRateBooking } from '../../hooks/useReview';

// Format "2026-12-01T08:00:00.000000Z" → "01 Dec 2026 · 08:00"
const fmtDeparture = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace(',', ' ·');
};

const fmtPrice = (p) => formatMoney(p, { round: true });

// Tab label → backend booking statuses
const TABS = ['Pending', 'Accepted', 'Declined'];
const TAB_STATUS = {
    Pending:  ['pending'],
    Accepted: ['accepted'],
    Declined: ['rejected', 'cancelled'],
};

// "2026-06-18T..." → "3h ago" / "2d ago"
const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// Map a backend booking → the card shape this screen renders
const mapBooking = (b) => ({
    id: b.id,
    name: `${b.passenger?.first_name || ''} ${b.passenger?.last_name || ''}`.trim() || 'Rider',
    rating: null,
    photo: b.passenger?.profile_image || null,
    seats: b.seats_booked,
    price: `Rs. ${Number(b.total_amount).toLocaleString()}`,
    note: b.note || '',
    requestedAt: timeAgo(b.created_at),
    status: b.status,
    departureAt: b.ride?.departure_at,
    phone: b.passenger?.phone_number,
    distanceKm: b.pickup_distance_km ?? null,
});

// ─── Component ────────────────────────────────────────────────────────────────

const RideRequestsScreen = ({ navigation, embedded = false }) => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState(null); // { action: 'accept'|'decline', item }

    // Driver's own posted rides (real API)
    const postsQuery = useRidePosts();
    const postedRides = postsQuery.data?.ride_posts || [];
    // The post the driver is currently managing — ignore closed ones so a finished
    // or cancelled ride never blocks posting again.
    const activePost = postedRides.find(p => ['active', 'full', 'in_progress'].includes(p.status)) || null;

    // Expandable posted-ride sheet
    const [postSheetVisible, setPostSheetVisible] = useState(false);
    const openPostSheet = () => { if (activePost) setPostSheetVisible(true); };

    const cancelPost = useCancelRidePost({
        onSuccess: () => {
            setPostSheetVisible(false);
            Toast.show({ type: 'success', text1: 'Ride Cancelled', text2: 'Your post has been removed.' });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Could not cancel. Please try again.';
            Toast.show({ type: 'error', text1: 'Failed', text2: msg });
        },
    });

    const handleCancelRide = () => {
        if (!activePost) return;
        Alert.alert(
            'Cancel this ride?',
            'Riders will no longer see this post. This cannot be undone.',
            [
                { text: 'Keep', style: 'cancel' },
                { text: 'Cancel Ride', style: 'destructive', onPress: () => cancelPost.mutate(activePost.id) },
            ],
        );
    };

    // Swipe-up on the peek bar opens the sheet
    const peekPan = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => g.dy < -8 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderRelease: (_, g) => { if (g.dy < -40) openPostSheet(); },
        })
    ).current;

    // Bookings on the driver's CURRENT active post only — so past rides' declined/
    // cancelled requests don't clutter it (the same rider may re-request next time).
    const bookingsQuery = useDriverBookings(
        { ride_post_id: activePost?.id },
        { enabled: !!activePost },
    );
    const allBookings = bookingsQuery.data || [];
    const { accept, reject } = useBookingActions();

    // Show the freshest posts + requests whenever this screen regains focus
    // (e.g. right after the driver posts a new ride).
    const refetchPosts = postsQuery.refetch;
    const refetchBookings = bookingsQuery.refetch;
    useFocusEffect(
        useCallback(() => {
            refetchPosts();
            refetchBookings();
        }, [refetchPosts, refetchBookings])
    );

    // Review prompt queue — after the driver ends a ride we ask them to rate each
    // accepted rider one-by-one (skippable).
    const [reviewQueue, setReviewQueue] = useState([]);
    const reviewItem = reviewQueue[0] || null;
    const advanceReview = () => setReviewQueue(q => q.slice(1));

    const lifecycle = useRideLifecycle({
        onStartSuccess: () => Toast.show({ type: 'success', text1: 'Ride started', text2: 'Riders can no longer cancel.' }),
        onEndSuccess: () => Toast.show({ type: 'success', text1: 'Ride completed' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const rateBooking = useRateBooking({
        onSuccess: () => advanceReview(),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const startRide = () => activePost && lifecycle.start.mutate(activePost.id);

    const endRide = () => {
        if (!activePost) return;
        // Capture accepted riders before the lists refresh, so we can queue reviews.
        const accepted = allBookings.filter(b => b.status === 'accepted').map(mapBooking);
        lifecycle.end.mutate(activePost.id, {
            onSuccess: () => { setPostSheetVisible(false); setReviewQueue(accepted); },
        });
    };

    const callRider = (phone) => phone && Linking.openURL(`tel:${phone}`);

    const currentList = allBookings
        .filter(b => TAB_STATUS[activeTab].includes(b.status))
        .map(mapBooking);

    const tabCount = (tab) => allBookings.filter(b => TAB_STATUS[tab].includes(b.status)).length;

    // ── Actions ──────────────────────────────────────────────────────────────

    const handleAction = (action, item) => {
        if (action === 'chat') {
            navigation.navigate('ChatDetail', { bookingId: item.id });
            return;
        }
        setConfirmModal({ action, item });
    };

    const confirmAction = () => {
        const { action, item } = confirmModal;
        const mutation = action === 'accept' ? accept : reject;

        mutation.mutate(item.id, {
            onSuccess: () => {
                Toast.show({
                    type: 'success',
                    text1: action === 'accept' ? 'Booking Accepted' : 'Booking Declined',
                });
                setActiveTab(action === 'accept' ? 'Accepted' : 'Declined');
            },
            onError: (err) => {
                const msg = err.response?.data?.message || 'Action failed. Please try again.';
                Toast.show({ type: 'error', text1: 'Failed', text2: msg });
            },
        });
        setConfirmModal(null);
    };

    // ── Card ─────────────────────────────────────────────────────────────────

    const renderCard = ({ item }) => {
        const isPending = item.status === 'pending';
        const isAccepted = item.status === 'accepted';
        const isDeclined = item.status === 'rejected' || item.status === 'cancelled';

        return (
            <View style={styles.card}>
                {/* Rider row */}
                <View style={styles.riderRow}>
                    <Avatar uri={item.photo} name={item.name} size={42} bg="#EEEEEE" color="#9AA0A6" style={{ marginRight: 10 }} />
                    <View style={styles.riderInfo}>
                        <Text style={styles.riderName}>{item.name}</Text>
                        <View style={styles.ratingRow}>
                            <Icon name="star" size={12} color="#F5A247" />
                            <Text style={styles.ratingText}>
                                {item.rating ? `${item.rating}` : 'New rider'}
                            </Text>
                            {item.distanceKm != null && (
                                <>
                                    <Text style={styles.ratingText}>·</Text>
                                    <Icon name="map-marker-distance" size={12} color="#1D6AFF" />
                                    <Text style={styles.distanceText}>{item.distanceKm} km away</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <View style={styles.priceCol}>
                        <Text style={styles.cardPrice}>{item.price}</Text>
                        <Text style={styles.cardSeats}>
                            <Icon name="account-outline" size={11} color="#109F2A" /> {item.seats} seat{item.seats > 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>

                {/* Note */}
                {!!item.note && (
                    <View style={styles.noteRow}>
                        <Icon name="comment-text-outline" size={13} color="#9E9E9E" />
                        <Text style={styles.noteText}>{item.note}</Text>
                    </View>
                )}

                {/* Meta */}
                <View style={styles.metaRow}>
                    <Icon name="clock-outline" size={12} color="#AAAAAA" />
                    <Text style={styles.metaText}>Requested {item.requestedAt}</Text>

                    {/* Status badge */}
                    {isAccepted && (
                        <View style={[styles.statusBadge, styles.statusAccepted]}>
                            <Text style={[styles.statusText, { color: '#109F2A' }]}>Accepted</Text>
                        </View>
                    )}
                    {isDeclined && (
                        <View style={[styles.statusBadge, styles.statusDeclined]}>
                            <Text style={[styles.statusText, { color: '#D83F54' }]}>
                                {item.status === 'cancelled' ? 'Cancelled' : 'Declined'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Actions */}
                <View style={styles.actionRow}>
                    {isPending && (
                        <>
                            <TouchableOpacity
                                style={styles.declineBtn}
                                onPress={() => handleAction('decline', item)}
                            >
                                <Text style={styles.declineBtnText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.acceptBtn}
                                onPress={() => handleAction('accept', item)}
                            >
                                <Text style={styles.acceptBtnText}>Accept</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Accepted → contact the rider */}
                    {isAccepted && (
                        <>
                            <TouchableOpacity style={styles.chatBtn} onPress={() => handleAction('chat', item)}>
                                <Icon name="message-outline" size={15} color="#5D5F62" />
                                <Text style={styles.chatBtnText}>Message</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.callBtn} onPress={() => callRider(item.phone)}>
                                <Icon name="phone" size={15} color="#FFFFFF" />
                                <Text style={styles.callBtnText}>Call</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    // ── Empty State ───────────────────────────────────────────────────────────

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Icon
                name={activeTab === 'Pending' ? 'account-clock-outline' : activeTab === 'Accepted' ? 'account-check-outline' : 'account-cancel-outline'}
                size={52}
                color="#DDDDDD"
            />
            <Text style={styles.emptyTitle}>
                {activeTab === 'Pending' ? 'No pending requests' : activeTab === 'Accepted' ? 'No accepted bookings' : 'No declined requests'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'Pending' ? 'Booking requests will appear here.' : 'Riders you accept will show here.'}
            </Text>
        </View>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            {!embedded && (
                <>
                    <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                    <AppHeader title="Booking Requests" onMenu={() => setSidebarOpen(true)} />
                </>
            )}

            {/* Tabs */}
            <View style={styles.tabsRow}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab}
                        </Text>
                        {tabCount(tab) > 0 && (
                            <View style={[
                                styles.tabBadge,
                                activeTab === tab ? styles.tabBadgeActive : null,
                            ]}>
                                <Text style={[
                                    styles.tabBadgeText,
                                    activeTab === tab ? styles.tabBadgeTextActive : null,
                                ]}>
                                    {tabCount(tab)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={currentList}
                keyExtractor={item => String(item.id)}
                renderItem={renderCard}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshing={bookingsQuery.isFetching}
                onRefresh={bookingsQuery.refetch}
                ListEmptyComponent={
                    bookingsQuery.isLoading
                        ? <RideCardSkeleton count={3} />
                        : renderEmpty()
                }
            />

            {/* ── Pinned Bottom: collapsed peek of the driver's posted ride ──── */}
            {postsQuery.isLoading ? (
                <View style={styles.peekBar}>
                    <ActivityIndicator color="#07163B" style={{ paddingVertical: 14 }} />
                </View>
            ) : !activePost ? (
                <View style={styles.peekBar}>
                    <View style={styles.peekEmptyRow}>
                        <Text style={styles.postedEmptyText}>No active ride post.</Text>
                        <TouchableOpacity
                            style={styles.postNowBtn}
                            onPress={() => navigation.navigate('PostRide')}
                            activeOpacity={0.85}
                        >
                            <Icon name="plus" size={15} color="#111111" />
                            <Text style={styles.postNowText}>Post a Ride</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.peekBar}>
                    {/* swipe-up handle */}
                    <View style={styles.peekHandleArea} {...peekPan.panHandlers}>
                        <View style={styles.peekHandle} />
                    </View>
                    <TouchableOpacity onPress={openPostSheet} activeOpacity={0.8}>
                        <View style={styles.peekTitleRow}>
                            <Text style={styles.peekTitle}>Your Posted Ride</Text>
                            <Icon name="chevron-up" size={18} color="#9AA0A6" />
                        </View>
                        <View style={styles.peekRouteRow}>
                            <Text style={styles.peekRoute} numberOfLines={1}>
                                {activePost.from?.city?.name}
                                <Text style={styles.postedArrow}>  →  </Text>
                                {activePost.to?.city?.name}
                            </Text>
                            <View style={styles.seatsTag}>
                                <Icon name="account-multiple-outline" size={13} color="#07163B" />
                                <Text style={styles.seatsTagText}>{activePost.available_seats ?? '—'}</Text>
                            </View>
                        </View>
                        <Text style={styles.peekDate}>{fmtDeparture(activePost.departure_at)}</Text>
                    </TouchableOpacity>

                    {/* Quick Start / End right on the bar */}
                    {activePost.status === 'in_progress' ? (
                        <TouchableOpacity
                            style={styles.peekActionBtn}
                            onPress={endRide}
                            disabled={lifecycle.end.isPending}
                            activeOpacity={0.85}
                        >
                            <Icon name="flag-checkered" size={16} color="#111111" />
                            <Text style={styles.peekActionText}>
                                {lifecycle.end.isPending ? 'Ending…' : 'End Ride'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.peekActionBtn}
                            onPress={startRide}
                            disabled={lifecycle.start.isPending}
                            activeOpacity={0.85}
                        >
                            <Icon name="play-circle-outline" size={16} color="#111111" />
                            <Text style={styles.peekActionText}>
                                {lifecycle.start.isPending ? 'Starting…' : 'Start Ride'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* ── Expanded posted-ride sheet ─────────────────────────────────── */}
            <BottomSheet visible={postSheetVisible} onClose={() => setPostSheetVisible(false)}>
                {activePost && (
                    <View style={styles.sheetBody}>
                        <Text style={styles.sheetTitle}>Your Posted Ride</Text>

                        {/* Route + addresses */}
                        <View style={styles.sheetRoute}>
                            <View style={styles.sheetRouteItem}>
                                <Icon name="map-marker-outline" size={16} color="#109F2A" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sheetCity}>{activePost.from?.city?.name}</Text>
                                    {!!activePost.from?.address && (
                                        <Text style={styles.sheetAddr}>{activePost.from.address}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.sheetRouteItem}>
                                <Icon name="map-marker-check-outline" size={16} color="#07163B" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sheetCity}>{activePost.to?.city?.name}</Text>
                                    {!!activePost.to?.address && (
                                        <Text style={styles.sheetAddr}>{activePost.to.address}</Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Meta chips */}
                        <View style={styles.sheetChips}>
                            <View style={styles.sheetChip}>
                                <Icon name="calendar-clock" size={14} color="#5D5F62" />
                                <Text style={styles.sheetChipText}>{fmtDeparture(activePost.departure_at)}</Text>
                            </View>
                            <View style={styles.sheetChip}>
                                <Icon name="account-multiple-outline" size={14} color="#5D5F62" />
                                <Text style={styles.sheetChipText}>{activePost.available_seats ?? '—'} seats</Text>
                            </View>
                            <View style={styles.sheetChip}>
                                <Icon name="cash" size={14} color="#5D5F62" />
                                <Text style={styles.sheetChipText}>{fmtPrice(activePost.price_per_seat)} / seat</Text>
                            </View>
                            <View style={styles.sheetChip}>
                                <Icon name="car-outline" size={14} color="#5D5F62" />
                                <Text style={styles.sheetChipText}>{activePost.post_type === 'private' ? 'Private' : 'Shared'}</Text>
                            </View>
                            {activePost.luggage_allowed && (
                                <View style={styles.sheetChip}>
                                    <Icon name="bag-suitcase-outline" size={14} color="#5D5F62" />
                                    <Text style={styles.sheetChipText}>Luggage allowed</Text>
                                </View>
                            )}
                        </View>

                        {!!activePost.notes && (
                            <View style={styles.sheetNote}>
                                <Icon name="comment-text-outline" size={14} color="#9E9E9E" />
                                <Text style={styles.sheetNoteText}>{activePost.notes}</Text>
                            </View>
                        )}

                        {/* Trip lifecycle */}
                        {activePost.status === 'in_progress' ? (
                            <TouchableOpacity
                                style={styles.endRideBtn}
                                onPress={endRide}
                                disabled={lifecycle.end.isPending}
                                activeOpacity={0.85}
                            >
                                <Icon name="flag-checkered" size={18} color="#111111" />
                                <Text style={styles.endRideText}>
                                    {lifecycle.end.isPending ? 'Ending…' : 'End Ride'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.startRideBtn}
                                    onPress={startRide}
                                    disabled={lifecycle.start.isPending}
                                    activeOpacity={0.85}
                                >
                                    <Icon name="play-circle-outline" size={18} color="#111111" />
                                    <Text style={styles.startRideText}>
                                        {lifecycle.start.isPending ? 'Starting…' : 'Start Ride'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelRideBtn}
                                    onPress={handleCancelRide}
                                    disabled={cancelPost.isPending}
                                    activeOpacity={0.85}
                                >
                                    <Icon name="close-circle-outline" size={18} color="#D83F54" />
                                    <Text style={styles.cancelRideText}>
                                        {cancelPost.isPending ? 'Cancelling…' : 'Cancel Ride'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </BottomSheet>

            {/* ── Confirm Modal ────────────────────────────────────────────── */}
            <Modal visible={!!confirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHandle} />

                        {confirmModal?.action === 'accept' ? (
                            <>
                                <View style={styles.modalIconWrap}>
                                    <Icon name="account-check-outline" size={32} color="#109F2A" />
                                </View>
                                <Text style={styles.modalTitle}>Accept Booking?</Text>
                                <Text style={styles.modalBody}>
                                    You're about to accept{' '}
                                    <Text style={styles.modalBold}>{confirmModal?.item?.name}</Text>
                                    {' '}({confirmModal?.item?.seats} seat{confirmModal?.item?.seats > 1 ? 's' : ''}) for this ride.
                                    A seat will be reserved for them.
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.modalIconWrap}>
                                    <Icon name="account-cancel-outline" size={32} color="#D83F54" />
                                </View>
                                <Text style={styles.modalTitle}>Decline Booking?</Text>
                                <Text style={styles.modalBody}>
                                    You're about to decline{' '}
                                    <Text style={styles.modalBold}>{confirmModal?.item?.name}</Text>'s
                                    booking request. They will be notified.
                                </Text>
                            </>
                        )}

                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setConfirmModal(null)}
                            >
                                <Text style={styles.modalCancelText}>Go Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalConfirmBtn,
                                    confirmModal?.action === 'decline' && styles.modalConfirmBtnRed,
                                ]}
                                onPress={confirmAction}
                            >
                                <Text style={[
                                    styles.modalConfirmText,
                                    confirmModal?.action === 'decline' && { color: '#FFFFFF' },
                                ]}>
                                    {confirmModal?.action === 'accept' ? 'Yes, Accept' : 'Yes, Decline'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ReviewSheet
                visible={!!reviewItem}
                onClose={advanceReview}
                submitting={rateBooking.isPending}
                title="Rate the rider"
                subtitle={reviewItem?.name}
                onSubmit={(rating, review) => rateBooking.mutate({ id: reviewItem.id, rating, review })}
            />

            <Sidebar
                visible={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                navigation={navigation}
                activeRoute="Rides"
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

    // Header
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    bellBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#D83F54',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bellBadgeText: {
        fontSize: 9,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#07163B',
    },
    tabText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#AAAAAA',
    },
    tabTextActive: {
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    tabBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EAEDEE',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeActive: {
        backgroundColor: '#FFD400',
    },
    tabBadgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: '#5D5F62',
    },
    tabBadgeTextActive: {
        color: '#111111',
    },

    // List
    list: { padding: 16, paddingBottom: 180 },

    // Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 12,

    },
    riderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    riderInfo: { flex: 1 },
    riderName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 3,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    distanceText: { fontSize: 12, fontFamily: Fonts.semiBold, color: '#1D6AFF' },
    priceCol: { alignItems: 'flex-end' },
    cardPrice: { fontSize: 15, fontFamily: Fonts.bold, color: '#202223' },
    cardSeats: { fontSize: 12, fontFamily: Fonts.medium, color: '#109F2A', marginTop: 2 },

    noteRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
    },
    noteText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        flex: 1,
        lineHeight: 17,
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 10,
    },
    metaText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
        flex: 1,
    },
    statusBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    statusAccepted: { backgroundColor: '#E8F8EE' },
    reviewedPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F5F5F7' },
    reviewedPillText: { fontSize: 12, fontFamily: Fonts.medium, color: '#5D5F62' },
    statusDeclined: { backgroundColor: '#FFF0F2' },
    statusText: { fontSize: 11, fontFamily: Fonts.semiBold },

    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },

    actionRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    chatBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    chatBtnText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#109F2A',
    },
    callBtnText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#FFFFFF' },
    declineBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D83F54',
        backgroundColor: '#FFF0F2',
        alignItems: 'center',
    },
    declineBtnText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54' },
    acceptBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#FFD400',
        alignItems: 'center',
    },
    acceptBtnText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },

    // Empty State
    emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySubtitle: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },

    // ── Pinned Bottom Bar ──────────────────────────────────────────────────
    // ── Collapsed peek bar ──────────────────────────────────────────────────
    peekBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        paddingHorizontal: 16,
        paddingBottom: 26,
        elevation: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.10,
        shadowRadius: 12,
    },
    peekHandleArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 8 },
    peekHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
    peekEmptyRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 16,
    },
    peekTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    peekTitle: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    peekRouteRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, marginTop: 6,
    },
    peekRoute: { flex: 1, fontSize: 15, fontFamily: Fonts.semiBold, color: '#202223' },
    peekDate: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', marginTop: 4 },
    peekActionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#FFD400', borderRadius: 10, paddingVertical: 12, marginTop: 12,
    },
    peekActionText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#111111' },
    postedArrow: { fontFamily: Fonts.regular, color: '#9E9E9E' },

    postedEmptyText: { fontSize: 13, fontFamily: Fonts.regular, color: '#9E9E9E' },
    postNowBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFD400', borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    postNowText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },

    seatsTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F5F5F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    seatsTagText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },

    // ── Expanded sheet ──────────────────────────────────────────────────────
    sheetBody: { paddingHorizontal: 20, paddingTop: 4 },
    sheetTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 16 },
    sheetRoute: {
        borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12, padding: 14, gap: 12, marginBottom: 14,
    },
    sheetRouteItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    sheetCity: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    sheetAddr: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', marginTop: 1 },
    sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    sheetChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#F5F5F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
    },
    sheetChipText: { fontSize: 12, fontFamily: Fonts.medium, color: '#5D5F62' },
    sheetNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        backgroundColor: '#F9F9F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 14,
    },
    sheetNoteText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 17 },
    cancelRideBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#D83F54',
        backgroundColor: '#FFF0F2',
    },
    cancelRideText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#D83F54' },
    startRideBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 15, borderRadius: 12, backgroundColor: '#FFD400', marginBottom: 12,
    },
    startRideText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
    endRideBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 15, borderRadius: 12, backgroundColor: '#FFD400',
    },
    endRideText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
    },
    modalHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalIconWrap: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        textAlign: 'center',
        marginBottom: 10,
    },
    modalBody: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalBold: { fontFamily: Fonts.semiBold, color: '#202223' },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#5D5F62',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        backgroundColor: '#FFD400',
        alignItems: 'center',
    },
    modalConfirmBtnRed: {
        backgroundColor: '#D83F54',
    },
    modalConfirmText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default RideRequestsScreen;
