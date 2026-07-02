import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, Switch, Image, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import { useCities, useVehicleMakes, useVehicleModels } from '../../hooks/useLookup';
import SelectSheet from '../../components/SelectSheet';
import BottomSheet from '../../components/BottomSheet';
import driverService from '../../services/driverService';
import useUserStore from '../../store/userStore';
import { useApp } from '../../context/AppContext';

const TOTAL_STEPS = 4;
const UPLOAD_HINT = 'Supported formats: JPG & PNG · Max Size: 2MB';

// ─── Year options (current year → 2000) ──────────────────────────────────────
const _CUR = new Date().getFullYear();
const YEARS = Array.from({ length: _CUR - 2000 + 1 }, (_, i) => {
    const y = _CUR - i;
    return { id: y, name: String(y) };
});

// ─── Car color options ────────────────────────────────────────────────────────
const CAR_COLORS = [
    { id: 'white',     name: 'White',        color: '#FFFFFF' },
    { id: 'black',     name: 'Black',        color: '#1C1C1E' },
    { id: 'silver',    name: 'Silver',       color: '#C0C0C0' },
    { id: 'gray',      name: 'Gray',         color: '#6B7280' },
    { id: 'red',       name: 'Red',          color: '#DC2626' },
    { id: 'blue',      name: 'Blue',         color: '#2563EB' },
    { id: 'navy',      name: 'Navy Blue',    color: '#1E3A8A' },
    { id: 'green',     name: 'Green',        color: '#16A34A' },
    { id: 'maroon',    name: 'Maroon',       color: '#7F1D1D' },
    { id: 'brown',     name: 'Brown',        color: '#78350F' },
    { id: 'beige',     name: 'Beige',        color: '#D4B896' },
    { id: 'orange',    name: 'Orange',       color: '#EA580C' },
    { id: 'yellow',    name: 'Yellow',       color: '#CA8A04' },
    { id: 'gold',      name: 'Gold',         color: '#B45309' },
    { id: 'purple',    name: 'Purple',       color: '#7C3AED' },
    { id: 'pink',      name: 'Pink',         color: '#DB2777' },
    { id: 'pearl',     name: 'Pearl White',  color: '#F0EDE8' },
    { id: 'champagne', name: 'Champagne',    color: '#C9A96E' },
];

// ─── Image helpers ────────────────────────────────────────────────────────────
const IMG_OPTIONS = { mediaType: 'photo', quality: 0.8 };

const captureImage = async (setter) => {
    try {
        const { launchCamera } = require('react-native-image-picker');
        const res = await launchCamera(IMG_OPTIONS);
        if (res?.assets?.[0]) setter(res.assets[0]);
    } catch {
        Alert.alert('Setup Required', 'Rebuild the app:\nnpx react-native run-android');
    }
};

const launchGallery = async (setter) => {
    try {
        const { launchImageLibrary } = require('react-native-image-picker');
        const res = await launchImageLibrary(IMG_OPTIONS);
        if (res?.assets?.[0]) setter(res.assets[0]);
    } catch {
        Alert.alert('Setup Required', 'Rebuild the app:\nnpx react-native run-android');
    }
};

// ─── Image Picker Bottom Sheet ────────────────────────────────────────────────
const ImagePickerSheet = ({ visible, onClose, onCamera, onGallery }) => (
    <BottomSheet visible={visible} onClose={onClose}>
        <View style={styles.sheetBody}>
            <Text style={styles.sheetTitle}>Upload Image</Text>

            <TouchableOpacity style={styles.sheetOption} onPress={onCamera} activeOpacity={0.7}>
                <View style={styles.sheetIconWrap}>
                    <Icon name="camera-outline" size={22} color={Colors.textDark} />
                </View>
                <View style={styles.sheetOptionText}>
                    <Text style={styles.sheetOptionLabel}>Take Photo</Text>
                    <Text style={styles.sheetOptionSub}>Open camera</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#C4C9CF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={onGallery} activeOpacity={0.7}>
                <View style={styles.sheetIconWrap}>
                    <Icon name="image-outline" size={22} color={Colors.textDark} />
                </View>
                <View style={styles.sheetOptionText}>
                    <Text style={styles.sheetOptionLabel}>Choose from Gallery</Text>
                    <Text style={styles.sheetOptionSub}>Browse your photos</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#C4C9CF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    </BottomSheet>
);

