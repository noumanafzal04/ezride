import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={Colors.primary} barStyle="dark-content" />
            <Text style={styles.logo}>EZRide</Text>
            <Text style={styles.tagline}>Reliable rides, wherever life takes you.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logo: {
        fontSize: 48,
        fontFamily: Fonts.bold,
        color: Colors.secondary,
        letterSpacing: 4,
        marginBottom: 16,
    },
    tagline: {
        fontSize: 15,
        fontFamily: Fonts.italic,
        color: Colors.secondary,
        textAlign: 'center',
    },
});

export default SplashScreen;
