import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const ProfileRow = ({ label, value, arrow }) => (
    <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{value}</Text>
            {arrow && <Icon name="chevron-right" size={16} color="#AAAAAA" style={{ marginLeft: 4 }} />}
        </View>
    </View>
);

const ProfileScreen = ({ navigation }) => {
    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarCircle}>
                            <Icon name="account" size={60} color="#CCCCCC" />
                        </View>
                        <View style={styles.editBadge}>
                            <Icon name="pencil" size={12} color="#07163B" />
                        </View>
                    </View>
                    <Text style={styles.profileName}>Amir Shehzad</Text>
                    <View style={styles.ratingRow}>
                        <Icon name="star" size={16} color="#FFD400" />
                        <Text style={styles.ratingText}>4.9 (120 Rides)</Text>
                    </View>
                </View>

                {/* Basic Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="card-account-details-outline" size={18} color="#07163B" />
                        <Text style={styles.cardTitle}>Basic Details</Text>
                    </View>
                    <ProfileRow label="Email Address" value="amirshehzad567@gmail.com" />
                    <ProfileRow label="Phone Number" value="+92 312 8725461" />
                    <ProfileRow label="Current Location" value="Lahore" arrow />
                    <ProfileRow label="Date of Birth" value="01 Jan, 2002" />
                    <ProfileRow label="Gender" value="Male" />
                    <ProfileRow label="National ID" value="518-1938515-538" />
                    <ProfileRow label="Blood Group" value="A+" />
                </View>

                {/* Contact Information Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="phone-outline" size={18} color="#07163B" />
                        <Text style={styles.cardTitle}>Contact Information</Text>
                    </View>
                    <ProfileRow label="Emergency Contact" value="+92 307 8786243" />
                    <ProfileRow label="Contact Relation" value="Father" />
                    <ProfileRow label="Address" value="House N0 64, Block B, Street 4, Valencia Town, LHR" />
                </View>

                {/* Vehicle Information Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="car-outline" size={18} color="#07163B" />
                        <Text style={styles.cardTitle}>Vehicle Information</Text>
                    </View>
                    <ProfileRow label="Vehicle Type" value="Sedan" />
                    <ProfileRow label="Vehicle Model" value="Honda City 2020" />
                    <ProfileRow label="Registration No." value="LHR-1234" />
                    <ProfileRow label="Vehicle Color" value="White" />
                </View>

            </ScrollView>

            {/* Edit Profile Button - Fixed Bottom */}
            <View style={styles.bottomBtn}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProfile')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
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

    // Avatar
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 28,
        backgroundColor: '#F5F5F7',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#E8E8E8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFD400',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ratingText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        marginHorizontal: 16,
        marginBottom: 14,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },

    // Row
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 13,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    rowLabel: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        flex: 1,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1.2,
        justifyContent: 'flex-end',
    },
    rowValue: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#07163B',
        textAlign: 'right',
    },

    // Bottom Button
    bottomBtn: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
    },
    editBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    editBtnText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default ProfileScreen;