// ─── Upload Box ───────────────────────────────────────────────────────────────
const UploadBox = ({ image, onPress, active = false }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.uploadBox, active ? styles.uploadBoxActive : styles.uploadBoxInactive]}
    >
        {image ? (
            <Image source={{ uri: image.uri }} style={styles.uploadPreview} resizeMode="cover" />
        ) : (
            <>
                <View style={[styles.uploadCircle, active && styles.uploadCircleActive]}>
                    <Icon name="tray-arrow-up" size={24} color={active ? Colors.primary : '#BDBDBD'} />
                </View>
                <Text style={[styles.uploadLabel, active && styles.uploadLabelActive]}>
                    Tap to Upload
                </Text>
            </>
        )}
    </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const DriverOnboardingScreen = ({ navigation }) => {
    const insets  = useSafeAreaInsets();
    const setUser = useUserStore(s => s.setUser);
    const { setRole } = useApp();
    const [step, setStep] = useState(1);

    // ── Image picker sheet ────────────────────────────────────────────────────
    const [sheetVisible, setSheetVisible]   = useState(false);
    const [activeSetter, setActiveSetter]   = useState(null);

    const openSheet  = (setter) => { setActiveSetter(() => setter); setSheetVisible(true); };
    const closeSheet = () => setSheetVisible(false);
    const onSheetCamera  = () => { closeSheet(); setTimeout(() => captureImage(activeSetter), 200); };
    const onSheetGallery = () => { closeSheet(); setTimeout(() => launchGallery(activeSetter), 200); };

    // ── Step 1: Personal Info ─────────────────────────────────────────────────
    const [profileImage, setProfileImage]         = useState(null);
    const [dob, setDob]                           = useState('');
    const [dobDate, setDobDate]                   = useState(new Date(1995, 0, 1));
    const [showDatePicker, setShowDatePicker]     = useState(false);
    const [gender, setGender]                     = useState('');
    const [selectedCity, setSelectedCity]         = useState(null);
    const [citySearch, setCitySearch]             = useState('');
    const [citySheetVisible, setCitySheetVisible] = useState(false);
    const [address, setAddress]                   = useState('');
    const [bio, setBio]                           = useState('');

    // ── Step 2: Driver's License ──────────────────────────────────────────────
    const [licenseFront, setLicenseFront]     = useState(null);
    const [licenseBack, setLicenseBack]       = useState(null);
    const [licenseNumber, setLicenseNumber]   = useState('');

    // ── Step 3: CNIC ─────────────────────────────────────────────────────────
    const [cnicFront, setCnicFront]   = useState(null);
    const [cnicBack, setCnicBack]     = useState(null);
    const [cnicNumber, setCnicNumber] = useState('');

    // ── Step 4: Vehicle ───────────────────────────────────────────────────────
    const [vehicleImage, setVehicleImage]                 = useState(null);
    const [selectedMake, setSelectedMake]                 = useState(null);
    const [makeSearch, setMakeSearch]                     = useState('');
    const [makeSheetVisible, setMakeSheetVisible]         = useState(false);
    const [selectedModel, setSelectedModel]               = useState(null);
    const [modelSheetVisible, setModelSheetVisible]       = useState(false);
    const [selectedColor, setSelectedColor]               = useState(null);
    const [colorSheetVisible, setColorSheetVisible]       = useState(false);
    const [selectedYear, setSelectedYear]                 = useState(null);
    const [yearSheetVisible, setYearSheetVisible]         = useState(false);
    const [registrationNumber, setRegistrationNumber]     = useState('');
    const [seatingCapacity, setSeatingCapacity]           = useState('');
    const [luggageCapacity, setLuggageCapacity]           = useState('');
    const [hasAC, setHasAC]                               = useState(false);

    // ── Lookup queries ────────────────────────────────────────────────────────
    const citiesQuery = useCities(citySearch);
    const makesQuery  = useVehicleMakes();
    const modelsQuery = useVehicleModels(selectedMake?.id);

    const filteredMakes = (makesQuery.data?.makes || []).filter(m =>
        !makeSearch.trim() || m.name.toLowerCase().includes(makeSearch.toLowerCase())
    );

    // ── Submit mutation ───────────────────────────────────────────────────────
    const onboardMutation = useMutation({
        mutationFn: (form) => driverService.onboard(form),
        onSuccess: (res) => {
            const driverData = res.data?.data?.driver_onboarding;
            if (driverData) setUser(driverData);
            setRole('driver'); // user is now a driver → driver tabs
            Toast.show({
                type: 'success',
                text1: 'Registration Complete!',
                text2: 'Your driver profile has been submitted for review.',
            });
            navigation.replace('Main');
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
            Toast.show({ type: 'error', text1: 'Submission Failed', text2: msg });
        },
    });

    // ── Validation ────────────────────────────────────────────────────────────
    const validateStep = () => {
        switch (step) {
            case 1:
                if (!profileImage)            return 'Profile photo is required.';
                if (!dob)                     return 'Date of birth is required.';
                if (!gender)                  return 'Gender is required.';
                if (!selectedCity)            return 'City is required.';
                if (!address.trim())          return 'Address is required.';
                return null;
            case 2:
                if (!licenseFront)            return 'License front image is required.';
                if (!licenseBack)             return 'License back image is required.';
                if (!licenseNumber.trim())    return 'License number is required.';
                return null;
            case 3:
                if (!cnicFront)               return 'CNIC front image is required.';
                if (!cnicBack)                return 'CNIC back image is required.';
                if (!cnicNumber.trim())       return 'CNIC number is required.';
                return null;
            case 4:
                if (!vehicleImage)            return 'Vehicle photo is required.';
                if (!selectedMake)            return 'Vehicle brand is required.';
                if (!selectedModel)           return 'Vehicle model is required.';
                if (!selectedColor)           return 'Vehicle color is required.';
                if (!selectedYear)            return 'Manufacture year is required.';
                if (!registrationNumber.trim()) return 'Registration number is required.';
                if (!seatingCapacity)         return 'Seating capacity is required.';
                if (!luggageCapacity)         return 'Luggage capacity is required.';
                return null;
            default:
                return null;
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = () => {
        const form = new FormData();

        form.append('profile[dob]', dob);
        form.append('profile[gender]', gender);
        form.append('profile[city]', selectedCity.name);
        form.append('profile[address]', address.trim());
        if (bio.trim()) form.append('profile[bio]', bio.trim());
        form.append('profile[profile_image]', {
            uri: profileImage.uri,
            type: profileImage.type || 'image/jpeg',
            name: profileImage.fileName || 'profile.jpg',
        });

        form.append('driver[license_number]', licenseNumber.trim());
        form.append('driver[cnic_number]', cnicNumber.trim());
        form.append('driver[license_front_image]', { uri: licenseFront.uri, type: licenseFront.type || 'image/jpeg', name: 'license_front.jpg' });
        form.append('driver[license_back_image]',  { uri: licenseBack.uri,  type: licenseBack.type  || 'image/jpeg', name: 'license_back.jpg'  });
        form.append('driver[cnic_front_image]',    { uri: cnicFront.uri,    type: cnicFront.type    || 'image/jpeg', name: 'cnic_front.jpg'    });
        form.append('driver[cnic_back_image]',     { uri: cnicBack.uri,     type: cnicBack.type     || 'image/jpeg', name: 'cnic_back.jpg'     });

        form.append('vehicle[model_id]',            String(selectedModel.id));
        form.append('vehicle[manufacture_year]',    selectedYear.name);
        form.append('vehicle[color]',               selectedColor.id);
        form.append('vehicle[registration_number]', registrationNumber.trim());
        form.append('vehicle[seating_capacity]',    seatingCapacity.trim());
        form.append('vehicle[luggage_capacity]',    luggageCapacity.trim());
        form.append('vehicle[has_air_conditioner]', hasAC ? '1' : '0');
        form.append('vehicle[vehicle_image]', {
            uri: vehicleImage.uri,
            type: vehicleImage.type || 'image/jpeg',
            name: vehicleImage.fileName || 'vehicle.jpg',
        });

        onboardMutation.mutate(form);
    };

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleBack = () => step > 1 ? setStep(s => s - 1) : navigation.goBack();

    const handleNext = () => {
        const error = validateStep();
        if (error) {
            Toast.show({ type: 'error', text1: 'Required', text2: error });
            return;
        }
        if (step < TOTAL_STEPS) {
            setStep(s => s + 1);
        } else {
            handleSubmit();
        }
    };

    const onDateConfirm = (selected) => {
        setShowDatePicker(false);
        setDobDate(selected);
        setDob(selected.toISOString().split('T')[0]);
    };

    // ── Step renders ──────────────────────────────────────────────────────────
    const renderStep1 = () => (
        <>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.fieldLabel}>Profile Photo</Text>
            <View style={styles.uploadRow}>
                <UploadBox image={profileImage} onPress={() => captureImage(setProfileImage)} active />
            </View>

            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={dob ? styles.dateBtnVal : styles.dateBtnPH}>
                    {dob || 'YYYY-MM-DD'}
                </Text>
                <Icon name="calendar-range" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <DatePicker
                modal
                open={showDatePicker}
                date={dobDate}
                mode="date"
                maximumDate={new Date()}
                locale="en-US"
                theme="light"
                onConfirm={onDateConfirm}
                onCancel={() => setShowDatePicker(false)}
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
                {['male', 'female'].map(g => (
                    <TouchableOpacity
                        key={g}
                        style={[styles.genderBtn, gender === g && styles.genderBtnOn]}
                        onPress={() => setGender(g)}
                    >
                        <Text style={[styles.genderText, gender === g && styles.genderTextOn]}>
                            {g === 'male' ? 'Male' : 'Female'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.fieldLabel}>City</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setCitySheetVisible(true)}>
                <Text style={selectedCity ? styles.dateBtnVal : styles.dateBtnPH}>
                    {selectedCity?.name || 'Select City'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your address"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
            />

            <Text style={styles.fieldLabel}>Bio <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell riders a little about yourself"
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
        </>
    );

    const renderStep2 = () => (
        <>
            <Text style={styles.sectionTitle}>Driver's License</Text>
            <Text style={styles.fieldLabel}>License Images</Text>
            <View style={styles.uploadRow}>
                <View style={styles.uploadCol}>
                    <UploadBox image={licenseFront} onPress={() => openSheet(setLicenseFront)} active />
                    <Text style={styles.uploadSubLabel}>Front</Text>
                </View>
                <View style={styles.uploadCol}>
                    <UploadBox image={licenseBack} onPress={() => openSheet(setLicenseBack)} />
                    <Text style={styles.uploadSubLabel}>Back</Text>
                </View>
            </View>
            <Text style={styles.uploadHint}>{UPLOAD_HINT}</Text>

            <Text style={styles.fieldLabel}>License Number</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter license number"
                placeholderTextColor="#9CA3AF"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
            />
        </>
    );

    const renderStep3 = () => (
        <>
            <Text style={styles.sectionTitle}>National Identity</Text>
            <Text style={styles.fieldLabel}>CNIC Images</Text>
            <View style={styles.uploadRow}>
                <View style={styles.uploadCol}>
                    <UploadBox image={cnicFront} onPress={() => openSheet(setCnicFront)} active />
                    <Text style={styles.uploadSubLabel}>CNIC Front</Text>
                </View>
                <View style={styles.uploadCol}>
                    <UploadBox image={cnicBack} onPress={() => openSheet(setCnicBack)} />
                    <Text style={styles.uploadSubLabel}>CNIC Back</Text>
                </View>
            </View>
            <Text style={styles.uploadHint}>{UPLOAD_HINT}</Text>

            <Text style={styles.fieldLabel}>CNIC Number</Text>
            <TextInput
                style={styles.input}
                placeholder="XXXXX-XXXXXXX-X"
                placeholderTextColor="#9CA3AF"
                value={cnicNumber}
                onChangeText={setCnicNumber}
                keyboardType="numeric"
            />
        </>
    );

    const renderStep4 = () => (
        <>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>

            <Text style={styles.fieldLabel}>Vehicle Photo</Text>
            <View style={styles.uploadRow}>
                <UploadBox image={vehicleImage} onPress={() => captureImage(setVehicleImage)} active />
            </View>
            <Text style={styles.uploadHint}>{UPLOAD_HINT}</Text>

            <Text style={styles.fieldLabel}>Vehicle Brand</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setMakeSheetVisible(true)}>
                <Text style={selectedMake ? styles.dateBtnVal : styles.dateBtnPH}>
                    {selectedMake?.name || 'Select Brand'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Vehicle Model</Text>
            <TouchableOpacity
                style={[styles.dateBtn, !selectedMake && styles.dateBtnDisabled]}
                onPress={() => selectedMake && setModelSheetVisible(true)}
            >
                <Text style={selectedModel ? styles.dateBtnVal : styles.dateBtnPH}>
                    {selectedModel?.name || (selectedMake ? 'Select Model' : 'Select brand first')}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Vehicle Color</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setColorSheetVisible(true)}>
                <View style={styles.colorBtnLeft}>
                    {selectedColor && (
                        <View style={[
                            styles.colorDotBtn,
                            { backgroundColor: selectedColor.color },
                            selectedColor.color === '#FFFFFF' && { borderWidth: 1, borderColor: '#D1D5DB' },
                        ]} />
                    )}
                    <Text style={selectedColor ? styles.dateBtnVal : styles.dateBtnPH}>
                        {selectedColor?.name || 'Select Color'}
                    </Text>
                </View>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Manufacture Year</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setYearSheetVisible(true)}>
                <Text style={selectedYear ? styles.dateBtnVal : styles.dateBtnPH}>
                    {selectedYear?.name || 'Select Year'}
                </Text>
                <Icon name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Registration Number</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. ABC-1234"
                placeholderTextColor="#9CA3AF"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                autoCapitalize="characters"
            />

            <Text style={styles.fieldLabel}>Seating Capacity</Text>
            <View style={[styles.input, styles.inputDisabled]}>
                <Text style={seatingCapacity ? styles.dateBtnVal : styles.dateBtnPH}>
                    {seatingCapacity ? `${seatingCapacity} Seats` : 'Auto-filled from model'}
                </Text>
            </View>

            <Text style={styles.fieldLabel}>Luggage Capacity</Text>
            <TextInput
                style={styles.input}
                placeholder="Luggage bags"
                placeholderTextColor="#9CA3AF"
                value={luggageCapacity}
                onChangeText={setLuggageCapacity}
                keyboardType="numeric"
            />

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Has Air Conditioner</Text>
                <Switch
                    value={hasAC}
                    onValueChange={setHasAC}
                    trackColor={{ false: '#E5E7EB', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                />
            </View>
        </>
    );

    const isSubmitting = onboardMutation.isPending;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Icon name="arrow-left" size={22} color={Colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Register as Driver</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets={true}
                >
                    <View style={styles.card}>
                        <Text style={styles.stepText}>Step {step} of {TOTAL_STEPS}</Text>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
                        </View>

                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </View>
                </ScrollView>

                {/* Footer — fixed, lifts with the keyboard */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
                    <View style={styles.footerRow}>
                        {step > 1 && (
                            <TouchableOpacity
                                style={styles.backBtnFooter}
                                onPress={handleBack}
                                activeOpacity={0.8}
                            >
                                <Icon name="arrow-left" size={18} color={Colors.textDark} />
                                <Text style={styles.backBtnText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.nextBtn, isSubmitting && styles.nextBtnDisabled]}
                            onPress={handleNext}
                            disabled={isSubmitting}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.nextText}>
                                {isSubmitting ? 'Submitting...' : step === TOTAL_STEPS ? 'Submit' : 'Next Step'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Image picker sheet */}
            <ImagePickerSheet
                visible={sheetVisible}
                onClose={closeSheet}
                onCamera={onSheetCamera}
                onGallery={onSheetGallery}
            />

            {/* City */}
            <SelectSheet
                visible={citySheetVisible}
                onClose={() => { setCitySheetVisible(false); setCitySearch(''); }}
                title="Select City"
                items={citiesQuery.data?.cities || []}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={selectedCity?.id}
                onSelect={(item) => { setSelectedCity(item); setCitySheetVisible(false); setCitySearch(''); }}
            />

            {/* Vehicle Brand (frontend search) */}
            <SelectSheet
                visible={makeSheetVisible}
                onClose={() => { setMakeSheetVisible(false); setMakeSearch(''); }}
                title="Select Vehicle Brand"
                items={filteredMakes}
                loading={makesQuery.isLoading}
                searchable
                search={makeSearch}
                onSearch={setMakeSearch}
                selectedId={selectedMake?.id}
                onSelect={(item) => {
                    setSelectedMake(item);
                    setSelectedModel(null);
                    setSeatingCapacity('');
                    setMakeSheetVisible(false);
                    setMakeSearch('');
                }}
            />

            {/* Vehicle Model */}
            <SelectSheet
                visible={modelSheetVisible}
                onClose={() => setModelSheetVisible(false)}
                title="Select Vehicle Model"
                items={modelsQuery.data?.models || []}
                loading={modelsQuery.isLoading}
                selectedId={selectedModel?.id}
                onSelect={(item) => {
                    setSelectedModel(item);
                    if (item.seating_capacity) setSeatingCapacity(String(item.seating_capacity));
                    setModelSheetVisible(false);
                }}
            />

            {/* Color */}
            <SelectSheet
                visible={colorSheetVisible}
                onClose={() => setColorSheetVisible(false)}
                title="Select Vehicle Color"
                items={CAR_COLORS}
                selectedId={selectedColor?.id}
                onSelect={(item) => { setSelectedColor(item); setColorSheetVisible(false); }}
            />

            {/* Manufacture Year */}
            <SelectSheet
                visible={yearSheetVisible}
                onClose={() => setYearSheetVisible(false)}
                title="Manufacture Year"
                items={YEARS}
                selectedId={selectedYear?.id}
                onSelect={(item) => { setSelectedYear(item); setYearSheetVisible(false); }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.white,
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: Colors.textDark },

    scroll: { padding: 16 },

    card: {
        backgroundColor: Colors.white, borderRadius: 16, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },

    stepText:      { fontSize: 13, fontFamily: Fonts.medium, color: Colors.textSecondary, marginBottom: 10 },
    progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 28 },
    progressFill:  { height: 6, backgroundColor: Colors.textDark, borderRadius: 3 },

    sectionTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.textDark, marginBottom: 20 },
    fieldLabel:   { fontSize: 13, fontFamily: Fonts.medium, color: Colors.textDark, marginBottom: 8, marginTop: 4 },
    optional:     { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textSecondary },

    uploadRow:          { flexDirection: 'row', gap: 12, marginBottom: 4 },
    uploadCol:          { flex: 1, alignItems: 'center' },
    uploadBox:          { width: '100%', aspectRatio: 1.3, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
    uploadBoxActive:    { borderColor: Colors.primary },
    uploadBoxInactive:  { borderColor: '#D1D5DB' },
    uploadCircle:       { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    uploadCircleActive: { borderColor: Colors.primary },
    uploadLabel:        { fontSize: 12, fontFamily: Fonts.medium, color: '#9CA3AF' },
    uploadLabelActive:  { color: Colors.textDark },
    uploadSubLabel:     { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textSecondary, marginTop: 6 },
    uploadPreview:      { width: '100%', height: '100%', borderRadius: 10 },
    uploadHint:         { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textSecondary, marginBottom: 16, marginTop: 4 },

    input: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 14,
        marginBottom: 12, backgroundColor: Colors.white,
        fontFamily: Fonts.regular, fontSize: 14, color: Colors.textDark,
    },
    textArea: { height: 90, paddingTop: 12 },
    inputDisabled: { backgroundColor: '#F3F4F6', justifyContent: 'center' },

    dateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12,
        backgroundColor: Colors.white,
    },
    dateBtnVal:      { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textDark },
    dateBtnPH:       { fontSize: 14, fontFamily: Fonts.regular, color: '#9CA3AF' },
    dateBtnDisabled: { opacity: 0.5 },

    colorBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    colorDotBtn:  { width: 22, height: 22, borderRadius: 11 },

    genderRow:    { flexDirection: 'row', gap: 12, marginBottom: 12 },
    genderBtn:    { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
    genderBtnOn:  { borderColor: Colors.primary, backgroundColor: '#FFFBEA' },
    genderText:   { fontSize: 14, fontFamily: Fonts.medium, color: Colors.textSecondary },
    genderTextOn: { color: Colors.textDark },

    switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4 },
    switchLabel: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.textDark },

    footer:         { paddingHorizontal: 16, paddingTop: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    footerRow:      { flexDirection: 'row', gap: 10 },
    backBtnFooter:  { flex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: Colors.white },
    backBtnText:    { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textDark },
    nextBtn:        { flex: 7, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    nextBtnDisabled:{ backgroundColor: '#E5E7EB' },
    nextText:       { fontSize: 16, fontFamily: Fonts.semiBold, color: Colors.textOnPrimary },

    sheetBody:        { paddingHorizontal: 20, paddingTop: 4 },
    sheetTitle:       { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textDark, textAlign: 'center', marginBottom: 16 },
    sheetOption:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    sheetIconWrap:    { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
    sheetOptionText:  { flex: 1 },
    sheetOptionLabel: { fontSize: 15, fontFamily: Fonts.medium, color: Colors.textDark },
    sheetOptionSub:   { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textSecondary, marginTop: 2 },
    sheetCancelBtn:   { marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
    sheetCancelText:  { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textSecondary },
});

export default DriverOnboardingScreen;
