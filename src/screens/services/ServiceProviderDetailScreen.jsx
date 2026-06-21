import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { useServiceProvider } from '../../hooks/useServices';

const ServiceProviderDetailScreen = ({ navigation, route }) => {
    const { id } = route.params || {};
    const insets = useSafeAreaInsets();
    const { data: p, isLoading, isError } = useServiceProvider(id);

    const rating = p?.rating_avg != null ? Number(p.rating_avg).toFixed(1) : null;
    const call = () => p?.phone && Linking.openURL(`tel:${p.phone}`);
    const requestService = () => navigation.navigate('ServiceRequest', { provider: p });

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Provider</Text>
                <View style={styles.headerSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>
            ) : isError || !p ? (
                <View style={styles.center}><Icon name="alert-circle-outline" size={40} color="#DDDDDD" /><Text style={styles.emptySub}>Could not load this provider.</Text></View>
            ) : (
                <>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                        <View style={styles.topCard}>
                            <View style={styles.avatar}><Text style={styles.avatarInitial}>{(p.business_name?.[0] || '?').toUpperCase()}</Text></View>
                            <Text style={styles.bizName}>{p.business_name}</Text>
                            <View style={styles.metaRow}>
                                {!!p.city?.name && (<><Icon name="map-marker-outline" size={13} color="#9AA0A6" /><Text style={styles.meta}>{p.city.name}{p.area ? ` · ${p.area}` : ''}</Text></>)}
                            </View>
                            <View style={styles.statRow}>
                                <View style={styles.stat}>
                                    <Text style={styles.statValue}>{rating || '—'}</Text>
                                    <Text style={styles.statLabel}>Rating</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.stat}>
                                    <Text style={styles.statValue}>{p.total_jobs || 0}</Text>
                                    <Text style={styles.statLabel}>Jobs done</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.section}>Services offered</Text>
                        <View style={styles.card}>
                            <View style={styles.tags}>
                                {(p.categories || []).map(c => (
                                    <View key={c.id} style={styles.tag}>
                                        {!!c.icon && <Icon name={c.icon} size={14} color="#07163B" />}
                                        <Text style={styles.tagText}>{c.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {!!p.description && (
                            <>
                                <Text style={styles.section}>About</Text>
                                <View style={styles.card}><Text style={styles.desc}>{p.description}</Text></View>
                            </>
                        )}
                    </ScrollView>

                    {p.is_mine ? (
                        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                            <View style={styles.mineNote}>
                                <Icon name="information-outline" size={16} color="#92600B" />
                                <Text style={styles.mineNoteText}>This is your own listing — you can’t book your own service.</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                            <TouchableOpacity style={styles.callBtn} onPress={call} activeOpacity={0.85}>
                                <Icon name="phone" size={18} color="#07163B" />
                                <Text style={styles.callText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.requestBtn} onPress={requestService} activeOpacity={0.85}>
                                <Text style={styles.requestText}>Request Service</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerSpacer: { width: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#AAAAAA' },

    topCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 20, alignItems: 'center', gap: 6 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 24, fontFamily: Fonts.bold, color: '#07163B' },
    bizName: { fontSize: 18, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    meta: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6' },
    statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 24 },
    stat: { alignItems: 'center' },
    statValue: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B' },
    statLabel: { fontSize: 11.5, fontFamily: Fonts.regular, color: '#9AA0A6' },
    statDivider: { width: 1, height: 28, backgroundColor: '#EAEDEE' },

    section: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62', marginTop: 18, marginBottom: 8, marginLeft: 2 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F5F7', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
    tagText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B' },
    desc: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 20 },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12,
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    callBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#D7DBDE' },
    callText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    requestBtn: { flex: 1, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    requestText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
    mineNote: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FCE7A0',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    },
    mineNoteText: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#92600B', lineHeight: 18 },
});

export default ServiceProviderDetailScreen;
