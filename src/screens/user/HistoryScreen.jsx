import React, {useState} from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const TABS = ['All', 'Top Up', 'Rides', 'Refunds'];

const TRANSACTIONS = [
    {
        id: '1',
        type: 'topup',
        title: 'Wallet Top Up',
        desc: 'Via JazzCash',
        amount: '+PKR 2,000',
        date: 'Jan 12, 2025 · 6:00 pm',
        positive: true
    },
    {
        id: '2',
        type: 'ride',
        title: 'Ride Payment',
        desc: 'Lahore → Islamabad',
        amount: '-PKR 2,500',
        date: 'Jan 11, 2025 · 4:30 pm',
        positive: false
    },
    {
        id: '3',
        type: 'refund',
        title: 'Ride Refund',
        desc: 'Cancelled ride refund',
        amount: '+PKR 1,800',
        date: 'Jan 10, 2025 · 2:00 pm',
        positive: true
    },
    {
        id: '4',
        type: 'ride',
        title: 'Ride Payment',
        desc: 'Lahore → Faisalabad',
        amount: '-PKR 1,200',
        date: 'Jan 9, 2025 · 9:00 am',
        positive: false
    },
    {
        id: '5',
        type: 'topup',
        title: 'Wallet Top Up',
        desc: 'Via Easypaisa',
        amount: '+PKR 5,000',
        date: 'Jan 8, 2025 · 11:00 am',
        positive: true
    },
    {
        id: '6',
        type: 'ride',
        title: 'Ride Payment',
        desc: 'Islamabad → Lahore',
        amount: '-PKR 2,500',
        date: 'Jan 7, 2025 · 7:00 pm',
        positive: false
    },
];

const iconMap = {
    topup: {icon: 'wallet-plus-outline', bg: '#E8F8EE', color: '#109F2A'},
    ride: {icon: 'car-outline', bg: '#FFFBEA', color: '#07163B'},
    refund: {icon: 'refresh', bg: '#EEF2FF', color: '#6C63FF'},
};

const HistoryScreen = ({navigation}) => {
    const [activeTab, setActiveTab] = useState('All');

    const filtered = TRANSACTIONS.filter(t => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Top Up') return t.type === 'topup';
        if (activeTab === 'Rides') return t.type === 'ride';
        if (activeTab === 'Refunds') return t.type === 'refund';
        return true;
    });

    const renderItem = ({item, index}) => {
        const meta = iconMap[item.type];
        return (
            <View style={[styles.txRow, index < filtered.length - 1 && styles.txBorder]}>
                <View style={[styles.txIcon, {backgroundColor: meta.bg}]}>
                    <Icon name={meta.icon} size={20} color={meta.color}/>
                </View>
                <View style={styles.txContent}>
                    <Text style={styles.txTitle}>{item.title}</Text>
                    <Text style={styles.txDesc}>{item.desc}</Text>
                    <Text style={styles.txDate}>{item.date}</Text>
                </View>
                <Text style={[styles.txAmount, {color: item.positive ? '#109F2A' : '#D83F54'}]}>
                    {item.amount}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={{width: 24}}/>
            </View>

            {/* Summary */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, {borderColor: 'rgba(16,159,42,0.3)', backgroundColor: '#E8F8EE'}]}>
                    <Text style={styles.summaryCardLabel}>Total Top Up</Text>
                    <Text style={[styles.summaryCardValue, {color: '#109F2A'}]}>PKR 7,000</Text>
                </View>
                <View style={[styles.summaryCard, {borderColor: 'rgba(216,63,84,0.3)', backgroundColor: '#FFF0F2'}]}>
                    <Text style={styles.summaryCardLabel}>Total Spent</Text>
                    <Text style={[styles.summaryCardValue, {color: '#D83F54'}]}>PKR 6,200</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.filterTabText, activeTab === tab && styles.filterTabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{margin: 16}}
                ListHeaderComponent={<View style={styles.txCard}/>}
                renderItem={renderItem}
                ItemSeparatorComponent={() => null}
                ListFooterComponent={<View style={{height: 16}}/>}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="receipt" size={48} color="#DDDDDD"/>
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
                // wrap all items in card
                ListHeaderComponentStyle={{height: 0}}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F5F5F7'},
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: {fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B'},

    summaryRow: {
        flexDirection: 'row', gap: 12,
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    summaryCard: {
        flex: 1, borderRadius: 14, borderWidth: 1,
        paddingVertical: 14, alignItems: 'center', gap: 4,
    },
    summaryCardLabel: {fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62'},
    summaryCardValue: {fontSize: 17, fontFamily: Fonts.bold},

    filterTabs: {
        flexDirection: 'row', paddingHorizontal: 16,
        gap: 8, marginBottom: 4, marginTop: 8,
    },
    filterTab: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1,
        borderColor: '#EAEDEE', backgroundColor: '#FFFFFF',
    },
    filterTabActive: {
        backgroundColor: '#07163B', borderColor: '#07163B',
    },
    filterTabText: {fontSize: 13, fontFamily: Fonts.medium, color: '#5D5F62'},
    filterTabTextActive: {color: '#FFFFFF', fontFamily: Fonts.semiBold},

    txCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden',
    },
    txRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
    },
    txBorder: {
        borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
        borderRadius: 0,
    },
    txIcon: {
        width: 42, height: 42, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    txContent: {flex: 1},
    txTitle: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 2},
    txDesc: {fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', marginBottom: 2},
    txDate: {fontSize: 11, fontFamily: Fonts.regular, color: '#AAAAAA'},
    txAmount: {fontSize: 14, fontFamily: Fonts.bold},

    emptyState: {alignItems: 'center', paddingTop: 60, gap: 12},
    emptyText: {fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA'},
});

export default HistoryScreen;
