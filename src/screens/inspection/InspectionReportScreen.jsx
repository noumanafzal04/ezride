import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { useInspectionCategories, useSaveReport, useInspection } from '../../hooks/useInspections';
import { CONDITION_META, CONDITION_ORDER, conditionMeta } from '../../constants/inspection';

const WEIGHTS = { excellent: 100, good: 75, fair: 50, poor: 25 };
const gradeFor = (s) => s == null ? '—' : s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'E';

const InspectionReportScreen = ({ route, navigation }) => {
    const { id } = route.params || {};
    const catsQuery = useInspectionCategories();
    const detailQuery = useInspection(id);
    const categories = catsQuery.data || [];

    // condition + note per category id
    const [values, setValues] = useState({}); // { [catId]: { condition, notes } }
    const [comments, setComments] = useState('');
    const [seeded, setSeeded] = useState(false);

    // Seed from any existing report (re-editing a completed one).
    useEffect(() => {
        if (seeded) return;
        const item = detailQuery.data;
        if (!item) return;
        const next = {};
        (item.report || []).forEach(r => { next[r.category_id] = { condition: r.condition, notes: r.notes || '' }; });
        setValues(next);
        if (item.inspector_comments) setComments(item.inspector_comments);
        setSeeded(true);
    }, [detailQuery.data, seeded]);

    const setCondition = (catId, condition) =>
        setValues(v => ({ ...v, [catId]: { ...v[catId], condition } }));
    const setNote = (catId, notes) =>
        setValues(v => ({ ...v, [catId]: { ...v[catId], notes } }));

    // Live preview of the auto score/grade.
    const { score, filled } = useMemo(() => {
        const scored = Object.values(values).map(v => v?.condition).filter(c => WEIGHTS[c] != null);
        const count = Object.values(values).filter(v => v?.condition).length;
        const avg = scored.length ? Math.round((scored.reduce((s, c) => s + WEIGHTS[c], 0) / scored.length) * 100) / 100 : null;
        return { score: avg, filled: count };
    }, [values]);

    const save = useSaveReport({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Report saved', text2: 'Requester notified — marked completed.' });
            navigation.goBack();
        },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const handleSave = () => {
        const items = Object.entries(values)
            .filter(([, v]) => v?.condition)
            .map(([category_id, v]) => ({ category_id: Number(category_id), condition: v.condition, notes: v.notes?.trim() || null }));
        if (!items.length) { Toast.show({ type: 'error', text1: 'Required', text2: 'Rate at least one category.' }); return; }
        save.mutate({ id, payload: { items, comments: comments.trim() || null } });
    };

    const loading = catsQuery.isLoading || detailQuery.isLoading;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Inspection Report</Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>
            ) : (
                <>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                        {/* Live score preview */}
                        <View style={styles.previewCard}>
                            <View style={styles.gradeBubble}><Text style={styles.gradeText}>{gradeFor(score)}</Text></View>
                            <View style={styles.previewMid}>
                                <Text style={styles.previewScore}>{score != null ? `${score}%` : '—'}</Text>
                                <Text style={styles.previewCaption}>Auto score · {filled}/{categories.length} rated</Text>
                            </View>
                        </View>

                        {categories.map(cat => {
                            const cur = values[cat.id]?.condition;
                            return (
                                <View key={cat.id} style={styles.catCard}>
                                    <Text style={styles.catName}>{cat.name}</Text>
                                    <View style={styles.condRow}>
                                        {CONDITION_ORDER.map(c => {
                                            const meta = CONDITION_META[c];
                                            const on = cur === c;
                                            return (
                                                <TouchableOpacity
                                                    key={c}
                                                    style={[styles.condChip, on && { backgroundColor: meta.bg, borderColor: meta.color }]}
                                                    onPress={() => setCondition(cat.id, c)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Text style={[styles.condText, on && { color: meta.color, fontFamily: Fonts.semiBold }]}>{meta.label}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    {!!cur && (
                                        <TextInput
                                            style={styles.note}
                                            placeholder="Note (optional)"
                                            placeholderTextColor="#9CA3AF"
                                            value={values[cat.id]?.notes || ''}
                                            onChangeText={(t) => setNote(cat.id, t)}
                                        />
                                    )}
                                </View>
                            );
                        })}

                        <Text style={styles.label}>Overall comments <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            style={[styles.note, styles.textArea]}
                            placeholder="Summary shown to the requester"
                            placeholderTextColor="#9CA3AF"
                            value={comments} onChangeText={setComments}
                            multiline textAlignVertical="top"
                        />
                    </ScrollView>

                    <View style={styles.bottomBtn}>
                        <TouchableOpacity
                            style={[styles.saveBtn, save.isPending && styles.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={save.isPending}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.saveText}>{save.isPending ? 'Saving…' : 'Save Report & Complete'}</Text>
                        </TouchableOpacity>
                    </View>
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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    body: { padding: 16, paddingBottom: 110, gap: 12 },

    previewCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16,
    },
    gradeBubble: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFFBEA', alignItems: 'center', justifyContent: 'center' },
    gradeText: { fontSize: 22, fontFamily: Fonts.bold, color: '#07163B' },
    previewMid: { flex: 1 },
    previewScore: { fontSize: 24, fontFamily: Fonts.bold, color: '#07163B' },
    previewCaption: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },

    catCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, gap: 10 },
    catName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    condRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    condChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
    condText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    note: {
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
        fontFamily: Fonts.regular, fontSize: 13.5, color: '#07163B',
    },
    textArea: { height: 80, paddingTop: 12 },
    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginTop: 4 },
    optional: { fontSize: 12, fontFamily: Fonts.regular, color: '#9CA3AF' },

    bottomBtn: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    saveBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    saveBtnDisabled: { backgroundColor: '#E5E7EB' },
    saveText: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default InspectionReportScreen;
