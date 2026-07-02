import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, StatusBar, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Colors from '../../constants/colors';
import Fonts from '../../constants/fonts';
import Button from '../../components/Button';
import useAuth from '../../hooks/useAuth';

const OTPScreen = ({ navigation, route }) => {
    const email = route?.params?.email || '';
    const [otp, setOtp]     = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(20);
    const [otpError, setOtpError] = useState('');
    const inputs = useRef([]);

    const { verifyOtpMutation, verifyingOtp, resendOtp, resendingOtp } = useAuth();

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        setOtpError('');
        if (text && index < 5) inputs.current[index + 1]?.focus();
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleConfirm = () => {
        const code = otp.join('');
        if (code.length < 6) {
            setOtpError('Please enter the complete 6-digit OTP.');
            return;
        }

        verifyOtpMutation.mutate(
            { email, otp: code },
            {
                onSuccess: () => {
                    Toast.show({
                        type: 'success',
                        text1: 'Email Verified!',
                        text2: 'Please log in to continue.',
                    });
                    navigation.replace('Login');
                },
                onError: (err) => {
                    const data = err.response?.data;
                    const msg  = data?.message || 'Invalid OTP. Please try again.';
                    setOtpError(msg);
                    Toast.show({
                        type: 'error',
                        text1: 'Verification Failed',
                        text2: msg,
                    });
                },
            }
        );
    };

    const handleResend = () => {
        resendOtp(email, {
            onSuccess: () => {
                setTimer(20);
                setOtp(['', '', '', '', '', '']);
                setOtpError('');
                Toast.show({
                    type: 'success',
                    text1: 'OTP Resent',
                    text2: `A new OTP has been sent to ${email}`,
                });
            },
            onError: (err) => {
                const msg = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
                Toast.show({ type: 'error', text1: 'Resend Failed', text2: msg });
            },
        });
    };

    const formatTime = (s) => `00:${s.toString().padStart(2, '0')}`;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.container}>
                <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

                <Text style={styles.title}>Enter OTP</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit OTP code sent to{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => { inputs.current[index] = ref; }}
                            style={[
                                styles.otpBox,
                                digit && styles.otpBoxFilled,
                                otpError && styles.otpBoxError,
                            ]}
                            value={digit}
                            onChangeText={text => handleChange(text.slice(-1), index)}
                            onKeyPress={e => handleKeyPress(e, index)}
                            keyboardType="numeric"
                            maxLength={1}
                            textAlign="center"
                        />
                    ))}
                </View>

                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

                <View style={styles.timerRow}>
                    <View style={[styles.timerCircle, timer === 0 && styles.timerDone]} />
                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                </View>

                <View style={styles.resendRow}>
                    <Text style={styles.resend}>Didn't receive the code? </Text>
                    <TouchableOpacity onPress={handleResend} disabled={timer > 0 || resendingOtp}>
                        <Text style={[styles.resendLink, (timer > 0 || resendingOtp) && styles.resendDisabled]}>
                            {resendingOtp ? 'Sending...' : 'Resend'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomBtn}>
                    <Button
                        title={verifyingOtp ? 'Verifying...' : 'Confirm'}
                        onPress={handleConfirm}
                        disabled={verifyingOtp}
                    />
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 28, paddingTop: 60 },
    title:        { fontSize: 22, fontFamily: Fonts.bold, color: Colors.textDark, marginBottom: 8 },
    subtitle:     { fontSize: 13, fontFamily: Fonts.regular, color: Colors.gray, lineHeight: 20, marginBottom: 32 },
    emailText:    { fontFamily: Fonts.semiBold, color: Colors.textDark },
    otpRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
    otpBox:       { flex: 1, height: 56, borderWidth: 1.5, borderColor: Colors.lightGray, borderRadius: 8, fontSize: 20, fontFamily: Fonts.semiBold, color: Colors.textDark, backgroundColor: Colors.white },
    otpBoxFilled: { borderColor: Colors.primary },
    otpBoxError:  { borderColor: '#EF4444' },
    errorText:    { fontSize: 11, color: '#EF4444', fontFamily: Fonts.regular, marginBottom: 16, marginLeft: 2 },
    timerRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8, marginTop: 16 },
    timerCircle:  { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.primary },
    timerDone:    { borderColor: Colors.lightGray },
    timerText:    { fontSize: 14, fontFamily: Fonts.medium, color: Colors.textDark },
    resendRow:    { flexDirection: 'row', alignItems: 'center' },
    resend:       { fontSize: 13, fontFamily: Fonts.regular, color: Colors.gray },
    resendDisabled: { opacity: 0.4 },
    resendLink:   { fontFamily: Fonts.semiBold, color: Colors.primary, textDecorationLine: 'underline' },
    bottomBtn:    { position: 'absolute', bottom: 36, left: 28, right: 28 },
});

export default OTPScreen;
