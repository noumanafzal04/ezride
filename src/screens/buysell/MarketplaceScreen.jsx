import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, ScrollView,
    TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const MAIN_TABS = ['Buy Cars', 'Sell Cars'];
const SELL_TABS = ['Active', 'Draft', 'Sold'];

const CARS = [
    { id: '1', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'New' },
    { id: '2', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'Used' },
    { id: '3', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'Used' },
];

const FEATURED = [
    { id: 'f1', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'Used' },
    { id: 'f2', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'New' },
];

const CarCard = ({ item, onPress, featured }) => (
    <TouchableOpacity
        style={[styles.carCard, featured && styles.carCardFeatured]}
        onPress={onPress}
        activeOpacity={0.85}
    >
        {/* Image */}
        <View style={[styles.carImageBox, featured && styles.carImageBoxFeatured]}>
            <View style={styles.carImagePlaceholder}>
                <Icon name="car" size={36} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={styles.conditionBadge}>
                <Text style={[styles.conditionText, { color: item.condition === 'New' ? '#109F2A' : '#5D5F62' }]}>
                    {item.condition}
                </Text>
            </View>
            <TouchableOpacity style={styles.heartBtn}>
                <Icon name="heart-outline" size={16} color="#5D5F62" />
            </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.carInfo}>
            <Text style={styles.carTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.carPrice}>{item.price}</Text>
            {item.negotiable && <Text style={styles.negotiable}>Negotiable</Text>}
            <View style={styles.carMetaRow}>
                <View style={styles.metaItem}>
                    <Icon name="calendar-outline" size={11} color="#5D5F62" />
                    <Text style={styles.metaText}>{item.year}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Icon name="speedometer" size={11} color="#5D5F62" />
                    <Text style={styles.metaText}>{item.km}</Text>
                </View>
            </View>
            <View style={styles.carMetaRow}>
                <View style={styles.metaItem}>
                    <Icon name="map-marker-outline" size={11} color="#5D5F62" />
                    <Text style={styles.metaText}>{item.city}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Icon name="car-shift-pattern" size={11} color="#5D5F62" />
                    <Text style={styles.metaText}>{item.transmission}</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

const MarketplaceScreen = ({ navigation }) => {
    const [mainTab, setMainTab] = useState(0);
    const [sellTab, setSellTab] = useState('Active');

    const isBuy = mainTab === 0;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity>
                    <Icon name="menu" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Marketplace</Text>
                <TouchableOpacity>
                    <Icon name="bell-outline" size={24} color="#07163B" />
                </TouchableOpacity>
            </View>

            {/* Main Tabs */}
            <View style={styles.mainTabsRow}>
                {MAIN_TABS.map((tab, i) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.mainTab, mainTab === i && styles.mainTabActive]}
                        onPress={() => setMainTab(i)}
                    >
                        <Text style={[styles.mainTabText, mainTab === i && styles.mainTabTextActive]}>
                            {tab} {i === 0 ? '(2)' : '(1)'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isBuy ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                    {/* Search */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Icon name="magnify" size={18} color="#9E9E9E" />
                            <TextInput
                                placeholder="Search make, model or year"
                                placeholderTextColor="#AAAAAA"
                                style={styles.searchInput}
                            />
                        </View>
                        {/* Filter Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                            {['Model', 'Year', 'Location', 'Price'].map(f => (
                                <TouchableOpacity key={f} style={styles.filterChip}>
                                    <Text style={styles.filterChipText}>{f}</Text>
                                    <Icon name="chevron-down" size={14} color="#5D5F62" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Car List */}
                    <View style={styles.body}>
                        {CARS.map(car => (
                            <CarCard
                                key={car.id}
                                item={car}
                                onPress={() => navigation.navigate('CarDetail', { car })}
                            />
                        ))}

                        {/* Featured Posts */}
                        <View style={styles.featuredHeader}>
                            <Text style={styles.sectionTitle}>Featured Posts</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('FeaturedPosts')}>
                                <Text style={styles.viewAll}>View All →</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
                            {FEATURED.map(car => (
                                <CarCard
                                    key={car.id}
                                    item={car}
                                    featured
                                    onPress={() => navigation.navigate('CarDetail', { car })}
                                />
                            ))}
                        </ScrollView>

                        {/* More cars */}
                        {CARS.map(car => (
                            <CarCard
                                key={car.id + '_b'}
                                item={car}
                                onPress={() => navigation.navigate('CarDetail', { car })}
                            />
                        ))}
                    </View>
                </ScrollView>
            ) : (
                /* SELL TAB */
                <View style={{ flex: 1 }}>
                    {/* Sub Tabs */}
                    <View style={styles.sellSubTabs}>
                        {SELL_TABS.map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.sellSubTab, sellTab === tab && styles.sellSubTabActive]}
                                onPress={() => setSellTab(tab)}
                            >
                                <Text style={[styles.sellSubTabText, sellTab === tab && styles.sellSubTabTextActive]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        data={CARS}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <CarCard
                                item={item}
                                onPress={() => navigation.navigate('CarDetail', { car: item })}
                            />
                        )}
                        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Sell Your Car Button */}
                    <View style={styles.sellBottomBtn}>
                        <TouchableOpacity
                            style={styles.sellBtn}
                            onPress={() => navigation.navigate('SellCar')}
                            activeOpacity={0.85}
                        >
                            <Icon name="plus" size={18} color="#111111" />
                            <Text style={styles.sellBtnText}>Sell Your Car</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },

    // Main Tabs
    mainTabsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    mainTab: {
        flex: 1,
        paddingVertical: 13,
        alignItems: 'center',
    },
    mainTabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#07163B',
    },
    mainTabText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#AAAAAA',
    },
    mainTabTextActive: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },

    // Search
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
        gap: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: '#FFFFFF',
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#202223',
    },
    filtersScroll: { flexGrow: 0 },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },

    body: { padding: 16 },

    // Car Card
    carCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    carCardFeatured: {
        width: 220,
        flexDirection: 'column',
        marginRight: 12,
        marginBottom: 0,
    },
    carImageBox: {
        width: 110,
        height: 100,
        backgroundColor: '#1A1A2E',
        position: 'relative',
    },
    carImageBoxFeatured: {
        width: '100%',
        height: 130,
    },
    carImagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    conditionBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    conditionText: {
        fontSize: 10,
        fontFamily: Fonts.semiBold,
    },
    heartBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    carInfo: {
        flex: 1,
        padding: 12,
    },
    carTitle: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 3,
    },
    carPrice: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#07163B',
        marginBottom: 2,
    },
    negotiable: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: '#1D6AFF',
        marginBottom: 6,
    },
    carMetaRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 3,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // Featured
    featuredHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    viewAll: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#FFD400',
    },
    featuredScroll: {
        marginBottom: 16,
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },

    // Sell Sub Tabs
    sellSubTabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 10,
        padding: 4,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    sellSubTab: {
        flex: 1,
        paddingVertical: 9,
        alignItems: 'center',
        borderRadius: 8,
    },
    sellSubTabActive: {
        backgroundColor: '#07163B',
    },
    sellSubTabText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    sellSubTabTextActive: {
        color: '#FFFFFF',
        fontFamily: Fonts.semiBold,
    },

    // Sell Bottom Button
    sellBottomBtn: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
    },
    sellBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    sellBtnText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default MarketplaceScreen;
