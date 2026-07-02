import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { useCities } from '../../hooks/useLookup';
import useMe from '../../hooks/useMe';
import { useServiceCategories, useServiceProviderMe, useRegisterServiceProvider } from '../../hooks/useServices';
import SelectSheet from '../../components/SelectSheet';
import TopTabs from '../../components/TopTabs';
import ProviderServiceRequestsScreen from './ProviderServiceRequestsScreen';

const STATUS_META = {
    pending:   { label: 'Pending approval', color: '#92600B', bg: '#FFF7ED', icon: 'clock-outline', note: 'Our team is reviewing your application. You’ll be notified once approved.' },
    approved:  { label: 'Approved', color: '#109F2A', bg: '#E8F8EE', icon: 'check-decagram-outline', note: 'You’re approved — you can receive service requests.' },
    rejected:  { label: 'Rejected', color: '#D83F54', bg: '#FFF0F2', icon: 'close-octagon-outline', note: 'Your application was not approved. Contact support for details.' },
    suspended: { label: 'Suspended', color: '#5D5F62', bg: '#F1F2F4', icon: 'pause-octagon-outline', note: 'Your provider account is suspended.' },
};

const ServiceProviderRegisterScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { data: me } = useMe();
    const meQuery = useServiceProviderMe();
    const provider = meQuery.data;
    const [provTab, setProvTab] = useState('requests');

    const catsQuery = useServiceCategories();
    const categories = catsQuery.data || [];

    const [businessName, setBusinessName] = useState('');
    const [selectedCats, setSelectedCats] = useState([]); // category ids
    const [city, setCity] = useState(null);
    const [area, setArea] = useState('');
    const [phone, setPhone] = useState(me?.phone_number || '');
    const [description, setDescription] = useState('');

    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    const toggleCat = (id) =>
        setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    const register = useRegisterServiceProvider({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Submitted', text2: 'Your application is pending approval.' });
            meQuery.refetch();
        },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const validate = () => {
        if (!businessName.trim()) return 'Enter your business / shop name.';
        if (selectedCats.length === 0) return 'Select at least one service category.';
        if (!phone.trim()) return 'Enter a contact phone number.';
        return null;
    };

    const handleSubmit = () => {
        const error = validate();
        if (error) { Toast.show({ type: 'error', text1: 'Required', text2: error }); return; }
        register.mutate({
            business_name: businessName.trim(),
            category_ids: selectedCats,
            city_id: city?.id ?? null,
            area: area.trim() || null,
            phone: phone.trim(),
            description: description.trim() || null,
        });
    };

    const Header = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={24} color="#07163B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Service Provider</Text>
            <View style={styles.headerSpacer} />
        </View>
    );

    // ── Already registered → show status ──
    if (meQuery.isLoading) {
        return (
            <View style={styles.root}><StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" /><Header />
                <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>
            </View>
        );
    }

    // Profile detail card (shared by approved tab + non-approved status view).
    const ProfileDetail = () => {
        const meta = STATUS_META[provider.status] || STATUS_META.pending;
        return (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={[styles.statusCard, { backgroundColor: meta.bg }]}>
                    <Icon name={meta.icon} size={30} color={meta.color} />
                    <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
                    <Text style={styles.statusNote}>{meta.note}</Text>
                </View>

                <Text style={styles.section}>Your Profile</Text>
                <View style={styles.card}>
                    <Text style={styles.bizName}>{provider.business_name}</Text>
                    {!!provider.city?.name && <Text style={styles.bizMeta}>{provider.city.name}{provider.area ? ` · ${provider.area}` : ''}</Text>}
                    <Text style={styles.bizMeta}>{provider.phone}</Text>
                    {!!provider.description && <Text style={styles.bizDesc}>{provider.description}</Text>}
                    <View style={styles.chipsWrap}>
                        {(provider.categories || []).map(c => (
                            <View key={c.id} style={styles.tag}><Text style={styles.tagText}>{c.name}</Text></View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        );
    };

    if (provider) {
        // Approved → land on incoming requests; profile detail lives in its own tab.
        if (provider.status === 'approved') {
            return (
                <View style={styles.root}>
                    <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#07163B" /></TouchableOpacity>
                        <Text style={styles.headerTitle}>{provider.business_name || 'My Services'}</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                    <TopTabs
                        tabs={[{ key: 'requests', label: 'Service Requests' }, { key: 'profile', label: 'My Profile' }]}
                        active={provTab}
                        onChange={setProvTab}
                    />
                    {provTab === 'requests'
                        ? <ProviderServiceRequestsScreen navigation={navigation} embedded />
                        : <ProfileDetail />}
                </View>
            );
        }

        // Pending / rejected / suspended → status + profile only.
        return (
            <View style={styles.root}>
                <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                <Header />
                <ProfileDetail />
            </View>
        );
    }

    // ── Registration form ──
    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <Header />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
            >
                <View style={styles.intro}>
                    <Icon name="tools" size={20} color="#07163B" />
                    <Text style={styles.introText}>Offer car services (mechanic, wash, AC…). Submit your details — our team approves before you go live.</Text>
                </View>

                <Text style={styles.section}>Business</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Business / shop name</Text>
                    <TextInput style={styles.input} placeholder="e.g. Ali Auto Works" placeholderTextColor="#9CA3AF" value={businessName} onChangeText={setBusinessName} />

                    <Text style={styles.label}>Phone</Text>
                    <TextInput style={styles.input} placeholder="03xx-xxxxxxx" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                    <Text style={styles.label}>City <Text style={styles.optional}>(optional)</Text></Text>
                    <TouchableOpacity style={styles.selectBox} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                        <Icon name="map-marker-outline" size={18} color="#9CA3AF" />
                        <Text style={city ? styles.selectVal : styles.selectPH}>{city?.name || 'Select city'}</Text>
                        <Icon name="chevron-down" size={18} color="#9CA3AF" />
                    </TouchableOpacity>

                    <Text style={styles.label}>Area / address <Text style={styles.optional}>(optional)</Text></Text>
                    <TextInput style={styles.input} placeholder="Service area or shop address" placeholderTextColor="#9CA3AF" value={area} onChangeText={setArea} />
                </View>

                <Text style={styles.section}>Services you offer</Text>
                <View style={styles.card}>
                    {catsQuery.isLoading ? (
                        <ActivityIndicator color="#FFD400" />
                    ) : (
                        <View style={styles.chipsWrap}>
                            {categories.map(c => {
                                const on = selectedCats.includes(c.id);
                                return (
                                    <TouchableOpacity key={c.id} style={[styles.catChip, on && styles.catChipOn]} onPress={() => toggleCat(c.id)} activeOpacity={0.8}>
                                        {!!c.icon && <Icon name={c.icon} size={15} color={on ? '#07163B' : '#9CA3AF'} />}
                                        <Text style={[styles.catText, on && styles.catTextOn]}>{c.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <Text style={styles.section}>About <Text style={styles.optional}>(optional)</Text></Text>
                <View style={styles.card}>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell customers about your experience, hours, etc."
                        placeholderTextColor="#9CA3AF"
                        value={description} onChangeText={setDescription}
                        multiline textAlignVertical="top"
                    />
                </View>
            </ScrollView>

            <View style={[styles.bottomBtn, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, register.isPending && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={register.isPending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>{register.isPending ? 'Submitting…' : 'Submit for Approval'}</Text>
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>

            <SelectSheet
                visible={cityOpen}
                onClose={() => setCityOpen(false)}
                title="Select City"
                items={filteredCities}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={city?.id}
                onSelect={(c) => { setCity(c); setCityOpen(false); }}
            />
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
    headerSpacer: { width: 24 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    body: { padding: 16 },
    intro: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,212,0,0.12)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
    },
    introText: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B', lineHeight: 18 },

    section: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62', marginTop: 12, marginBottom: 6, marginLeft: 2 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, gap: 10 },

    label: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 2, marginTop: 4 },
    optional: { fontSize: 12, fontFamily: Fonts.regular, color: '#9CA3AF' },
    input: {
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#FFFFFF',
        fontFamily: Fonts.regular, fontSize: 14, color: '#07163B',
    },
    textArea: { height: 90, paddingTop: 12 },
    selectBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#FFFFFF',
    },
    selectVal: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#07163B' },
    selectPH: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9CA3AF' },

    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF',
    },
    catChipOn: { backgroundColor: 'rgba(255,212,0,0.15)', borderColor: 'rgba(255,212,0,0.7)' },
    catText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    catTextOn: { color: '#07163B', fontFamily: Fonts.semiBold },

    bottomBtn: {
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    submitBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: '#E5E7EB' },
    submitText: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },

    // status view
    statusCard: { alignItems: 'center', gap: 8, borderRadius: 16, padding: 22, marginBottom: 8 },
    statusLabel: { fontSize: 16, fontFamily: Fonts.semiBold },
    statusNote: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62', textAlign: 'center', lineHeight: 18 },
    bizName: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#07163B' },
    bizMeta: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62' },
    bizDesc: { fontSize: 13, fontFamily: Fonts.regular, color: '#3B3E40', lineHeight: 19, marginTop: 2 },
    tag: { backgroundColor: '#F5F5F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    tagText: { fontSize: 12, fontFamily: Fonts.medium, color: '#07163B' },
    requestsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 15 },
    requestsText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default ServiceProviderRegisterScreen;
