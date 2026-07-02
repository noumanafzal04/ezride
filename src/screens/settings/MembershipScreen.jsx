import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { PageSkeleton } from '../../components/Skeletons';
import { useBottomInset } from '../../hooks/useBottomInset';
import { useMembership, usePlans, useSubscribe } from '../../hooks/useSubscription';

const MODULE = {
    ride: { label: 'Rides', icon: 'car' },
    service: { label: 'Services', icon: 'wrench' },
};
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const price = (n) => (Number(n) > 0 ? `Rs. ${Number(n).toLocaleString()}` : 'Free');

const StatusLine = ({ m }) => {
    if (!m.enforcement_enabled) {
        return <Text style={[styles.statusTxt, { color: '#16A34A' }]}>Free access — no plan needed</Text>;
    }
    if (m.has_active_plan) {
        return <Text style={[styles.statusTxt, { color: '#07163B' }]}>{m.posts_left} posts left · until {fmtDate(m.plan_ends_at)}</Text>;
    }
    if (m.free_left > 0) {
        return <Text style={[styles.statusTxt, { color: '#D97706' }]}>{m.free_left} free left</Text>;
    }
    return <Text style={[styles.statusTxt, { color: '#D83F54' }]}>Free limit reached — subscribe to post</Text>;
};

const MembershipScreen = ({ navigation }) => {
    const pb = useBottomInset();
    const { data, isLoading } = useMembership();
    const { data: plans = [] } = usePlans();
    const subscribe = useSubscribe({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Plan activated' }),
        onError: (e) => Toast.show({ type: 'error', text1: 'Failed', text2: e.response?.data?.message || 'Try again.' }),
    });

    const modules = data?.modules || [];
    const plansByModule = plans.reduce((acc, p) => { (acc[p.module] ||= []).push(p); return acc; }, {});

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#07163B" /></TouchableOpacity>
                <Text style={styles.headerTitle}>Membership & Plans</Text>
                <View style={{ width: 24 }} />
            </View>

            {isLoading ? (
                <PageSkeleton />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: pb }}>
                    <Text style={styles.lead}>Your access</Text>
                    {modules.map((m) => {
                        const meta = MODULE[m.module] || { label: m.module, icon: 'star' };
                        return (
                            <View key={m.module} style={styles.statusCard}>
                                <View style={styles.statusIcon}><Icon name={meta.icon} size={20} color="#07163B" /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.statusName}>{meta.label}</Text>
                                    <StatusLine m={m} />
                                </View>
                            </View>
                        );
                    })}

                    {Object.keys(plansByModule).length > 0 && (
                        <>
                            <Text style={[styles.lead, { marginTop: 22 }]}>Plans</Text>
                            {Object.entries(plansByModule).map(([module, list]) => (
                                <View key={module} style={styles.planGroup}>
                                    <Text style={styles.planGroupTitle}>{MODULE[module]?.label || module}</Text>
                                    {list.map((p) => (
                                        <View key={p.id} style={styles.planCard}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.planName}>{p.name}</Text>
                                                <Text style={styles.planMeta}>{p.duration_days} day{p.duration_days > 1 ? 's' : ''} · {p.post_limit} posts</Text>
                                            </View>
                                            <Text style={styles.planPrice}>{price(p.price)}</Text>
                                            <TouchableOpacity
                                                style={styles.subBtn}
                                                onPress={() => subscribe.mutate(p.id)}
                                                disabled={subscribe.isPending}
                                                activeOpacity={0.85}
                                            >
                                                <Text style={styles.subBtnTxt}>Choose</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </>
                    )}

                    <Text style={styles.note}>Posting is free right now. Plans apply once paid membership is enabled.</Text>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    lead: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 12 },
    statusCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
        borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, marginBottom: 10,
    },
    statusIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    statusName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    statusTxt: { fontSize: 12.5, fontFamily: Fonts.medium, marginTop: 2 },

    planGroup: { marginBottom: 16 },
    planGroupTitle: { fontSize: 12, fontFamily: Fonts.semiBold, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    planCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
        borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, marginBottom: 8,
    },
    planName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    planMeta: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 1 },
    planPrice: { fontSize: 14, fontFamily: Fonts.bold, color: '#07163B' },
    subBtn: { backgroundColor: '#FFD400', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
    subBtnTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },

    note: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6', textAlign: 'center', marginTop: 14, lineHeight: 18 },
});

export default MembershipScreen;
