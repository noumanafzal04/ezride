import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Dimensions,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        icon: 'car-clock',
        iconBg: '#FFFBEA',
        iconColor: '#FFD400',
        title: 'Rides at Your\nFingertips',
        description: 'Book a ride in seconds and get to your destination safely and comfortably.',
    },
    {
        id: '2',
        icon: 'map-marker-path',
        iconBg: '#EEF2FF',
        iconColor: '#6C63FF',
        title: 'Track Your Ride\nIn Real Time',
        description: 'Stay updated with live location tracking from pickup to drop-off.',
    },
    {
        id: '3',
        icon: 'cash-multiple',
        iconBg: '#E8F8EE',
        iconColor: '#109F2A',
        title: 'Earn on Your\nOwn Schedule',
        description: 'Drive when you want, earn what you deserve. Be your own boss with EZRide.',
    },
];

const OnboardingScreen = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            navigation.replace('RoleSelect');
        }
    };

    const handleSkip = () => navigation.replace('RoleSelect');

    const onScroll = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Skip */}
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.slide}>

                        {/* Illustration */}
                        <View style={styles.illustrationWrap}>
                            {/* Outer ring */}
                            <View style={styles.outerRing}>
                                <View style={styles.middleRing}>
                                    <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                                        <Icon name={item.icon} size={64} color={item.iconColor} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Text */}
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                )}
            />

            {/* Bottom */}
            <View style={styles.bottom}>
                {/* Dots */}
                <View style={styles.dotsRow}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                i === currentIndex ? styles.dotActive : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>

                {/* Next Button */}
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNext}
                    activeOpacity={0.85}
                >
                    <Text style={styles.nextText}>
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>

                {/* Sign in link */}
                <TouchableOpacity onPress={() => navigation.replace('Login')}>
                    <Text style={styles.signinText}>
                        Already have an account?{' '}
                        <Text style={styles.signinLink}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    skipBtn: {
        position: 'absolute',
        top: 56,
        right: 24,
        zIndex: 10,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    skipText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },

    // Slide
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
        paddingTop: 40,
        paddingBottom: 220,
    },

    // Illustration
    illustrationWrap: {
        marginBottom: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerRing: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(255,212,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,212,0,0.12)',
    },
    middleRing: {
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: 'rgba(255,212,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,212,0,0.15)',
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },

    // Text
    title: {
        fontSize: 30,
        fontFamily: Fonts.bold,
        color: '#07163B',
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        textAlign: 'center',
        lineHeight: 24,
    },

    // Bottom
    bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 48,
        alignItems: 'center',
        gap: 20,
        backgroundColor: '#FFFFFF',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F7',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        width: 28,
        backgroundColor: '#FFD400',
    },
    dotInactive: {
        width: 8,
        backgroundColor: '#EAEDEE',
    },
    nextBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#FFD400',
    },
    nextText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
    signinText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    signinLink: {
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        textDecorationLine: 'underline',
    },
});

export default OnboardingScreen;
