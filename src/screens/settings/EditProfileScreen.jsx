import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, Image, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Fonts from '../../constants/fonts';
import config from '../../config';
import Input from '../../components/Input';
import useUserStore from '../../store/userStore';
import { useMe } from '../../hooks/useMe';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';

const FILE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/');
const fileUrl = (path) => (path ? `${FILE_BASE}storage/${path}` : null);
const GENDERS = ['male', 'female', 'other'];

const SectionHeader = ({ icon, title }) => (
    <View style={styles.sectionHeader}>
        <Icon name={icon} size={18} color="#07163B" />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const EditProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const storeUser = useUserStore(s => s.user);
    const { data: freshUser } = useMe();
    const user = freshUser || storeUser || {};
    const isDriver = user.user_type === 'driver';
    const p = user.profile || {};

    const [fullName, setFullName] = useState(`${user.first_name || ''} ${user.last_name || ''}`.trim());
    const [city, setCity] = useState(p.city || '');
    const [dob, setDob] = useState(p.dob || '');
    const [gender, setGender] = useState(p.gender || '');
    const [address, setAddress] = useState(p.address || '');
    const [bio, setBio] = useState(p.bio || '');
    const [photo, setPhoto] = useState(null); // newly picked image (riders only)
    const [showDate, setShowDate] = useState(false);

    const currentImage = photo?.uri || fileUrl(p.profile_image);

    const pickPhoto = async () => {
        if (isDriver) return;
        const { launchImageLibrary } = require('react-native-image-picker');
        const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
        const asset = res?.assets?.[0];
        if (asset?.uri) setPhoto({ uri: asset.uri, name: asset.fileName || 'photo.jpg', type: asset.type || 'image/jpeg' });
    };

    const updateProfile = useUpdateProfile({
        onSuccess: () => { Toast.show({ type: 'success', text1: 'Profile updated' }); navigation.goBack(); },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const onSave = () => {
        if (!fullName.trim()) { Toast.show({ type: 'error', text1: 'Name is required' }); return; }
        const [first, ...rest] = fullName.trim().split(' ');
        const fd = new FormData();
        fd.append('first_name', first);
        fd.append('last_name', rest.join(' '));
        if (city) fd.append('profile[city]', city);
        if (dob) fd.append('profile[dob]', dob);
        if (gender) fd.append('profile[gender]', gender);
        if (address) fd.append('profile[address]', address);
        if (bio) fd.append('profile[bio]', bio);
        if (!isDriver && photo) fd.append('profile[profile_image]', photo);
        updateProfile.mutate(fd);
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled" enableOnAndroid extraScrollHeight={20}>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarUpload}
                        activeOpacity={isDriver ? 1 : 0.8}
                        onPress={pickPhoto}
                    >
                        {currentImage
                            ? <Image source={{ uri: currentImage }} style={styles.avatarImg} />
                            : <Icon name="image-plus" size={36} color="#AAAAAA" />}
                        {!isDriver && (
                            <View style={styles.editBadge}><Icon name="camera" size={13} color="#111111" /></View>
                        )}
                    </TouchableOpacity>
                    {isDriver && <Text style={styles.lockNote}>Photo is locked for verified drivers</Text>}
                </View>

                {/* Basic Details */}
                <View style={styles.formSection}>
                    <SectionHeader icon="card-account-details-outline" title="Basic Details" />

                    <Input placeholder="Full Name" value={fullName} onChangeText={setFullName} style={styles.inputSpacing} />

                    {/* Read-only email + phone */}
                    <View style={[styles.readonly, styles.inputSpacing]}>
                        <Icon name="email-outline" size={16} color="#9AA0A6" />
                        <Text style={styles.readonlyText}>{user.email || '—'}</Text>
                    </View>
                    <View style={[styles.readonly, styles.inputSpacing]}>
                        <Icon name="phone-outline" size={16} color="#9AA0A6" />
                        <Text style={styles.readonlyText}>{user.phone_number || '—'}</Text>
                    </View>

                    <Input placeholder="City" value={city} onChangeText={setCity} style={styles.inputSpacing} />

                    {/* DOB */}
                    <TouchableOpacity style={[styles.dropdownBox, styles.inputSpacing]} onPress={() => setShowDate(true)}>
                        <Text style={[styles.dropdownText, dob && styles.dropdownValue]}>{dob || 'Date of Birth'}</Text>
                        <Icon name="calendar-outline" size={18} color="#5D5F62" />
                    </TouchableOpacity>

                    {/* Gender */}
                    <View style={styles.genderRow}>
                        {GENDERS.map(g => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                                onPress={() => setGender(g)}
                            >
                                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* More */}
                <View style={styles.formSection}>
                    <SectionHeader icon="map-marker-outline" title="Address & Bio" />
                    <Input placeholder="Address" value={address} onChangeText={setAddress} multiline numberOfLines={2} style={styles.inputSpacing} />
                    <Input placeholder="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={3} style={{ marginBottom: 0 }} />
                </View>
            </KeyboardAwareScrollView>

            <DatePicker
                modal
                open={showDate}
                date={dob ? new Date(dob) : new Date(2000, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                locale="en-US"
                theme="light"
                onConfirm={(sel) => {
                    setShowDate(false);
                    const pad = (n) => String(n).padStart(2, '0');
                    setDob(`${sel.getFullYear()}-${pad(sel.getMonth() + 1)}-${pad(sel.getDate())}`);
                }}
                onCancel={() => setShowDate(false)}
            />

            <View style={[styles.bottomBtns, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={onSave}
                    disabled={updateProfile.isPending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.saveText}>{updateProfile.isPending ? 'Saving…' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    avatarUpload: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: '#EEEEEE',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#DDDDDD',
    },
    avatarImg: { width: 90, height: 90, borderRadius: 45 },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF',
    },
    lockNote: { fontSize: 11.5, fontFamily: Fonts.regular, color: '#9AA0A6' },

    formSection: {
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        marginHorizontal: 16, marginBottom: 14, padding: 16,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
    inputSpacing: { marginBottom: 12 },

    readonly: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#EEF0F2', borderRadius: 8,
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#F7F8FA',
    },
    readonlyText: { fontSize: 14, fontFamily: Fonts.regular, color: '#9AA0A6' },

    dropdownBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF',
    },
    dropdownText: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },
    dropdownValue: { color: '#202223' },

    genderRow: { flexDirection: 'row', gap: 8 },
    genderBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0',
        alignItems: 'center', backgroundColor: '#FFFFFF',
    },
    genderBtnActive: { backgroundColor: '#FFF9D6', borderColor: '#FFD400' },
    genderText: { fontSize: 13, fontFamily: Fonts.medium, color: '#5D5F62' },
    genderTextActive: { color: '#111111', fontFamily: Fonts.semiBold },

    bottomBtns: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    cancelText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#EF4444' },
    saveBtn: { flex: 1.4, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    saveText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default EditProfileScreen;
