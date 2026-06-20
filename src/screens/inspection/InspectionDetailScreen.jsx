import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { useInspection, useCancelInspection } from '../../hooks/useInspections';
import { metaFor, INSPECTION_FLOW, conditionMeta } from '../../constants/inspection';

const CANCELLABLE = ['pending', 'reviewing', 'scheduled'];

const fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—'
        : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={16} color="#9AA0A6" />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
);

const Stepper = ({ status }) => {
    const activeIdx = INSPECTION_FLOW.indexOf(status);
    return (
        <View style={styles.stepper}>
            {INSPECTION_FLOW.map((s, i) => {
                const meta = metaFor(s);
                const done = i <= activeIdx;
                return (
                    <React.Fragment key={s}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepDot, done && { backgroundColor: meta.color, borderColor: meta.color }]}>
                                <Icon name={i < activeIdx ? 'check' : meta.icon} size={12} color={done ? '#FFFFFF' : '#C7CBD1'} />
                            </View>
                            <Text style={[styles.stepLabel, done && { color: '#07163B', fontFamily: Fonts.semiBold }]} numberOfLines={1}>
                                {meta.label}
                            </Text>
                        </View>
                        {i < INSPECTION_FLOW.length - 1 && (
                            <View style={[styles.stepLine, i < activeIdx && styles.stepLineDone]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

const InspectionDetailScreen = ({ route, navigation }) => {
    const { id } = route.params || {};
    const { data: item, isLoading, isError, refetch, isRefetching } = useInspection(id);

    const cancel = useCancelInspection({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Request cancelled' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });
    const confirmCancel = () => {
        Alert.alert('Cancel this request?', 'Our team will be notified. This cannot be undone.', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Cancel Request', style: 'destructive', onPress: () => cancel.mutate(id) },
        ]);
    };

    const meta = item ? metaFor(item.status) : null;
    const carLine = item ? [item.car_year, item.car_make, item.car_model].filter(Boolean).join(' ') : '';
    const isCancelled = item?.status === 'cancelled';
    const isCompleted = item?.status === 'completed';
    const canCancel = item && CANCELLABLE.includes(item.status);

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Inspection</Text>
                <View style={{ width: 24 }} />
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>
            ) : isError || !item ? (
                <View style={styles.center}>
                    <Icon name="alert-circle-outline" size={40} color="#DDDDDD" />
                    <Text style={styles.emptySub}>Could not load this request.</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                >
                    {/* Status header */}
                    <View style={styles.statusCard}>
                        <View style={[styles.statusIcon, { backgroundColor: meta.bg }]}>
                            <Icon name={meta.icon} size={22} color={meta.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.carTitle}>{carLine || 'Car inspection'}</Text>
                            <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                        <TouchableOpacity onPress={refetch} disabled={isRefetching}>
                            <Icon name="refresh" size={20} color="#9AA0A6" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress */}
                    {isCancelled ? (
                        <View style={styles.cancelledBanner}>
                            <Icon name="close-octagon-outline" size={18} color="#D83F54" />
                            <Text style={styles.cancelledText}>This request was cancelled.</Text>
                        </View>
                    ) : (
                        <View style={styles.block}><Stepper status={item.status} /></View>
                    )}

                    {/* Report summary (completed) */}
                    {isCompleted && (
                        <>
                            <Text style={styles.section}>Inspection Report</Text>
                            <View style={styles.reportCard}>
                                <View style={styles.reportTop}>
                                    {item.overall_grade != null && (
                                        <View style={styles.gradeBubble}>
                                            <Text style={styles.gradeText}>{item.overall_grade}</Text>
                                            <Text style={styles.gradeCaption}>Grade</Text>
                                        </View>
                                    )}
                                    {item.overall_score != null && (
                                        <View style={styles.scoreWrap}>
                                            <Text style={styles.scoreValue}>{Number(item.overall_score)}%</Text>
                                            <Text style={styles.scoreCaption}>Overall score</Text>
                                        </View>
                                    )}
                                </View>
                                {!!item.inspector_comments && (
                                    <Text style={styles.comments}>{item.inspector_comments}</Text>
                                )}
                            </View>

                            {/* Category breakdown */}
                            {Array.isArray(item.report) && item.report.length > 0 && (
                                <View style={[styles.card, { marginTop: 12 }]}>
                                    {item.report.map((r, idx) => {
                                        const cm = conditionMeta(r.condition);
                                        return (
                                            <View key={r.category_id} style={[styles.breakRow, idx > 0 && styles.breakBorder]}>
                                                <View style={styles.breakHead}>
                                                    <Text style={styles.breakName}>{r.category}</Text>
                                                    <View style={[styles.condTag, { backgroundColor: cm.bg }]}>
                                                        <Text style={[styles.condTagText, { color: cm.color }]}>{cm.label}</Text>
                                                    </View>
                                                </View>
                                                {!!r.notes && <Text style={styles.breakNote}>{r.notes}</Text>}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    )}

                    {/* Car */}
                    <Text style={styles.section}>Car</Text>
                    <View style={styles.card}>
                        <InfoRow icon="car-outline" label="Make / Model" value={[item.car_make, item.car_model].filter(Boolean).join(' ')} />
                        <InfoRow icon="calendar-outline" label="Year" value={item.car_year ? String(item.car_year) : '—'} />
                        {!!item.variant && <InfoRow icon="car-info" label="Variant" value={item.variant} />}
                        {!!item.registration_no && <InfoRow icon="card-text-outline" label="Reg. No." value={item.registration_no} />}
                    </View>

                    {/* Schedule & location */}
                    <Text style={styles.section}>Schedule & Location</Text>
                    <View style={styles.card}>
                        {!!item.city?.name && <InfoRow icon="map-marker-outline" label="City" value={item.city.name} />}
                        {!!item.address && <InfoRow icon="map-marker-radius-outline" label="Address" value={item.address} />}
                        <InfoRow icon="calendar-clock" label="Preferred" value={fmtDateTime(item.preferred_at)} />
                        {!!item.scheduled_at && <InfoRow icon="calendar-check-outline" label="Scheduled" value={fmtDateTime(item.scheduled_at)} />}
                        {!!item.inspector?.name && <InfoRow icon="account-wrench-outline" label="Inspector" value={item.inspector.name} />}
                    </View>

                    {/* Notes */}
                    {!!item.notes && (
                        <>
                            <Text style={styles.section}>Notes</Text>
                            <View style={styles.card}><Text style={styles.notesText}>{item.notes}</Text></View>
                        </>
                    )}

                    {/* Contact */}
                    <Text style={styles.section}>Contact</Text>
                    <View style={styles.card}>
                        <InfoRow icon="account-outline" label="Name" value={item.name} />
                        <InfoRow icon="phone-outline" label="Phone" value={item.phone} />
                        {!!item.email && <InfoRow icon="email-outline" label="Email" value={item.email} />}
                    </View>

                    {canCancel && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={confirmCancel}
                            disabled={cancel.isPending}
                            activeOpacity={0.85}
                        >
                            <Icon name="close-circle-outline" size={18} color="#D83F54" />
                            <Text style={styles.cancelText}>{cancel.isPending ? 'Cancelling…' : 'Cancel Request'}</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.requested}>Requested {fmtDateTime(item.created_at)}</Text>
                </ScrollView>
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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#AAAAAA' },

    statusCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        padding: 16,
    },
    statusIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    carTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#202223' },
    statusLabel: { fontSize: 13, fontFamily: Fonts.semiBold, marginTop: 2 },

    block: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, marginTop: 12 },

    // Stepper
    stepper: { flexDirection: 'row', alignItems: 'flex-start' },
    stepItem: { alignItems: 'center', width: 58 },
    stepDot: {
        width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    },
    stepLabel: { fontSize: 9.5, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 5, textAlign: 'center' },
    stepLine: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginTop: 12 },
    stepLineDone: { backgroundColor: '#109F2A' },

    cancelledBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF0F2', borderRadius: 12, padding: 14, marginTop: 12,
    },
    cancelledText: { fontSize: 13, fontFamily: Fonts.medium, color: '#D83F54' },

    section: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62', marginTop: 18, marginBottom: 8, marginLeft: 2 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, gap: 12 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoLabel: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6', width: 96 },
    infoValue: { flex: 1, fontSize: 13.5, fontFamily: Fonts.medium, color: '#07163B', textAlign: 'right' },

    notesText: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 20 },

    // Report
    reportCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, gap: 14 },
    reportTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    gradeBubble: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F8EE',
        alignItems: 'center', justifyContent: 'center',
    },
    gradeText: { fontSize: 24, fontFamily: Fonts.bold, color: '#109F2A' },
    gradeCaption: { fontSize: 10, fontFamily: Fonts.regular, color: '#5D9C6B' },
    scoreWrap: { flex: 1 },
    scoreValue: { fontSize: 28, fontFamily: Fonts.bold, color: '#07163B' },
    scoreCaption: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    comments: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 20 },

    // Category breakdown
    breakRow: { paddingVertical: 10, gap: 4 },
    breakBorder: { borderTopWidth: 1, borderTopColor: '#F2F3F5' },
    breakHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    breakName: { flex: 1, fontSize: 13.5, fontFamily: Fonts.medium, color: '#07163B' },
    condTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
    condTagText: { fontSize: 11, fontFamily: Fonts.semiBold },
    breakNote: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 18 },

    requested: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6', textAlign: 'center', marginTop: 18 },

    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 22, paddingVertical: 15, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#D83F54', backgroundColor: '#FFF0F2',
    },
    cancelText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#D83F54' },
});

export default InspectionDetailScreen;
