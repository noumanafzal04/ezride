import React, { useState } from 'react';
import {
    View, Text, StyleSheet, StatusBar,
    TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import Button from '../../components/Button';
import Input from '../../components/Input';
import useAuth from '../../hooks/useAuth';

const Field = ({ label, value, onChangeText, errorKey, errors, setErrors, ...props }) => (
    <View style={styles.fieldWrapper}>
        <Input
            placeholder={label}
            value={value}
            onChangeText={(t) => {
                onChangeText(t);
                if (errors[errorKey]) setErrors(prev => ({ ...prev, [errorKey]: null }));
            }}
            style={[styles.input, errors[errorKey] && styles.inputError]}
            placeholderTextColor="#9CA3AF"
            {...props}
        />
        {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
    </View>
);

const SignupScreen = ({ navigation }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName]   = useState('');
    const [email, setEmail]         = useState('');
    const [phone, setPhone]         = useState('');
    const [password, setPassword]   = useState('');
    const [confirm, setConfirm]     = useState('');

    const [errors, setErrors] = useState({});

    const { signupMutation, signingUp } = useAuth();

    // ─── Client-side validation ───────────────────────────────
    const validate = () => {
        const e = {};
        if (!firstName.trim())       e.firstName = 'First name is required.';
        if (!lastName.trim())        e.lastName  = 'Last name is required.';
        if (!email.trim())           e.email     = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
        if (!phone.trim())           e.phone     = 'Phone number is required.';
        else if (phone.length < 10)  e.phone     = 'Enter a valid phone number.';
        if (!password)               e.password  = 'Password is required.';
        else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
        if (!confirm)                e.confirm   = 'Please confirm your password.';
        else if (password !== confirm) e.confirm = 'Passwords do not match.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSignup = () => {
        if (!validate()) return;

        signupMutation.mutate(
            {
                first_name:            firstName.trim(),
                last_name:             lastName.trim(),
                phone_number:          phone.trim(),
                email:                 email.trim(),
                password,
                password_confirmation: confirm,
            },
            {
                onSuccess: () => {
                    Toast.show({
                        type: 'success',
                        text1: 'Account Created!',
                        text2: 'OTP sent to your email.',
                    });
                    navigation.navigate('OTP', { email: email.trim() });
                },
                onError: (err) => {
                    const data = err.response?.data;

                    // Laravel validation errors
                    if (data?.errors) {
                        const serverErrors = {};
                        Object.entries(data.errors).forEach(([field, messages]) => {
                            const key = field === 'phone_number' ? 'phone'
                                : field === 'first_name'   ? 'firstName'
                                    : field === 'last_name'    ? 'lastName'
                                        : field;
                            serverErrors[key] = messages[0];
                        });
                        setErrors(serverErrors);
                        Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fix the errors below.' });
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: 'Signup Failed',
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
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.logoContainer}>
                <Text style={styles.logo}>EZRide</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.formContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Sign Up</Text>
                <Text style={styles.subtitle}>Join us and start your journey today</Text>

                <Field label="First Name"    value={firstName} onChangeText={setFirstName} errorKey="firstName" errors={errors} setErrors={setErrors} />
                <Field label="Last Name"     value={lastName}  onChangeText={setLastName}  errorKey="lastName"  errors={errors} setErrors={setErrors} />
                <Field label="Email Address" value={email}     onChangeText={setEmail}     errorKey="email"     errors={errors} setErrors={setErrors} keyboardType="email-address" autoCapitalize="none" />
                <Field label="Phone Number"  value={phone}     onChangeText={setPhone}     errorKey="phone"     errors={errors} setErrors={setErrors} keyboardType="phone-pad" />
                <Field label="Password"      value={password}  onChangeText={setPassword}  errorKey="password"  errors={errors} setErrors={setErrors} secureTextEntry />
                <Field label="Confirm Password" value={confirm} onChangeText={setConfirm}  errorKey="confirm"   errors={errors} setErrors={setErrors} secureTextEntry />

                <Button
                    title={signingUp ? 'Creating Account...' : 'Sign Up'}
                    onPress={handleSignup}
                    disabled={signingUp}
                    style={styles.button}
                    textStyle={styles.buttonText}
                />

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.linkRow}>
                    <Text style={styles.linkText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkBold}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.helpBtn}>
                <Text style={styles.helpText}>Need Help?</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root:           { flex: 1, backgroundColor: '#FFFFFF' },
    logoContainer:  { alignItems: 'center', paddingTop: 56, paddingBottom: 16 },
    logo:           { fontSize: 36, fontFamily: Fonts.bold, color: '#1D3461', letterSpacing: 2 },
    formContainer:  { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 20 },
    title:          { fontSize: 26, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 6 },
    subtitle:       { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', marginBottom: 28 },
    fieldWrapper:   { marginBottom: 14 },
    input:          { },
    inputError:     { borderColor: '#EF4444' },
    errorText:      { fontSize: 11, color: '#EF4444', fontFamily: Fonts.regular, marginTop: 4, marginLeft: 2 },
    button:         { marginTop: 4, marginBottom: 20, borderRadius: 8 },
    buttonText:     { color: '#111111', fontFamily: Fonts.semiBold, fontSize: 16 },
    dividerRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine:    { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
    dividerText:    { marginHorizontal: 12, fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    linkRow:        { flexDirection: 'row', justifyContent: 'center' },
    linkText:       { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62' },
    linkBold:       { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D3461' },
    helpBtn:        { alignItems: 'center', paddingBottom: 40 },
    helpText:       { fontSize: 13, fontFamily: Fonts.regular, color: '#1D3461', textDecorationLine: 'underline' },
});

export default SignupScreen;
