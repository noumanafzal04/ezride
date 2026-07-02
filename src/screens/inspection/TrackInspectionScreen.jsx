import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useTrackInspection } from '../../hooks/useInspections';
import { useBottomInset } from '../../hooks/useBottomInset';
import { metaFor, INSPECTION_FLOW, conditionMeta } from '../../constants/inspection';

const fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—'
        : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const TrackInspectionScreen = ({ navigation, route }) => {
    const pb = useBottomInset();
    const [code, setCode] = useState('');
    const [token, setToken] = useState(route?.params?.token || null);

    const { data: item, isLoading, isError, error } = useTrackInspection(token);

    const search = () => {
        const t = code.trim().toUpperCase();
        if (t) setToken(t);
    };

    const meta = item ? metaFor(item.status) : null;
    const carLine = item ? [item.car_year, item.car_make, item.car_model].filter(Boolean).join(' ') : '';
    const activeIdx = item ? INSPECTION_FLOW.indexOf(item.status) : -1;
    const notFound = isError && error?.response?.status === 404;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Track Inspection</Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: pb }]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets={true}>
                <Text style={styles.hint}>Enter the tracking code from your confirmation email.</Text>

                <View style={styles.searchRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. R8HWNK1GPM"
                        placeholderTextColor="#9CA3AF"
                        value={code}
                        onChangeText={setCode}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        onSubmitEditing={search}
                    />
                    <TouchableOpacity style={styles.searchBtn} onPress={search} activeOpacity={0.85}>
                        <Icon name="magnify" size={22} color="#111111" />
                    </TouchableOpacity>
                </View>

                {isLoading && <ActivityIndicator color="#FFD400" style={styles.spin} />}

                {notFound && (
                    <View style={styles.notice}>
                        <Icon name="alert-circle-outline" size={18} color="#D83F54" />
                        <Text style={styles.noticeText}>No request found for that code. Please check and try again.</Text>
                    </View>
                )}

                {item && (
                    <>
                        <View style={styles.statusCard}>
                            <View style={[styles.statusIcon, { backgroundColor: meta.bg }]}>
                                <Icon name={meta.icon} size={22} color={meta.color} />
                            </View>
                            <View style={styles.statusMid}>
                                <Text style={styles.carTitle}>{carLine || 'Car inspection'}</Text>
                                <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                            </View>
                        </View>

                        {item.status === 'cancelled' ? (
                            <View style={styles.cancelledBanner}>
                                <Icon name="close-octagon-outline" size={18} color="#D83F54" />
                                <Text style={styles.cancelledText}>This request was cancelled.</Text>
                            </View>
                        ) : (
                            <View style={styles.steps}>
                                {INSPECTION_FLOW.map((s, i) => {
                                    const sm = metaFor(s);
                                    const done = i <= activeIdx;
                                    return (
                                        <View key={s} style={styles.stepRow}>
                                            <View style={[styles.stepDot, done && { backgroundColor: sm.color, borderColor: sm.color }]}>
                                                <Icon name={i < activeIdx ? 'check' : sm.icon} size={12} color={done ? '#FFFFFF' : '#C7CBD1'} />
                                            </View>
                                            <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{sm.label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {!!item.scheduled_at && (
                            <View style={styles.infoCard}>
                                <Icon name="calendar-check-outline" size={16} color="#9AA0A6" />
                                <Text style={styles.infoText}>Scheduled: {fmtDateTime(item.scheduled_at)}</Text>
                            </View>
                        )}

                        {item.status === 'completed' && (
                            <View style={styles.reportCard}>
                                <View style={styles.reportTop}>
                                    {item.overall_grade != null && (
                                        <View style={styles.gradeBubble}><Text style={styles.gradeText}>{item.overall_grade}</Text></View>
                                    )}
                                    {item.overall_score != null && (
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.scoreValue}>{Number(item.overall_score)}%</Text>
                                            <Text style={styles.scoreCaption}>Overall score</Text>
                                        </View>
                                    )}
                                </View>
                                {!!item.inspector_comments && <Text style={styles.comments}>{item.inspector_comments}</Text>}
                                {Array.isArray(item.report) && item.report.map((r, idx) => {
                                    const cm = conditionMeta(r.condition);
                                    return (
                                        <View key={r.category_id} style={[styles.breakRow, idx > 0 && styles.breakBorder]}>
                                            <Text style={styles.breakName}>{r.category}</Text>
                                            <View style={[styles.condTag, { backgroundColor: cm.bg }]}>
                                                <Text style={[styles.condTagText, { color: cm.color }]}>{cm.label}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
            </KeyboardAvoidingView>
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

    body: { padding: 16 },
    hint: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', marginBottom: 12 },

    searchRow: { flexDirection: 'row', gap: 10 },
    input: {
        flex: 1, borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#FFFFFF',
        fontFamily: Fonts.medium, fontSize: 15, color: '#07163B', letterSpacing: 1,
    },
    searchBtn: { width: 50, borderRadius: 10, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center' },
    spin: { marginTop: 24 },

    notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F2', borderRadius: 12, padding: 14, marginTop: 16 },
    noticeText: { flex: 1, fontSize: 13, fontFamily: Fonts.medium, color: '#D83F54' },

    statusCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16,
    },
    statusIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statusMid: { flex: 1 },
    carTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#202223' },
    statusLabel: { fontSize: 13, fontFamily: Fonts.semiBold, marginTop: 2 },

    steps: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, marginTop: 12, gap: 14 },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    stepLabel: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#9AA0A6' },
    stepLabelDone: { color: '#07163B', fontFamily: Fonts.semiBold },

    cancelledBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F2', borderRadius: 12, padding: 14, marginTop: 12 },
    cancelledText: { fontSize: 13, fontFamily: Fonts.medium, color: '#D83F54' },

    infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, marginTop: 12 },
    infoText: { fontSize: 13.5, fontFamily: Fonts.medium, color: '#07163B' },

    reportCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, marginTop: 12, gap: 12 },
    reportTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    gradeBubble: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E8F8EE', alignItems: 'center', justifyContent: 'center' },
    gradeText: { fontSize: 22, fontFamily: Fonts.bold, color: '#109F2A' },
    scoreValue: { fontSize: 26, fontFamily: Fonts.bold, color: '#07163B' },
    scoreCaption: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    comments: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 20 },
    breakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
    breakBorder: { borderTopWidth: 1, borderTopColor: '#F2F3F5' },
    breakName: { flex: 1, fontSize: 13.5, fontFamily: Fonts.medium, color: '#07163B' },
    condTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
    condTagText: { fontSize: 11, fontFamily: Fonts.semiBold },
});

export default TrackInspectionScreen;
