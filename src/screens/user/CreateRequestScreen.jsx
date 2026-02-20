import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, Modal, FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import Input from '../../components/Input';

const RIDE_TYPES = [
    { id: 'private', label: 'Private', emoji: '🚗' },
    { id: 'shared', label: 'Shared', emoji: '👧' },
    { id: 'courier', label: 'Courier', emoji: '📦' },
];

const SEAT_OPTIONS = ['1', '2', '3', '4'];
const MORE_OPTIONS = ['5', '6', '7', '8', '9', '10'];
const POPULAR_CITIES = ['Islamabad', 'Faisalabad', 'Karachi', 'Sargodhi'];

const CreateRequestScreen = ({ navigation }) => {
    const [rideType, setRideType] = useState('private');
    const [from, setFrom] = useState('Lahore');
    const [to, setTo] = useState('Islamabad');
    const [seats, setSeats] = useState('1');
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Request</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.body}>

                    {/* Main Card */}
                    <View style={styles.mainCard}>

                        {/* Ride Type */}
                        <View style={styles.rideTypeRow}>
                            {RIDE_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[styles.rideTypeBtn, rideType === type.id && styles.rideTypeBtnActive]}
                                    onPress={() => setRideType(type.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.rideTypeEmoji}>{type.emoji}</Text>
                                    <Text style={[styles.rideTypeText, rideType === type.id && styles.rideTypeTextActive]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* From Input */}
                        <View style={styles.inputWrapper}>
                            <Input
                                placeholder="From"
                                value={from}
                                onChangeText={setFrom}
                                placeholderTextColor="#AAAAAA"
                                style={styles.inputBox}
                            />
                            <TouchableOpacity style={styles.inputRightIcon}>
                                <Icon name="crosshairs-gps" size={18} color="#9E9E9E" />
                            </TouchableOpacity>
                        </View>

                        {/* To Input */}
                        <View style={styles.inputWrapper}>
                            <Input
                                placeholder="To"
                                value={to}
                                onChangeText={setTo}
                                placeholderTextColor="#AAAAAA"
                                style={styles.inputBox}
                            />
                            <TouchableOpacity style={styles.inputRightIcon}>
                                <Icon name="crosshairs-gps" size={18} color="#9E9E9E" />
                            </TouchableOpacity>
                        </View>

                        {/* Popular Cities */}
                        <View style={styles.chipsRow}>
                            {POPULAR_CITIES.map(city => (
                                <TouchableOpacity
                                    key={city}
                                    style={[styles.chip, to === city && styles.chipActive]}
                                    onPress={() => setTo(city)}
                                >
                                    <Text style={[styles.chipText, to === city && styles.chipTextActive]}>
                                        {city}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date & Time */}
                        <View style={styles.inputWrapper}>
                            <Input
                                placeholder="Date & Time"
                                placeholderTextColor="#AAAAAA"
                                style={styles.inputBox}
                                editable={false}
                            />
                            <TouchableOpacity style={styles.inputRightIcon}>
                                <Icon name="calendar-outline" size={18} color="#9E9E9E" />
                            </TouchableOpacity>
                        </View>

                        {/* Seats Required */}
                        <Text style={styles.label}>Seats Required</Text>
                        <View style={styles.seatsRow}>
                            {/* Seat 1 with person icon */}
                            <TouchableOpacity
                                style={[styles.seatBtn, seats === '1' && styles.seatBtnActive]}
                                onPress={() => setSeats('1')}
                            >
                                <Icon name="account" size={13} color={seats === '1' ? '#07163B' : '#5D5F62'} />
                                <Text style={[styles.seatText, seats === '1' && styles.seatTextActive]}>1</Text>
                            </TouchableOpacity>

                            {SEAT_OPTIONS.slice(1).map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.seatBtn, seats === s && styles.seatBtnActive]}
                                    onPress={() => setSeats(s)}
                                >
                                    <Text style={[styles.seatText, seats === s && styles.seatTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}

                            {/* More Dropdown */}
                            <View style={styles.moreWrapper}>
                                <TouchableOpacity
                                    style={[
                                        styles.seatBtn,
                                        styles.moreBtn,
                                        MORE_OPTIONS.includes(seats) && styles.seatBtnActive,
                                    ]}
                                    onPress={() => setShowMoreDropdown(!showMoreDropdown)}
                                >
                                    <Text style={[
                                        styles.seatText,
                                        MORE_OPTIONS.includes(seats) && styles.seatTextActive,
                                    ]}>
                                        {MORE_OPTIONS.includes(seats) ? seats : 'More'}
                                    </Text>
                                    <Icon
                                        name={showMoreDropdown ? 'chevron-up' : 'chevron-down'}
                                        size={14}
                                        color={MORE_OPTIONS.includes(seats) ? '#07163B' : '#5D5F62'}
                                    />
                                </TouchableOpacity>

                                {/* Dropdown */}
                                {showMoreDropdown && (
                                    <View style={styles.dropdown}>
                                        {MORE_OPTIONS.map(opt => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.dropdownItem, seats === opt && styles.dropdownItemActive]}
                                                onPress={() => { setSeats(opt); setShowMoreDropdown(false); }}
                                            >
                                                <Text style={[styles.dropdownText, seats === opt && styles.dropdownTextActive]}>
                                                    {opt}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Optimal Fare */}
                        <View style={styles.fareCard}>
                            <Text style={styles.fareLabel}>Optimal Fare</Text>
                            <Text style={styles.fareAmount}>PKR 2,450</Text>
                        </View>

                    </View>
                </View>
            </ScrollView>

            {/* Create Request Button */}
            <View style={styles.bottomBtn}>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => navigation.navigate('RideOffers')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.createBtnText}>Create Request</Text>
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
    headerTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    body: {
        padding: 16,
    },

    // Main Card
    mainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        gap: 12,
    },

    // Ride Type
    rideTypeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    rideTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D7DBDE',
        backgroundColor: '#FFFFFF',
    },
    rideTypeBtnActive: {
        backgroundColor: 'rgba(245,214,50,0.12)',
        borderColor: 'rgba(245,214,50,0.6)',
    },
    rideTypeEmoji: {
        fontSize: 16,
    },
    rideTypeText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    rideTypeTextActive: {
        color: '#07163B',
        fontFamily: Fonts.semiBold,
    },

    // Input
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D7DBDE',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    inputBox: {
        flex: 1,
        borderWidth: 0,
        borderRadius: 0,
    },
    inputRightIcon: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },

    // Chips
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D7DBDE',
        backgroundColor: '#FFFFFF',
    },
    chipActive: {
        backgroundColor: 'rgba(245,214,50,0.12)',
        borderColor: 'rgba(245,214,50,0.6)',
    },
    chipText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    chipTextActive: {
        color: '#07163B',
        fontFamily: Fonts.medium,
    },

    // Label
    label: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 2,
    },

    // Seats
    seatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    seatBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D7DBDE',
        backgroundColor: '#FFFFFF',
    },
    seatBtnActive: {
        backgroundColor: 'rgba(245,214,50,0.12)',
        borderColor: 'rgba(245,214,50,0.6)',
    },
    moreBtn: {
        paddingHorizontal: 12,
    },
    seatText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    seatTextActive: {
        color: '#07163B',
        fontFamily: Fonts.semiBold,
    },

    // More Dropdown
    moreWrapper: {
        position: 'relative',
    },
    dropdown: {
        position: 'absolute',
        top: 42,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        zIndex: 100,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        minWidth: 70,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 11,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    dropdownItemActive: {
        backgroundColor: 'rgba(245,214,50,0.12)',
    },
    dropdownText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    dropdownTextActive: {
        color: '#07163B',
        fontFamily: Fonts.semiBold,
    },

    // Fare Card
    fareCard: {
        borderWidth: 1,
        borderColor: 'rgba(245,214,50,0.6)',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        backgroundColor: 'rgba(245,214,50,0.06)',
    },
    fareLabel: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        marginBottom: 6,
    },
    fareAmount: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: '#07163B',
    },

    // Bottom
    bottomBtn: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
    },
    createBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    createBtnText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default CreateRequestScreen;
