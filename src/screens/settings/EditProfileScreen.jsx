import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import Input from '../../components/Input';

const SectionHeader = ({ icon, title }) => (
    <View style={styles.sectionHeader}>
        <Icon name={icon} size={18} color="#07163B" />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const EditProfileScreen = ({ navigation }) => {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        dob: '',
        gender: '',
        nationalId: '',
        bloodGroup: '',
        emergencyContact: '',
        contactRelation: '',
        address: '',
    });

    const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

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

                {/* Avatar Upload */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity style={styles.avatarUpload} activeOpacity={0.8}>
                        <Icon name="image-plus" size={36} color="#AAAAAA" />
                    </TouchableOpacity>
                </View>

                {/* Basic Details */}
                <View style={styles.formSection}>
                    <SectionHeader icon="card-account-details-outline" title="Basic Details" />

                    <Input
                        placeholder="Full Name"
                        value={form.fullName}
                        onChangeText={v => update('fullName', v)}
                        style={styles.inputSpacing}
                    />
                    <Input
                        placeholder="Email Address"
                        value={form.email}
                        onChangeText={v => update('email', v)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.inputSpacing}
                    />
                    <Input
                        placeholder="Phone Number"
                        value={form.phone}
                        onChangeText={v => update('phone', v)}
                        keyboardType="phone-pad"
                        style={styles.inputSpacing}
                    />

                    {/* Location with icon */}
                    <View style={styles.inputWithIcon}>
                        <Input
                            placeholder="Current Location"
                            value={form.location}
                            onChangeText={v => update('location', v)}
                            style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }}
                        />
                        <View style={styles.inputIconBox}>
                            <Icon name="crosshairs-gps" size={18} color="#5D5F62" />
                        </View>
                    </View>

                    {/* DOB with icon */}
                    <View style={styles.inputWithIcon}>
                        <Input
                            placeholder="Date of Birth"
                            value={form.dob}
                            onChangeText={v => update('dob', v)}
                            style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }}
                        />
                        <View style={styles.inputIconBox}>
                            <Icon name="calendar-outline" size={18} color="#5D5F62" />
                        </View>
                    </View>

                    {/* Gender Dropdown */}
                    <TouchableOpacity style={styles.dropdownBox}>
                        <Text style={styles.dropdownText}>{form.gender || 'Gender'}</Text>
                        <Icon name="chevron-down" size={20} color="#5D5F62" />
                    </TouchableOpacity>

                    <Input
                        placeholder="National ID"
                        value={form.nationalId}
                        onChangeText={v => update('nationalId', v)}
                        style={styles.inputSpacing}
                    />

                    {/* Blood Group Dropdown */}
                    <TouchableOpacity style={[styles.dropdownBox, { marginBottom: 0 }]}>
                        <Text style={styles.dropdownText}>{form.bloodGroup || 'Blood Group'}</Text>
                        <Icon name="chevron-down" size={20} color="#5D5F62" />
                    </TouchableOpacity>
                </View>

                {/* Contact Information */}
                <View style={styles.formSection}>
                    <SectionHeader icon="phone-outline" title="Contact Information" />

                    <Input
                        placeholder="Emergency Contact"
                        value={form.emergencyContact}
                        onChangeText={v => update('emergencyContact', v)}
                        keyboardType="phone-pad"
                        style={styles.inputSpacing}
                    />
                    <Input
                        placeholder="Contact Relation"
                        value={form.contactRelation}
                        onChangeText={v => update('contactRelation', v)}
                        style={styles.inputSpacing}
                    />
                    <Input
                        placeholder="Address"
                        value={form.address}
                        onChangeText={v => update('address', v)}
                        multiline
                        numberOfLines={3}
                        style={[styles.inputSpacing, { marginBottom: 0 }]}
                    />
                </View>

            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomBtns}>
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.saveText}>Save Changes</Text>
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
    },
    avatarUpload: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#DDDDDD',
        borderStyle: 'dashed',
    },

    // Form
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        marginHorizontal: 16,
        marginBottom: 14,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    inputSpacing: {
        marginBottom: 12,
    },

    // Input with icon
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    inputIconBox: {
        height: 50,
        width: 48,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderLeftWidth: 0,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Dropdown
    dropdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },
    dropdownText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
    },

    // Bottom Buttons
    bottomBtns: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#EF4444',
    },
    saveBtn: {
        flex: 1.4,
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    saveText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default EditProfileScreen;
