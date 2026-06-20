import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import BottomSheet from '../../components/BottomSheet';
import { useAdminInspections, useAdminUpdateStatus } from '../../hooks/useInspections';
import { metaFor, INSPECTION_STATUS_META } from '../../constants/inspection';

const FILTERS = ['all', 'pending', 'reviewing', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const STATUS_OPTIONS = ['pending', 'reviewing', 'scheduled', 'in_progress', 'completed', 'cancelled'];

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};
const fmtDateTimePayload = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
const fmtDisplay = (d) =>
    d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

const AdminInspectionsScreen = ({ navigation }) => {
    const [filter, setFilter] = useState('all');
    const query = useAdminInspections(filter === 'all' ? null : filter);
    const items = (query.data?.pages || []).flatMap(p => p.requests || []);

    // ── Manage sheet state ──
    const [active, setActive] = useState(null); // the request being edited
    const [status, setStatus] = useState(null);
    const [scheduledAt, setScheduledAt] = useState(null);
    const [pickerMode, setPickerMode] = useState(null);
    const [draftDate, setDraftDate] = useState(new Date());

    const openManage = (item) => {
        setActive(item);
        setStatus(item.status);
        setScheduledAt(item.scheduled_at ? new Date(item.scheduled_at) : null);
    };
    const closeManage = () => setActive(null);

    const onPickerChange = (event, selected) => {
        if (event.type === 'dismissed' || !selected) { setPickerMode(null); return; }
        if (pickerMode === 'date') {
            setDraftDate(selected);
            setPickerMode(Platform.OS === 'ios' ? null : 'time');
            if (Platform.OS === 'ios') setScheduledAt(selected);
        } else {
            const combined = new Date(draftDate);
            combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
            setScheduledAt(combined);
            setPickerMode(null);
        }
    };

    const update = useAdminUpdateStatus({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Updated', text2: 'Requester has been notified.' });
            closeManage();
        },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const submitUpdate = () => {
        const payload = { status };
        if (status === 'scheduled' && scheduledAt) payload.scheduled_at = fmtDateTimePayload(scheduledAt);
        update.mutate({ id: active.id, payload });
    };

    const openReport = () => {
        const item = active;
        closeManage();
        navigation.navigate('InspectionReport', { id: item.id });
    };

    const renderItem = ({ item }) => {
        const meta = metaFor(item.status);
        const carLine = [item.car_year, item.car_make, item.car_model].filter(Boolean).join(' ');
        const requester = item.name || (item.user ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() : '');
        return (
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => openManage(item)}>
                <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                        <Text style={styles.carTitle} numberOfLines={1}>{carLine || 'Car inspection'}</Text>
                        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                    </View>
                    <View style={styles.metaRow}>
                        <Icon name="account-outline" size={12} color="#9AA0A6" />
                        <Text style={styles.metaText} numberOfLines={1}>{requester || '—'}</Text>
                        {!!item.phone && <Text style={styles.metaText}>· {item.phone}</Text>}
                    </View>
                    <View style={styles.metaRow}>
                        {!!item.city?.name && (<><Icon name="map-marker-outline" size={12} color="#9AA0A6" /><Text style={styles.metaText}>{item.city.name}</Text></>)}
                        <Text style={styles.metaText}>· #{item.id} · {fmtDate(item.created_at)}</Text>
                    </View>
                </View>
                <Icon name="cog-outline" size={18} color="#C7CBD1" />
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
                <Text style={styles.headerTitle}>Admin · Inspections</Text>
                <TouchableOpacity onPress={query.refetch}>
                    <Icon name="refresh" size={22} color="#07163B" />
                </TouchableOpacity>
            </View>

            <View style={styles.testNote}>
                <Icon name="flask-outline" size={13} color="#92600B" />
                <Text style={styles.testNoteText}>Testing tool — full admin moves to the web portal.</Text>
            </View>

            {/* Filter chips */}
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {FILTERS.map(f => {
                        const activeChip = filter === f;
                        const label = f === 'all' ? 'All' : (INSPECTION_STATUS_META[f]?.label || f);
                        return (
                            <TouchableOpacity key={f} style={[styles.chip, activeChip && styles.chipActive]} onPress={() => setFilter(f)}>
                                <Text style={[styles.chipText, activeChip && styles.chipTextActive]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={items.length ? null : styles.emptyWrap}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={styles.footerSpin} /> : null}
                ListEmptyComponent={
                    query.isLoading ? <ActivityIndicator color="#FFD400" style={styles.footerSpin} /> : (
                        <View style={styles.empty}>
                            <Icon name="clipboard-text-outline" size={44} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No requests</Text>
                        </View>
                    )
                }
            />

            {/* Manage sheet */}
            <BottomSheet visible={!!active} onClose={closeManage} sheetStyle={styles.sheet}>
                {active && (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
                        <Text style={styles.sheetTitle}>
                            {[active.car_year, active.car_make, active.car_model].filter(Boolean).join(' ') || 'Car inspection'}
                        </Text>
                        <Text style={styles.sheetSub}>#{active.id} · {active.name} · {active.phone}</Text>

                        <Text style={styles.sheetLabel}>Status</Text>
                        <View style={styles.statusGrid}>
                            {STATUS_OPTIONS.map(s => {
                                const meta = metaFor(s);
                                const on = status === s;
                                return (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.statusChip, on && { backgroundColor: meta.bg, borderColor: meta.color }]}
                                        onPress={() => setStatus(s)}
                                    >
                                        <Icon name={meta.icon} size={14} color={on ? meta.color : '#9AA0A6'} />
                                        <Text style={[styles.statusChipText, on && { color: meta.color }]}>{meta.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Scheduled → date/time */}
                        {status === 'scheduled' && (
                            <>
                                <Text style={styles.sheetLabel}>Scheduled date & time</Text>
                                <TouchableOpacity style={styles.selectBox} onPress={() => { setPickerMode('date'); setDraftDate(scheduledAt || new Date()); }}>
                                    <Icon name="calendar-clock" size={18} color="#9CA3AF" />
                                    <Text style={scheduledAt ? styles.selectVal : styles.selectPH}>
                                        {scheduledAt ? fmtDisplay(scheduledAt) : 'Pick date & time'}
                                    </Text>
                                </TouchableOpacity>
                                {pickerMode && (
                                    <DateTimePicker value={draftDate} mode={pickerMode} display="default" minimumDate={pickerMode === 'date' ? new Date() : undefined} onChange={onPickerChange} />
                                )}
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.saveBtn, update.isPending && styles.saveBtnDisabled]}
                            onPress={submitUpdate}
                            disabled={update.isPending}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.saveText}>{update.isPending ? 'Saving…' : 'Update & Notify'}</Text>
                        </TouchableOpacity>

                        {/* Fill the category report (auto-grades + completes) */}
                        <TouchableOpacity style={styles.reportBtn} onPress={openReport} activeOpacity={0.85}>
                            <Icon name="clipboard-list-outline" size={18} color="#07163B" />
                            <Text style={styles.reportText}>
                                {active.status === 'completed' ? 'Edit Inspection Report' : 'Fill Inspection Report'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </BottomSheet>
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

    testNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingHorizontal: 16, paddingVertical: 8 },
    testNoteText: { fontSize: 11.5, fontFamily: Fonts.medium, color: '#92600B' },

    filters: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
    chipActive: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTextActive: { color: '#FFFFFF' },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: '#F2F3F5',
    },
    rowBody: { flex: 1, gap: 3 },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    carTitle: { flex: 1, fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#202223' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    metaText: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 10.5, fontFamily: Fonts.semiBold },

    footerSpin: { marginVertical: 20 },
    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 90, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },

    // Sheet
    sheet: { maxHeight: '88%' },
    sheetBody: { paddingHorizontal: 20, paddingTop: 4, gap: 4 },
    sheetTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    sheetSub: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#9AA0A6', marginBottom: 8 },
    sheetLabel: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginTop: 12, marginBottom: 6 },

    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
        borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF',
    },
    statusChipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },

    selectBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FFFFFF',
    },
    selectVal: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#07163B' },
    selectPH: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9CA3AF' },

    saveBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
    saveBtnDisabled: { backgroundColor: '#E5E7EB' },
    saveText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },

    reportBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 12, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#D7DBDE', backgroundColor: '#FFFFFF',
    },
    reportText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
});

export default AdminInspectionsScreen;
