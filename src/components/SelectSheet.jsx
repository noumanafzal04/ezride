import React from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../constants/colors';
import Fonts from '../constants/fonts';
import BottomSheet from './BottomSheet';

const SelectSheet = ({
    visible,
    onClose,
    onSelect,
    title = 'Select',
    items = [],
    loading = false,
    searchable = false,
    search = '',
    onSearch,
    selectedId = null,
}) => {
    return (
        <BottomSheet visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
            <Text style={styles.title}>{title}</Text>

            {searchable && (
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={18} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={onSearch}
                        autoFocus
                    />
                    {search?.length > 0 && (
                        <TouchableOpacity onPress={() => onSearch('')}>
                            <Icon name="close-circle" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.primary} size="small" />
                </View>
            ) : items.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No results found</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => String(item.id)}
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => onSelect(item)}
                            activeOpacity={0.7}
                        >
                            {item.color != null && (
                                <View style={[
                                    styles.colorDot,
                                    { backgroundColor: item.color },
                                    item.color === '#FFFFFF' && styles.colorDotBorder,
                                ]} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemText, selectedId === item.id && styles.itemTextActive]}>
                                    {item.name}
                                </Text>
                                {item.color != null && (
                                    <Text style={styles.hexText}>{item.color.toUpperCase()}</Text>
                                )}
                            </View>
                            {selectedId === item.id && (
                                <Icon name="check-circle" size={20} color={Colors.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    sheet:      { height: '80%' },
    title:      { fontSize: 16, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 12, paddingHorizontal: 20 },

    searchBox:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, gap: 8, backgroundColor: '#F9F9F9' },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: Colors.textDark, padding: 0 },

    list:           { flex: 1 },
    item:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
    itemText:       { fontSize: 15, fontFamily: Fonts.regular, color: Colors.textDark },
    itemTextActive: { fontFamily: Fonts.semiBold },
    hexText:        { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textSecondary, marginTop: 1 },
    colorDot:       { width: 28, height: 28, borderRadius: 14 },
    colorDotBorder: { borderWidth: 1, borderColor: '#E5E7EB' },

    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textSecondary },

    cancelBtn:  { marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
    cancelText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textSecondary },
});

export default SelectSheet;
