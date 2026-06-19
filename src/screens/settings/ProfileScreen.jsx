import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, ActivityIndicator, Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import config from '../../config';
import useMe from '../../hooks/useMe';
import useUserStore from '../../store/userStore';

const FILE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/');
const fileUrl = (p) => (p ? `${FILE_BASE}storage/${p}` : null);

// "1995-05-10" → "10 May 1995 · 29 yrs"
const formatDob = (dob) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return dob;

    const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;

    return `${formatted} · ${age} yrs`;
};

const ProfileRow = ({ label, value, arrow }) => (
    <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{value || '—'}</Text>
            {arrow && <Icon name="chevron-right" size={16} color="#AAAAAA" style={{ marginLeft: 4 }} />}
        </View>
    </View>
);

const VERIFICATION = {
    verified: { label: 'Verified', color: '#109F2A', bg: '#E8F8EE', icon: 'check-decagram' },
    pending:  { label: 'Pending Review', color: '#D97706', bg: '#FFF7ED', icon: 'clock-outline' },
    rejected: { label: 'Rejected', color: '#D83F54', bg: '#FFF0F2', icon: 'close-circle-outline' },
};

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    // Use the cached user instantly, refresh from /me in the background
    const cached = useUserStore(s => s.user);
    const { data, isLoading } = useMe();
    const user = data || cached;

    const isDriver = user?.user_type === 'driver';
    const profile  = user?.profile;
    const dp       = user?.driver_profile;
    const vehicle  = user?.vehicles?.[0];

    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'EZRide User';
    const initial  = (user?.first_name?.[0] || 'E').toUpperCase();
    const verif    = dp?.verification_status ? VERIFICATION[dp.verification_status] : null;

    if (!user && isLoading) {
        return (
            <View style={[styles.root, styles.centerFill]}>
                <ActivityIndicator color="#FFD400" />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarCircle}>
                            {fileUrl(profile?.profile_image) ? (
                                <Image source={{ uri: fileUrl(profile.profile_image) }} style={styles.avatarImg} />
                            ) : (
                                <Text style={styles.avatarInitial}>{initial}</Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.editBadge} onPress={() => navigation.navigate('EditProfile')}>
                            <Icon name="pencil" size={12} color="#07163B" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{fullName}</Text>

                    {isDriver ? (
                        <View style={styles.ratingRow}>
                            <Icon name="star" size={16} color="#FFD400" />
                            <Text style={styles.ratingText}>
                                {Number(dp?.rating_avg || 0).toFixed(1)} · {dp?.total_trips || 0} Trips
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.roleChip}>
                            <Icon name="account-outline" size={13} color="#5D5F62" />
                            <Text style={styles.roleChipText}>Rider</Text>
                        </View>
                    )}

                    {verif && (
                        <View style={[styles.verifBadge, { backgroundColor: verif.bg }]}>
                            <Icon name={verif.icon} size={13} color={verif.color} />
                            <Text style={[styles.verifText, { color: verif.color }]}>{verif.label}</Text>
                        </View>
                    )}
                </View>

                {/* Basic Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="card-account-details-outline" size={18} color="#07163B" />
                        <Text style={styles.cardTitle}>Basic Details</Text>
                    </View>
                    <ProfileRow label="Email Address" value={user?.email} />
                    <ProfileRow label="Phone Number" value={user?.phone_number} />
                    <ProfileRow label="City" value={profile?.city} />
                    <ProfileRow label="Date of Birth" value={formatDob(profile?.dob)} />
                    <ProfileRow label="Gender" value={profile?.gender} />
                    <ProfileRow label="Address" value={profile?.address} />
                </View>

                {/* Driver-only: Driver Details + Vehicle */}
                {isDriver && (
                    <>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Icon name="shield-account-outline" size={18} color="#07163B" />
                                <Text style={styles.cardTitle}>Driver Details</Text>
                            </View>
                            <ProfileRow label="CNIC Number" value={dp?.cnic_number} />
                            <ProfileRow label="License Number" value={dp?.license_number} />
                            <ProfileRow label="Verification" value={verif?.label} />
                            <ProfileRow label="Total Trips" value={String(dp?.total_trips ?? 0)} />
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Icon name="car-outline" size={18} color="#07163B" />
                                <Text style={styles.cardTitle}>Vehicle Information</Text>
                            </View>
                            {vehicle ? (
                                <>
                                    <ProfileRow
                                        label="Vehicle"
                                        value={[vehicle.model?.make?.name, vehicle.model?.name, vehicle.manufacture_year]
                                            .filter(Boolean).join(' ')}
                                    />
                                    <ProfileRow label="Registration No." value={vehicle.registration_number} />
                                    <ProfileRow label="Color" value={vehicle.color} />
                                    <ProfileRow label="Seating Capacity" value={`${vehicle.seating_capacity} seats`} />
                                    <ProfileRow label="Air Conditioner" value={vehicle.has_air_conditioner ? 'Yes' : 'No'} />
                                </>
                            ) : (
                                <ProfileRow label="Vehicle" value="Not added" />
                            )}
                        </View>
                    </>
                )}

                {/* Rider-only: Become a Driver CTA */}
                {!isDriver && (
                    <TouchableOpacity
                        style={styles.becomeDriverCard}
                        onPress={() => navigation.navigate('DriverOnboarding')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.becomeIcon}>
                            <Icon name="steering" size={24} color="#07163B" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.becomeTitle}>Become a Driver</Text>
                            <Text style={styles.becomeDesc}>Register your vehicle and start earning.</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#07163B" />
                    </TouchableOpacity>
                )}

            </ScrollView>

            {/* Edit Profile */}
            <View style={[styles.bottomBtn, { paddingBottom: 14 + insets.bottom }]}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProfile')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    centerFill: { alignItems: 'center', justifyContent: 'center' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#F5F5F7' },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatarCircle: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarInitial: { fontSize: 36, fontFamily: Fonts.bold, color: '#07163B' },
    avatarImg: { width: '100%', height: '100%' },
    editBadge: {
        position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#FFD400', borderWidth: 2, borderColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
    },
    profileName: { fontSize: 18, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 6 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ratingText: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62' },
    roleChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#EFF1F3', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    },
    roleChipText: { fontSize: 12, fontFamily: Fonts.medium, color: '#5D5F62' },
    verifBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8,
    },
    verifText: { fontSize: 12, fontFamily: Fonts.semiBold },

    card: {
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        marginHorizontal: 16, marginBottom: 14, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    cardTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },

    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    rowLabel: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', flex: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', flex: 1.2, justifyContent: 'flex-end' },
    rowValue: { fontSize: 13, fontFamily: Fonts.medium, color: '#07163B', textAlign: 'right' },

    becomeDriverCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#FFFBEA', borderWidth: 1, borderColor: 'rgba(255,212,0,0.6)',
        borderRadius: 16, marginHorizontal: 16, marginBottom: 14, padding: 16,
    },
    becomeIcon: {
        width: 48, height: 48, borderRadius: 13, backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center',
    },
    becomeTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 2 },
    becomeDesc: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },

    bottomBtn: {
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    editBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    editBtnText: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default ProfileScreen;
