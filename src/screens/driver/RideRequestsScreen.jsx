import React, {useState} from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, Switch, Modal, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import Sidebar from "../../components/Sidebar";

const TABS = [
    {key: 'Accepted', count: 2},
    {key: 'Pending', count: 1},
    {key: 'Archived', count: 5},
];

const REQUESTS = {
    Accepted: [
        {
            id: '1',
            name: 'Amir Shehzad',
            rating: 4.9,
            rides: 120,
            price: 'Rs. 2500',
            seats: 2,
            from: 'Valencia Housing Society, Defence Road, Lahore',
            to: 'Dulha House, City Center, Satellite Town, Islamabad',
            date: 'Jan 12, 2025 - Wednesday - 6:00 pm',
            tags: ['Shared', 'Cash'],
            posted: 'Posted 2 Hours Ago'
        },
        {
            id: '2',
            name: 'Amir Shehzad',
            rating: 4.9,
            rides: 120,
            price: 'Rs. 2500',
            seats: 2,
            from: 'Lahore, Pakistan',
            to: 'Islamabad, Pakistan',
            date: 'Jan 12, 2025 - Wednesday - 6:00 pm',
            tags: ['Shared', 'Cash'],
            posted: 'Posted 2 Hours Ago'
        },
    ],
    Pending: [
        {
            id: '3',
            name: 'Amir Shehzad',
            rating: 4.9,
            rides: 120,
            price: 'Rs. 2500',
            seats: 2,
            from: 'Valencia Housing Society, Defence Road, Lahore',
            to: 'Dulha House, City Center, Satellite Town, Islamabad',
            date: 'Jan 12, 2025 - Wednesday - 6:00 pm',
            tags: ['Shared', 'Cash'],
            posted: 'Posted 2 Hours Ago'
        },
    ],
    Archived: [],
};

const MY_ORDERS = [
    {
        id: 'o1',
        name: 'Kubra Malik',
        rating: 4.5,
        rides: 85,
        price: 'Rs. 1800',
        seats: 1,
        from: 'DHA Phase 5, Lahore',
        to: 'Bahria Town, Islamabad',
        date: 'Jan 10, 2025 - Monday - 8:00 am',
        tags: ['Private', 'Online'],
        posted: 'Posted 5 Hours Ago'
    },
    {
        id: 'o2',
        name: 'Hassan Raza',
        rating: 4.7,
        rides: 200,
        price: 'Rs. 3200',
        seats: 3,
        from: 'Gulberg III, Lahore',
        to: 'F-10 Markaz, Islamabad',
        date: 'Jan 9, 2025 - Sunday - 7:00 pm',
        tags: ['Shared', 'Cash'],
        posted: 'Posted 1 Day Ago'
    },
];

