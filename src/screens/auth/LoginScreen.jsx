import React, {useState} from 'react';
import {
    View, Text, StyleSheet, StatusBar,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import Button from '../../components/Button';
import Input from '../../components/Input';
import useAuth from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';

const LoginScreen = ({navigation}) => {
    const [email, setEmail] = useState('noman1@app.com');
    const [password, setPassword] = useState('Password@123');
    const [errors, setErrors] = useState({});

    const {loginMutation, loggingIn} = useAuth();
    const { setRole } = useApp();

    // ─── Client-side validation ───────────────────────────────
    const validate = () => {
        const e = {};
        if (!email.trim()) e.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
        if (!password) e.password = 'Password is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = () => {
        if (!validate()) return;

        loginMutation.mutate(
            {email: email.trim(), password},
            {
                onSuccess: (res) => {
                    const userType = res?.data?.data?.user?.user_type;
                    setRole(userType); // 'driver' → driver tabs, otherwise rider tabs
                    Toast.show({
                        type: 'success',
                        text1: 'Welcome back!',
                        text2: 'You have logged in successfully.',
                    });
                    navigation.replace('Main');
                },
                onError: (err) => {
                    const data = err.response?.data;
                    const status = err.response?.status;

                    if (status === 401 || status === 422) {
                        // Invalid credentials or validation
                        if (data?.errors) {
                            const serverErrors = {};
                            Object.entries(data.errors).forEach(([field, messages]) => {
                                serverErrors[field] = messages[0];
                            });
                            setErrors(serverErrors);
                        }
                        Toast.show({
                            type: 'error',
                            text1: 'Invalid Credentials',
                            text2: data?.message || 'Email or password is incorrect.',
                        });
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: 'Login Failed',
                            text2: data?.message || 'Something went wrong. Please try again.',
                        });
                    }
                },
            }
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>

            <View style={styles.logoContainer}>
                <Text style={styles.logo}>EZRide</Text>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.title}>Login</Text>
                <Text style={styles.subtitle}>Enter your credentials to continue.</Text>

                {/* Email */}
                <View style={styles.fieldWrapper}>
                    <Input
                        placeholder="Email Address"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={(t) => {
                            setEmail(t);
                            if (errors.email) setErrors(p => ({...p, email: null}));
                        }}
                        style={[styles.input, errors.email && styles.inputError]}
                        autoCapitalize="none"
                        placeholderTextColor="#9CA3AF"
                    />
                    {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.fieldWrapper}>
                    <Input
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={(t) => {
                            setPassword(t);
                            if (errors.password) setErrors(p => ({...p, password: null}));
                        }}
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholderTextColor="#9CA3AF"
                    />
                    {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                <Button
                    title={loggingIn ? 'Logging in...' : 'Login'}
                    onPress={handleLogin}
                    disabled={loggingIn}
                    style={styles.button}
                    textStyle={styles.buttonText}
                />

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine}/>
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine}/>
                </View>

                <TouchableOpacity
                    style={styles.guestBtn}
                    onPress={() => navigation.navigate('Main')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.guestText}>Continue as Guest</Text>
                </TouchableOpacity>

                <View style={styles.linkRow}>
                    <Text style={styles.linkText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.linkBold}>Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.helpBtn}>
                <Text style={styles.helpText}>Need Help?</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#FFFFFF'},
    logoContainer: {alignItems: 'center', paddingTop: 56, paddingBottom: 16},
    logo: {fontSize: 36, fontFamily: Fonts.bold, color: '#1D3461', letterSpacing: 2},
    formContainer: {flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 20},
    title: {fontSize: 26, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 6},
    subtitle: {fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', marginBottom: 28},
    fieldWrapper: {marginBottom: 14},
    input: {},
    inputError: {borderColor: '#EF4444'},
    errorText: {fontSize: 11, color: '#EF4444', fontFamily: Fonts.regular, marginTop: 4, marginLeft: 2},
    button: {marginTop: 4, marginBottom: 20, borderRadius: 8},
    buttonText: {color: '#111111', fontFamily: Fonts.semiBold, fontSize: 16},
    dividerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
    dividerLine: {flex: 1, height: 1, backgroundColor: '#E0E0E0'},
    dividerText: {marginHorizontal: 12, fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62'},
    guestBtn: {
        borderWidth: 1.5,
        borderColor: '#EAEDEE',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#F9F9F9'
    },
    guestText: {fontSize: 15, fontFamily: Fonts.medium, color: '#5D5F62'},
    linkRow: {flexDirection: 'row', justifyContent: 'center'},
    linkText: {fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62'},
    linkBold: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D3461'},
    helpBtn: {alignItems: 'center', paddingBottom: 40},
    helpText: {fontSize: 13, fontFamily: Fonts.regular, color: '#1D3461', textDecorationLine: 'underline'},
});

export default LoginScreen;
