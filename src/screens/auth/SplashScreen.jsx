import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import authService from '../../services/authService';
import { useApp } from '../../context/AppContext';

const SplashScreen = ({ navigation }) => {
    const { setRole } = useApp();

    useEffect(() => {
        const bootstrap = async () => {
            // Minimum splash time runs concurrently with the async work below
            const minDelay = new Promise(res => setTimeout(res, 1500));

            // Restore token + cached user from AsyncStorage
            await useAuthStore.getState().restoreAuth();
            await useUserStore.getState().restoreUser();

            const { token, isFullyAuthenticated } = useAuthStore.getState();
            let destination = 'Login';

            if (token && isFullyAuthenticated) {
                destination = 'Main';

                // Set role immediately from cached user so tabs are right on first paint
                const cached = useUserStore.getState().user;
                if (cached?.user_type) setRole(cached.user_type);

                // Refresh the user from the server so cached data isn't stale.
                try {
                    const res = await authService.me();
                    const fresh = res.data?.data?.user || res.data?.data;
                    if (fresh) {
                        useUserStore.getState().setUser(fresh);
                        if (fresh.user_type) setRole(fresh.user_type);
                    }
                } catch {
                    // On 401 the interceptor clears auth → fall back to Login.
                    // On network error keep the cached user and proceed.
                    if (!useAuthStore.getState().token) destination = 'Login';
                }
            }

            await minDelay;
            navigation.replace(destination);
        };

        bootstrap();
    }, [navigation, setRole]);

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