const RideRequestsScreen = ({navigation}) => {
    const [activeSection, setActiveSection] = useState('requests'); // 'requests' | 'orders'
    const [activeTab, setActiveTab] = useState('Accepted');
    const [notify, setNotify] = useState(false);
    const [offerModal, setOfferModal] = useState(false);
    const [dateTime, setDateTime] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);


    const currentData = activeSection === 'requests'
        ? (REQUESTS[activeTab] || [])
        : MY_ORDERS;

    const renderCard = ({item}) => {
        const isAccepted = activeTab === 'Accepted' && activeSection === 'requests';

        return (
            <View style={styles.requestCard}>
                {/* Driver Row */}
                <View style={styles.driverRow}>
                    <View style={styles.avatar}>
                        <Icon name="account" size={22} color="#CCCCCC"/>
                    </View>
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>{item.name}</Text>
                        <View style={styles.ratingRow}>
                            <Icon name="star" size={12} color="#F5A247"/>
                            <Text style={styles.ratingText}>{item.rating} ({item.rides} Rides)</Text>
                        </View>
                    </View>
                    <View style={styles.priceCol}>
                        <Text style={styles.offerPrice}>{item.price}</Text>
                        <Text style={styles.offerSeats}>{item.seats} Seats</Text>
                    </View>
                </View>

                {/* Route */}
                <View style={styles.infoRow}>
                    <Icon name="map-marker-outline" size={14} color="#5D5F62"/>
                    <Text style={styles.infoText}>{item.from}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="map-marker-check-outline" size={14} color="#5D5F62"/>
                    <Text style={styles.infoText}>{item.to}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="calendar-outline" size={14} color="#5D5F62"/>
                    <Text style={styles.infoText}>{item.date}</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                    {item.tags.map((tag, i) => (
                        <React.Fragment key={tag}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                            <Icon name="circle-small" size={14} color="#CCCCCC"/>
                        </React.Fragment>
                    ))}
                    <Text style={styles.postedText}>{item.posted}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    {isAccepted ? (
                        <>
                            <TouchableOpacity style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.chatBtn}>
                                <Icon name="message-outline" size={14} color="#5D5F62"/>
                                <Text style={styles.chatBtnText}>Chat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.callBtn}>
                                <Icon name="phone" size={14} color="#111111"/>
                                <Text style={styles.callBtnText}>Call</Text>
                            </TouchableOpacity>
                        </>
                    ) : activeSection === 'orders' ? (
                        <>
                            <TouchableOpacity style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.chatBtn}>
                                <Icon name="message-outline" size={14} color="#5D5F62"/>
                                <Text style={styles.chatBtnText}>Chat</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.callBtn}>
                                <Icon name="phone" size={14} color="#111111"/>
                                <Text style={styles.callBtnText}>Call</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.declineBtn}>
                                <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sendOfferBtn} onPress={() => setOfferModal(true)}>
                                <Text style={styles.sendOfferText}>Send Offer</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                    <Icon name="menu" size={24} color="#07163B" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Ride Requests</Text>
                <TouchableOpacity>
                    <Icon name="bell-outline" size={24} color="#07163B"/>
                </TouchableOpacity>
            </View>

            {/* Search Section - only for requests */}
            {activeSection === 'requests' && (
                <View style={styles.searchSection}>
                    {/* From Input */}
                    <View style={styles.searchInput}>
                        <Text style={styles.searchInputText}>Lahore</Text>
                        <Icon name="crosshairs-gps" size={17} color="#9E9E9E"/>
                    </View>

                    {/* To Input */}
                    <View style={styles.searchInput}>
                        <Text style={styles.searchInputText}>Islamabad</Text>
                        <Icon name="crosshairs-gps" size={17} color="#9E9E9E"/>
                    </View>

                    {/* Date + Search Row */}
                    <View style={styles.dateSearchRow}>
                        <View style={[styles.searchInput, {flex: 1}]}>
                            <Text style={styles.searchInputPlaceholder}>Date</Text>
                            <Icon name="calendar-outline" size={17} color="#9E9E9E"/>
                        </View>
                        <TouchableOpacity style={styles.searchBtn}>
                            <Text style={styles.searchBtnText}>Search</Text>
                            <Icon name="magnify" size={17} color="#111111"/>
                        </TouchableOpacity>
                    </View>

                    {/* Notify Toggle */}
                    <View style={styles.notifyRow}>
                        <Text style={styles.notifyText}>Notify me about new requests</Text>
                        <Switch
                            value={notify}
                            onValueChange={setNotify}
                            trackColor={{false: '#E0E0E0', true: '#FFD400'}}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E0E0E0"
                            style={{transform: [{scaleX: 0.85}, {scaleY: 0.85}]}}
                        />
                    </View>
                </View>
            )}

            {/* Tabs - only for requests */}
            {activeSection !== 'requests' && (
                <View style={styles.tabsRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.key} ({tab.count})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* My Orders Header */}
            {activeSection === 'orders' && (
                <View style={styles.ordersHeader}>
                    <Text style={styles.ordersHeaderTitle}>My Orders</Text>
                </View>
            )}

            {/* List */}
            <FlatList
                data={currentData}
                keyExtractor={item => item.id}
                renderItem={renderCard}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon name="car-off" size={48} color="#DDDDDD" />
                        <Text style={styles.emptyText}>
                            {activeSection === 'orders' ? 'No orders found' : `No ${activeTab.toLowerCase()} requests`}
                        </Text>
                    </View>
                }
            />

            {/* Bottom Switcher */}
            <View style={styles.bottomSwitcher}>
                <TouchableOpacity
                    style={[styles.switcherBtn, activeSection === 'requests' && styles.switcherBtnActive]}
                    onPress={() => setActiveSection('requests')}
                >
                    <Text style={[styles.switcherText, activeSection === 'requests' && styles.switcherTextActive]}>
                        Ride Requests
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.switcherBtn, activeSection === 'orders' && styles.switcherBtnActive]}
                    onPress={() => setActiveSection('orders')}
                >
                    <Text style={[styles.switcherText, activeSection === 'orders' && styles.switcherTextActive]}>
                        My Orders
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Send Offer Modal */}
            <Modal visible={offerModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHandle}/>
                        <Text style={styles.modalTitle}>Offer Ride</Text>
                        <Text style={styles.modalBody}>
                            M. Arif has offered <Text style={styles.modalBold}>Rs. 2500</Text> for this trip. You can
                            offer a different date for this ride.
                        </Text>
                        <View style={styles.modalInput}>
                            <TextInput
                                placeholder="Date & Time"
                                placeholderTextColor="#AAAAAA"
                                value={dateTime}
                                onChangeText={setDateTime}
                                style={styles.modalInputText}
                            />
                            <Icon name="calendar-outline" size={18} color="#5D5F62"/>
                        </View>
                        <TouchableOpacity style={styles.sendOfferModalBtn} onPress={() => setOfferModal(false)}>
                            <Text style={styles.sendOfferModalText}>Send Offer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


            <Sidebar
                visible={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                navigation={navigation}
                activeRoute="Rides"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F5F5F7'},

    // Header
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

    // Search Section
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
        gap: 10,
    },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    searchInputText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#202223',
    },
    searchInputPlaceholder: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
    },
    dateSearchRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFD400',
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    searchBtnText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
    notifyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 2,
    },
    notifyText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#202223',
    },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    tab: {
        flex: 1,
        paddingVertical: 13,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#07163B',
    },
    tabText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#AAAAAA',
    },
    tabTextActive: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },

    // My Orders Header
    ordersHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    ordersHeaderTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        textAlign: 'center',
    },

    list: {padding: 16, paddingBottom: 100},

    // Request Card
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    driverRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#EEEEEE',
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    driverInfo: {flex: 1},
    driverName: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 3},
    ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
    ratingText: {fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62'},
    priceCol: {alignItems: 'flex-end'},
    offerPrice: {fontSize: 15, fontFamily: Fonts.bold, color: '#202223'},
    offerSeats: {fontSize: 12, fontFamily: Fonts.medium, color: '#109F2A'},

    infoRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginBottom: 6},
    infoText: {fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', flex: 1, lineHeight: 17},

    tagsRow: {
        flexDirection: 'row', alignItems: 'center',
        flexWrap: 'wrap', gap: 2,
        marginTop: 4, marginBottom: 12,
    },
    tag: {
        borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    },
    tagText: {fontSize: 11, fontFamily: Fonts.regular, color: '#5D5F62'},
    postedText: {fontSize: 11, fontFamily: Fonts.regular, color: '#AAAAAA'},

    actionRow: {
        flexDirection: 'row', gap: 10,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    cancelBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#D83F54', alignItems: 'center',
    },
    cancelText: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54'},
    chatBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 5,
        paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
    },
    chatBtnText: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62'},
    callBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 5,
        paddingVertical: 10, borderRadius: 10,
        backgroundColor: '#FFD400',
    },
    callBtnText: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111'},
    declineBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D83F54',
        backgroundColor: '#F04B4B0F',
        alignItems: 'center',
    },
    declineText: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54'},
    sendOfferBtn: {
        flex: 1.5, paddingVertical: 10, borderRadius: 10,
        backgroundColor: '#FFD400', alignItems: 'center',
    },
    sendOfferText: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111'},

    emptyState: {alignItems: 'center', paddingTop: 60, gap: 12},
    emptyText: {fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA'},

    // Bottom Switcher
    bottomSwitcher: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24,
    },
    switcherBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center',
    },
    switcherBtnActive: {
        backgroundColor: '#FFD400',
        borderColor: '#FFD400',
    },
    switcherText: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62'},
    switcherTextActive: {color: '#111111'},

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40,
    },
    modalHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: {fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 10},
    modalBody: {fontSize: 14, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 22, marginBottom: 20},
    modalBold: {fontFamily: Fonts.semiBold, color: '#202223'},
    modalInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 10, paddingHorizontal: 14,
        paddingVertical: 13, marginBottom: 16,
    },
    modalInputText: {flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223'},
    sendOfferModalBtn: {
        backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    },
    sendOfferModalText: {fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111'},
});

export default RideRequestsScreen;
