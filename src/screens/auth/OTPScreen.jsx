import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, StatusBar, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import Button from '../../components/Button';

const OTPScreen = ({ navigation, route }) => {
    const phone = route?.params?.phone || '+92 304 9375728';
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(24);
    const inputs = useRef([]);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 3) inputs.current[index + 1]?.focus();
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const formatTime = (s) => `00:${s.toString().padStart(2, '0')}`;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

                <Text style={styles.title}>Enter OTP</Text>
                <Text style={styles.subtitle}>
                    Enter the 4-digit OTP code that we sent to{'\n'}
                    <Text style={styles.phone}>{phone}</Text>
                </Text>

                <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => { inputs.current[index] = ref; }}
                            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                            value={digit}
                            onChangeText={text => handleChange(text.slice(-1), index)}
                            onKeyPress={e => handleKeyPress(e, index)}
                            keyboardType="numeric"
                            maxLength={1}
                            textAlign="center"
                        />
                    ))}
                </View>

                <View style={styles.timerRow}>
                    <View style={[styles.timerCircle, timer === 0 && styles.timerDone]} />
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                </View>

                <TouchableOpacity onPress={() => setTimer(24)} disabled={timer > 0}>
                    <Text style={[styles.resend, timer > 0 && styles.resendDisabled]}>
                        Didn't receive the code?
                    </Text>
                </TouchableOpacity>

                <View style={styles.bottomBtn}>
                    <Button title="Confirm" onPress={() => navigation.navigate('Onboarding')} />
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        paddingHorizontal: 28,
        paddingTop: 60,
    },
    title: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        color: Colors.textDark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: Colors.gray,
        lineHeight: 20,
        marginBottom: 32,
    },
    phone: { fontFamily: Fonts.medium, color: Colors.textDark },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
        gap: 12,
    },
    otpBox: {
        flex: 1,
        height: 56,
        borderWidth: 1.5,
        borderColor: Colors.lightGray,
        borderRadius: 8,
        fontSize: 20,
        fontFamily: Fonts.semiBold,
        color: Colors.textDark,
        backgroundColor: Colors.white,
    },
    otpBoxFilled: { borderColor: Colors.primary },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    timerCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    timerDone: { borderColor: Colors.lightGray },
    timerText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.textDark,
    },
    resend: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: Colors.secondary,
        textDecorationLine: 'underline',
    },
    resendDisabled: { color: Colors.gray },
    bottomBtn: {
        position: 'absolute',
        bottom: 36,
        left: 28,
        right: 28,
    },
});

export default OTPScreen;
