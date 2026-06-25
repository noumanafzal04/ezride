import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import BottomSheet from './BottomSheet';

const CATEGORIES = [
    { k: '', l: 'All' }, { k: 'economy', l: 'Economy' }, { k: 'sedan', l: 'Sedan' },
    { k: 'suv', l: 'SUV' }, { k: 'luxury', l: 'Luxury' }, { k: 'van', l: 'Van' },
];
const TRANSMISSIONS = [{ k: '', l: 'Any' }, { k: 'automatic', l: 'Automatic' }, { k: 'manual', l: 'Manual' }];
const RATINGS = [{ k: '', l: 'Any' }, { k: '3', l: '3.0+' }, { k: '4', l: '4.0+' }, { k: '4.5', l: '4.5+' }];
const SORTS = [
    { k: '', l: 'Nearby', i: 'map-marker-radius-outline' },
    { k: 'price_asc', l: 'Price ↑', i: 'sort-ascending' },
    { k: 'price_desc', l: 'Price ↓', i: 'sort-descending' },
    { k: 'rating', l: 'Top rated', i: 'star-outline' },
];

const EMPTY = { category: '', transmission: '', rating_min: '', price_min: '', price_max: '', model: '', sort: '' };

// `models` = [{ make, model, count }]
const RentalFilterSheet = ({ visible, onClose, initial = {}, models = [], onApply }) => {
    const [draft, setDraft] = useState({ ...EMPTY, ...initial });

    // Re-sync whenever the sheet is opened with fresh applied filters.
    useEffect(() => { if (visible) setDraft({ ...EMPTY, ...initial }); }, [visible]); // eslint-disable-line

    const set = (patch) => setDraft(d => ({ ...d, ...patch }));
    const reset = () => setDraft({ ...EMPTY });
    const apply = () => { onApply(draft); onClose(); };

    const Chip = ({ active, label, onPress }) => (
        <TouchableOpacity style={[styles.chip, active && styles.chipOn]} onPress={onPress} activeOpacity={0.8}>
            <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <BottomSheet visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
            <View style={styles.head}>
                <Text style={styles.title}>Filters</Text>
                <TouchableOpacity onPress={reset}><Text style={styles.reset}>Reset</Text></TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Sort by</Text>
                <View style={styles.row}>
                    {SORTS.map(s => (
                        <TouchableOpacity key={s.k} style={[styles.sortChip, draft.sort === s.k && styles.chipOn]} onPress={() => set({ sort: s.k })} activeOpacity={0.8}>
                            <Icon name={s.i} size={14} color={draft.sort === s.k ? '#FFFFFF' : '#5D5F62'} />
                            <Text style={[styles.chipTxt, draft.sort === s.k && styles.chipTxtOn]}>{s.l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Price per day (Rs.)</Text>
                <View style={styles.priceRow}>
                    <View style={styles.priceBox}>
                        <Text style={styles.priceAffix}>Min</Text>
                        <TextInput
                            value={String(draft.price_min)} onChangeText={t => set({ price_min: t.replace(/[^0-9]/g, '') })}
                            placeholder="0" placeholderTextColor="#AAA" keyboardType="number-pad" style={styles.priceInput}
                        />
                    </View>
                    <View style={styles.priceDash} />
                    <View style={styles.priceBox}>
                        <Text style={styles.priceAffix}>Max</Text>
                        <TextInput
                            value={String(draft.price_max)} onChangeText={t => set({ price_max: t.replace(/[^0-9]/g, '') })}
                            placeholder="Any" placeholderTextColor="#AAA" keyboardType="number-pad" style={styles.priceInput}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Minimum rating</Text>
                <View style={styles.row}>
                    {RATINGS.map(r => (
                        <Chip key={r.k} active={draft.rating_min === r.k} label={r.l} onPress={() => set({ rating_min: r.k })} />
                    ))}
                </View>

                <Text style={styles.label}>Category</Text>
                <View style={styles.row}>
                    {CATEGORIES.map(c => (
                        <Chip key={c.k} active={draft.category === c.k} label={c.l} onPress={() => set({ category: c.k })} />
                    ))}
                </View>

                <Text style={styles.label}>Transmission</Text>
                <View style={styles.row}>
                    {TRANSMISSIONS.map(t => (
                        <Chip key={t.k} active={draft.transmission === t.k} label={t.l} onPress={() => set({ transmission: t.k })} />
                    ))}
                </View>

                {models.length > 0 && (
                    <>
                        <Text style={styles.label}>Car model</Text>
                        <View style={styles.row}>
                            <Chip active={!draft.model} label="All models" onPress={() => set({ model: '' })} />
                            {models.map(m => {
                                const label = `${m.make} ${m.model}`;
                                return (
                                    <Chip
                                        key={label}
                                        active={draft.model === m.model}
                                        label={m.count != null ? `${label} (${m.count})` : label}
                                        onPress={() => set({ model: draft.model === m.model ? '' : m.model, make: draft.model === m.model ? '' : m.make })}
                                    />
                                );
                            })}
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.applyBtn} onPress={apply} activeOpacity={0.9}>
                    <Text style={styles.applyTxt}>Show results</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    sheet: { height: '82%' },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F2F3F5' },
    title: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    reset: { fontSize: 13.5, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

    body: { paddingHorizontal: 20 },
    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62', marginTop: 18, marginBottom: 10 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    chip: { borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF' },
    sortChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
    chipOn: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTxtOn: { color: '#FFFFFF' },

    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    priceBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
    priceAffix: { fontSize: 12, fontFamily: Fonts.medium, color: '#9AA0A6' },
    priceInput: { flex: 1, fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', padding: 0, textAlign: 'right' },
    priceDash: { width: 12, height: 1.5, backgroundColor: '#D7DBDE' },

    footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2F3F5' },
    applyBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    applyTxt: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default RentalFilterSheet;
