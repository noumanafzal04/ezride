import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../constants/fonts';
import BottomSheet from './BottomSheet';
import { usePlans, useSubscribe } from '../hooks/useSubscription';
import { formatMoney } from '../utils/money';

const NAVY = '#07163B';
const YELLOW = '#FFD400';

// Shown when a post is blocked (HTTP 402) because free usage is spent.
// Offers the module's pass; on success calls onSubscribed() so the caller retries.
const PaywallSheet = ({ visible, onClose, module = 'ride', title, subtitle, onSubscribed }) => {
    const { data: plans = [], isLoading } = usePlans(module, { enabled: visible });
    const plan = plans.find(p => p.is_active) || plans[0] || null;

    const subscribe = useSubscribe({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Pass activated', text2: 'You can post again now.' });
            onSubscribed?.();
            onClose();
        },
        onError: (e) => Toast.show({ type: 'error', text1: 'Could not activate', text2: e.response?.data?.message || 'Try again.' }),
    });

    const hours = plan?.duration_days ? plan.duration_days * 24 : 24;

    return (
        <BottomSheet visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
            <View style={styles.body}>
                <View style={styles.iconWrap}><Icon name="lock-open-variant-outline" size={26} color={NAVY} /></View>
                <Text style={styles.title}>{title || 'You’ve used your free posts'}</Text>
                <Text style={styles.subtitle}>{subtitle || `Get a ${hours}-hour pass to keep posting.`}</Text>

                {isLoading ? (
                    <ActivityIndicator color={YELLOW} style={{ marginVertical: 24 }} />
                ) : !plan ? (
                    <Text style={styles.subtitle}>No pass available right now. Please try later.</Text>
                ) : (
                    <View style={styles.planCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planMeta}>Unlimited posts · {hours} hours</Text>
                        </View>
                        <Text style={styles.planPrice}>{formatMoney(plan.price)}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.cta, (!plan || subscribe.isPending) && styles.ctaDisabled]}
                    disabled={!plan || subscribe.isPending}
                    onPress={() => plan && subscribe.mutate(plan.id)}
                    activeOpacity={0.9}
                >
                    <Text style={styles.ctaTxt}>
                        {subscribe.isPending ? 'Activating…' : plan ? `Get pass · ${formatMoney(plan.price)}` : 'Unavailable'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.later} onPress={onClose}>
                    <Text style={styles.laterTxt}>Maybe later</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    sheet: {},
    body: { paddingHorizontal: 20, paddingTop: 6, alignItems: 'center' },
    iconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    title: { fontSize: 18, fontFamily: Fonts.semiBold, color: NAVY, textAlign: 'center' },
    subtitle: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#5B6472', textAlign: 'center', marginTop: 6, lineHeight: 20 },
    planCard: { flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 14, padding: 16, marginTop: 18, backgroundColor: '#FAFBFC' },
    planName: { fontSize: 15, fontFamily: Fonts.semiBold, color: NAVY },
    planMeta: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 2 },
    planPrice: { fontSize: 18, fontFamily: Fonts.bold, color: NAVY },
    cta: { width: '100%', backgroundColor: YELLOW, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
    ctaDisabled: { backgroundColor: '#E5E7EB' },
    ctaTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: NAVY },
    later: { paddingVertical: 12, marginTop: 4 },
    laterTxt: { fontSize: 14, fontFamily: Fonts.medium, color: '#9AA0A6' },
});

export default PaywallSheet;
