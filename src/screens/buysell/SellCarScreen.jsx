import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const FEATURES = [
    'Navigation System', 'Leather Seats', 'Bluetooth',
    'Keyless Entry', 'Heated Seats', 'Sunroof',
    'Backup Camera', 'Apple CarPlay', 'Third Row Seating',
];

const DropdownField = ({ placeholder }) => (
    <TouchableOpacity style={styles.dropdown}>
        <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
        <Icon name="chevron-down" size={18} color="#5D5F62" />
    </TouchableOpacity>
);

const SellCarScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [condition, setCondition] = useState('New');
    const [transmission, setTransmission] = useState('Automatic');
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [customFeature, setCustomFeature] = useState('');

    const toggleFeature = (f) => {
        setSelectedFeatures(prev =>
            prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
        );
    };

    const progress = step / 3;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sell Your Car</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.body}>

                    {/* Progress */}
                    <Text style={styles.stepLabel}>Step {step} of 3</Text>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>

                    {/* Step 1 */}
                    {step === 1 && (
                        <View>
                            <Text style={styles.stepTitle}>Basic Vehicles Details</Text>
                            <Text style={styles.stepDesc}>Please provide the core details about your vehicle to get started.</Text>

                            {/* Image Upload */}
                            <Text style={styles.fieldLabel}>Vehicle Images</Text>
                            <View style={styles.imageUploadRow}>
                                <TouchableOpacity style={styles.uploadBox}>
                                    <Icon name="upload-outline" size={28} color="#FFD400" />
                                    <Text style={styles.uploadText}>Tap to Upload</Text>
                                </TouchableOpacity>
                                <View style={[styles.uploadBox, styles.uploadBoxEmpty]} />
                                <View style={[styles.uploadBox, styles.uploadBoxEmpty]} />
                            </View>
                            <Text style={styles.uploadHint}>Supported formats: JPG & PNG · Max Size: 2MB · 1st Photo will be cover.</Text>

                            {/* Dropdowns */}
                            <DropdownField placeholder="Make" />
                            <DropdownField placeholder="Model" />
                            <DropdownField placeholder="Variant" />
                            <DropdownField placeholder="Year" />
                            <DropdownField placeholder="City" />
                        </View>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <View>
                            <Text style={styles.stepTitle}>Specifications & Condition</Text>
                            <Text style={styles.stepDesc}>Please provide the core details about your vehicle to get started.</Text>

                            {/* Condition */}
                            <Text style={styles.fieldLabel}>Condition</Text>
                            <View style={styles.toggleRow}>
                                {['New', 'Used'].map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.toggleBtn, condition === c && styles.toggleBtnActive]}
                                        onPress={() => setCondition(c)}
                                    >
                                        <Text style={[styles.toggleText, condition === c && styles.toggleTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Transmission */}
                            <Text style={styles.fieldLabel}>Transmission</Text>
                            <View style={styles.toggleRow}>
                                {['Automatic', 'Manual'].map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.toggleBtn, transmission === t && styles.toggleBtnActive]}
                                        onPress={() => setTransmission(t)}
                                    >
                                        <Text style={[styles.toggleText, transmission === t && styles.toggleTextActive]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <DropdownField placeholder="Fuel Type" />
                            <DropdownField placeholder="Color" />

                            {/* Engine + Mileage Row */}
                            <View style={styles.twoColRow}>
                                <View style={[styles.dropdown, { flex: 1 }]}>
                                    <TextInput placeholder="Engine (cc)" placeholderTextColor="#AAAAAA" style={styles.inlineInput} />
                                </View>
                                <View style={[styles.dropdown, { flex: 1 }]}>
                                    <TextInput placeholder="Mileage (km)" placeholderTextColor="#AAAAAA" style={styles.inlineInput} />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <View>
                            <Text style={styles.stepTitle}>Features & Description</Text>
                            <Text style={styles.stepDesc}>Select all features that apply to your vehicle and provide a brief description.</Text>

                            <Text style={styles.fieldLabel}>Vehicle Features</Text>
                            <View style={styles.featuresGrid}>
                                {FEATURES.map(f => (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.featureChip, selectedFeatures.includes(f) && styles.featureChipActive]}
                                        onPress={() => toggleFeature(f)}
                                    >
                                        <Text style={[styles.featureText, selectedFeatures.includes(f) && styles.featureTextActive]}>
                                            {f}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Add Custom Feature */}
                            <View style={styles.customFeatureRow}>
                                <TextInput
                                    style={styles.customFeatureInput}
                                    placeholder="Add Custom Feature"
                                    placeholderTextColor="#AAAAAA"
                                    value={customFeature}
                                    onChangeText={setCustomFeature}
                                />
                                <TouchableOpacity style={styles.customFeatureBtn}>
                                    <Icon name="check" size={18} color="#111111" />
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View style={styles.descriptionBox}>
                                <TextInput
                                    placeholder="Vehicle Description"
                                    placeholderTextColor="#AAAAAA"
                                    style={styles.descriptionInput}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomBtn}>
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => step < 3 ? setStep(step + 1) : navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextBtnText}>{step === 3 ? 'Post Your Ad' : 'Next Step'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    body: { padding: 16 },

    // Progress
    stepLabel: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', marginBottom: 8 },
    progressTrack: {
        height: 6, backgroundColor: '#EAEDEE',
        borderRadius: 3, marginBottom: 24, overflow: 'hidden',
    },
    progressFill: {
        height: '100%', backgroundColor: '#07163B', borderRadius: 3,
    },

    stepTitle: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 6 },
    stepDesc: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 19, marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 10 },

    // Image Upload
    imageUploadRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    uploadBox: {
        width: 100, height: 90, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#FFD400',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(245,214,50,0.06)',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    uploadBoxEmpty: {
        borderColor: '#EAEDEE',
        backgroundColor: '#FAFAFA',
    },
    uploadText: { fontSize: 11, fontFamily: Fonts.medium, color: '#FFD400' },
    uploadHint: { fontSize: 11, fontFamily: Fonts.regular, color: '#AAAAAA', marginBottom: 16, lineHeight: 16 },

    // Dropdown
    dropdown: {
        borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF', marginBottom: 12,
    },
    dropdownPlaceholder: { fontSize: 14, fontFamily: Fonts.regular, color: '#AAAAAA' },
    inlineInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#202223' },
    twoColRow: { flexDirection: 'row', gap: 12 },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F7',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    toggleBtn: {
        flex: 1, paddingVertical: 10,
        alignItems: 'center', borderRadius: 8,
    },
    toggleBtnActive: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    toggleText: { fontSize: 14, fontFamily: Fonts.medium, color: '#5D5F62' },
    toggleTextActive: { color: '#07163B', fontFamily: Fonts.semiBold },

    // Features
    featuresGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16,
    },
    featureChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1, borderColor: '#EAEDEE',
        backgroundColor: '#FFFFFF',
    },
    featureChipActive: {
        backgroundColor: 'rgba(245,214,50,0.12)',
        borderColor: 'rgba(245,214,50,0.6)',
    },
    featureText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    featureTextActive: { color: '#07163B', fontFamily: Fonts.medium },

    // Custom Feature
    customFeatureRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
    },
    customFeatureInput: {
        flex: 1, borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
        fontSize: 14, fontFamily: Fonts.regular, color: '#202223',
        backgroundColor: '#FFFFFF',
    },
    customFeatureBtn: {
        width: 46, height: 46, borderRadius: 10,
        backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center',
    },

    // Description
    descriptionBox: {
        borderWidth: 1, borderColor: '#EAEDEE',
        borderRadius: 10, backgroundColor: '#FFFFFF', padding: 14,
    },
    descriptionInput: {
        fontSize: 14, fontFamily: Fonts.regular,
        color: '#202223', minHeight: 80, textAlignVertical: 'top',
    },

    // Bottom
    bottomBtn: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    nextBtn: {
        backgroundColor: '#FFD400', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center',
    },
    nextBtnText: { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default SellCarScreen;
