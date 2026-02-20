import React from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const CARS = [
    { id: '1', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'New' },
    { id: '2', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'Used' },
    { id: '3', title: 'Toyota Thundra SE - 2019', price: '25 Lacs', negotiable: true, year: '2021', km: '42,000 km', city: 'Lahore', transmission: 'Automatic', condition: 'Used' },
];

const SellerProfileScreen = ({ navigation }) => (
    <View style={styles.root}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={24} color="#07163B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Seller Profile</Text>
            <View style={{ width: 24 }} />
        </View>

        <FlatList
            data={CARS}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ListHeaderComponent={() => (
                <View>
                    {/* Seller Info */}
                    <View style={styles.sellerInfoCard}>
                        <View style={styles.sellerTopRow}>
                            <View style={styles.sellerAvatar}>
                                <Icon name="account" size={28} color="#CCCCCC" />
                            </View>
                            <View style={styles.sellerDetails}>
                                <Text style={styles.sellerName}>Amir Shehzad</Text>
                                <Text style={styles.sellerLocation}>Lahore, Punjab</Text>
                                <Text style={styles.memberSince}>Member Since: <Text style={styles.memberDate}>Jan, 2025</Text></Text>
                            </View>
                            <View style={styles.sellerActions}>
                                <TouchableOpacity style={styles.actionIconBtn}>
                                    <Icon name="message-outline" size={18} color="#5D5F62" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionIconBtnYellow}>
                                    <Icon name="phone" size={18} color="#111111" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.postedAdsTitle}>Posted Ads (24)</Text>
                </View>
            )}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.carCard}
                    onPress={() => navigation.navigate('CarDetail', { car: item })}
                    activeOpacity={0.85}
                >
                    <View style={styles.carImageBox}>
                        <View style={styles.carImagePlaceholder}>
                            <Icon name="car" size={28} color="rgba(255,255,255,0.4)" />
                        </View>
                        <View style={styles.conditionBadge}>
                            <Text style={[styles.conditionText, { color: item.condition === 'New' ? '#109F2A' : '#5D5F62' }]}>
                                {item.condition}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.heartBtn}>
                            <Icon name="heart-outline" size={14} color="#5D5F62" />
                        </TouchableOpacity>
                    </View>
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
            )}
        />
    </View>
);

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    sellerInfoCard: {
        backgroundColor: '#FFFFFF',
        margin: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', padding: 16,
    },
    sellerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sellerAvatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center',
    },
    sellerDetails: { flex: 1 },
    sellerName: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 2 },
    sellerLocation: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', marginBottom: 3 },
    memberSince: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    memberDate: { fontFamily: Fonts.semiBold, color: '#202223' },
    sellerActions: { flexDirection: 'row', gap: 8 },
    actionIconBtn: {
        width: 38, height: 38, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    actionIconBtnYellow: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center',
    },

    postedAdsTitle: {
        fontSize: 16, fontFamily: Fonts.semiBold,
        color: '#07163B', paddingHorizontal: 16, marginBottom: 10,
    },

    carCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE',
        marginHorizontal: 16, marginBottom: 12,
        flexDirection: 'row', overflow: 'hidden',
        elevation: 1,
    },
    carImageBox: { width: 110, height: 100, backgroundColor: '#1A1A2E', position: 'relative' },
    carImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    conditionBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: '#FFFFFF', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    conditionText: { fontSize: 10, fontFamily: Fonts.semiBold },
    heartBtn: {
        position: 'absolute', top: 8, right: 8,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    },
    carInfo: { flex: 1, padding: 12 },
    carTitle: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 3 },
    carPrice: { fontSize: 16, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 2 },
    negotiable: { fontSize: 11, fontFamily: Fonts.medium, color: '#1D6AFF', marginBottom: 6 },
    carMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 3 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 11, fontFamily: Fonts.regular, color: '#5D5F62' },
});

export default SellerProfileScreen;
