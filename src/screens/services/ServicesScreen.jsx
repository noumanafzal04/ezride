import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useServiceCategories } from '../../hooks/useServices';

const ServicesScreen = ({ navigation }) => {
    const { data: categories = [], isLoading } = useServiceCategories();
    const [q, setQ] = useState('');

    const data = useMemo(() => {
        const t = q.trim().toLowerCase();
        return t ? categories.filter(c => c.name.toLowerCase().includes(t)) : categories;
    }, [q, categories]);

    const renderItem = ({ item }) => {
        const count = item.providers_count ?? 0;
        return (
            <TouchableOpacity
                style={styles.cell}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ServiceProviders', { category: item })}
            >
                <View style={styles.iconWrap}>
                    <Icon name={item.icon || 'wrench'} size={23} color="#07163B" />
                </View>
                <Text style={styles.cellLabel} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.count, count === 0 && styles.countEmpty]}>
                    {count === 0 ? 'Coming soon' : `${count} ${count === 1 ? 'provider' : 'providers'}`}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                ) : <View style={styles.headerSide} />}
                <Text style={styles.headerTitle}>Car Services</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyServiceRequests')} style={styles.headerSide}>
                    <Text style={styles.headerLink}>Requests</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={19} color="#9AA0A6" />
                    <TextInput
                        value={q}
                        onChangeText={setQ}
                        placeholder="Search services…"
                        placeholderTextColor="#9AA0A6"
                        style={styles.searchInput}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {!!q && (
                        <TouchableOpacity onPress={() => setQ('')}>
                            <Icon name="close-circle" size={17} color="#C4C9CF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    numColumns={3}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Icon name="magnify-close" size={40} color="#DDDDDD" />
                            <Text style={styles.emptyText}>No service matches “{q}”.</Text>
                        </View>
                    }
                />
            )}
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
    headerSide: { minWidth: 64, justifyContent: 'center' },
    headerLink: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B', textAlign: 'right' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 9,
        backgroundColor: '#F5F6F8', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223', padding: 0 },

    grid: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 28 },
    row: { gap: 10 },
    cell: {
        flex: 1, alignItems: 'center', gap: 7, paddingVertical: 14, marginBottom: 10,
        borderWidth: 1, borderColor: '#EEF0F3', borderRadius: 14, backgroundColor: '#FFFFFF',
    },
    iconWrap: {
        width: 46, height: 46, borderRadius: 13, backgroundColor: '#EEF1F8',
        alignItems: 'center', justifyContent: 'center',
    },
    cellLabel: { fontSize: 11, fontFamily: Fonts.semiBold, color: '#202223', textAlign: 'center', paddingHorizontal: 4, minHeight: 28 },
    count: { fontSize: 9.5, fontFamily: Fonts.medium, color: '#1D6AFF' },
    countEmpty: { color: '#B8BCC2' },

    empty: { alignItems: 'center', paddingTop: 70, gap: 10 },
    emptyText: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },
});

export default ServicesScreen;
