import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const CarDetailScreen = ({ navigation, route }) => {
    const [activeTab, setActiveTab] = useState(0);
    const TABS = ['Reviews', 'Vehicle Info', 'Recent Trips'];

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Car Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Car Image */}
                <View style={styles.carBanner}>
                    <View style={styles.carImagePlaceholder}>
                        <Icon name="car" size={64} color="rgba(255,255,255,0.3)" />
                    </View>
                    <View style={styles.imageBadge}>
                        <Icon name="camera" size={12} color="#FFFFFF" />
                        <Text style={styles.imageBadgeText}>1/8</Text>
                    </View>
                </View>

                <View style={styles.body}>

                    {/* Title + Price */}
                    <View style={styles.titleRow}>
                        <View>
                            <Text style={styles.carTitle}>Toyota Corolla Altis</Text>
                            <Text style={styles.carLocation}>Lahore, Punjab</Text>
                        </View>
                        <Text style={styles.carPrice}>PKR 25,000</Text>
                    </View>

                    {/* Specs Row */}
                    <View style={styles.specsCard}>
                        {[
                            { label: 'Mileage', value: '12,500 km' },
                            { label: 'Model Year', value: '2023' },
                            { label: 'Fuel Type', value: 'Petrol' },
                            { label: 'Drive-Type', value: 'Automatic' },
                        ].map((spec, i) => (
                            <View key={i} style={[styles.specItem, i < 3 && styles.specBorder]}>
                                <Text style={styles.specValue}>{spec.value}</Text>
                                <Text style={styles.specLabel}>{spec.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descText}>
                            Lorem ipsum dolor sit amet consectetur. Fusce senectus ut diam purus. Arcu porttitor vel risus libero sapien eu. Tempor pulvinar porta senectus aliquam est nisl fringilla adipiscing dignissim. Accumsan consequat felis sollicitudin turpis at nulla vitae.
                        </Text>
                        <View style={styles.bulletList}>
                            {['This is the', 'kind of look', 'you get when', 'you add bullet points in the description'].map((b, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.bulletText}>{b}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Seller Info */}
                    <View style={styles.sellerCard}>
                        <Text style={styles.sectionTitle}>Seller Info</Text>
                        <View style={styles.sellerRow}>
                            <View style={styles.sellerAvatar}>
                                <Icon name="account" size={22} color="#CCCCCC" />
                            </View>
                            <Text style={styles.sellerName}>Amir Shehzad</Text>
                            <TouchableOpacity
                                style={styles.viewProfileBtn}
                                onPress={() => navigation.navigate('SellerProfile')}
                            >
                                <Text style={styles.viewProfileText}>View Seller Profile</Text>
                                <Icon name="arrow-top-right" size={14} color="#1D6AFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Report */}
                    <TouchableOpacity style={styles.reportBtn}>
                        <Icon name="flag-outline" size={16} color="#D83F54" />
                        <Text style={styles.reportText}>Report This Ad</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomBtns}>
                <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('ChatDetail', {})}>
                    <Icon name="message-outline" size={18} color="#07163B" />
                    <Text style={styles.chatBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtn}>
                    <Icon name="phone" size={18} color="#111111" />
                    <Text style={styles.callBtnText}>Call Seller</Text>
                </TouchableOpacity>
            </View>
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
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    carBanner: {
        height: 220,
        backgroundColor: '#1A1A2E',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    carImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    imageBadge: {
        position: 'absolute', top: 14, left: 14,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    },
    imageBadgeText: { fontSize: 11, fontFamily: Fonts.medium, color: '#FFFFFF' },

    body: { padding: 16 },

    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    carTitle: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 3 },
    carLocation: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62' },
    carPrice: { fontSize: 20, fontFamily: Fonts.bold, color: '#07163B' },

    specsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        flexDirection: 'row',
        marginBottom: 14,
        overflow: 'hidden',
    },
    specItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
    },
    specBorder: {
        borderRightWidth: 1,
        borderRightColor: '#EAEDEE',
    },
    specValue: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 3 },
    specLabel: { fontSize: 11, fontFamily: Fonts.regular, color: '#5D5F62' },

    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 10 },
    descText: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 20, marginBottom: 10 },
    bulletList: { gap: 5 },
    bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5D5F62' },
    bulletText: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62' },

    sellerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 14,
    },
    sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sellerAvatar: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center',
    },
    sellerName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', flex: 1 },
    viewProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    viewProfileText: { fontSize: 12, fontFamily: Fonts.medium, color: '#1D6AFF' },

    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
    },
    reportText: { fontSize: 13, fontFamily: Fonts.medium, color: '#D83F54' },

    bottomBtns: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    chatBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: '#EAEDEE',
    },
    chatBtnText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    callBtn: {
        flex: 1.5, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12,
        backgroundColor: '#FFD400',
    },
    callBtnText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default CarDetailScreen;
