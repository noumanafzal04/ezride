import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../constants/colors';
import Fonts from '../constants/fonts';

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // Hook for crash reporting (Sentry/Crashlytics) later
        if (__DEV__) console.error('ErrorBoundary caught:', error, info);
    }

    handleReset = () => this.setState({ hasError: false });

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <View style={styles.root}>
                <View style={styles.iconWrap}>
                    <Icon name="alert-circle-outline" size={48} color={Colors.secondary} />
                </View>
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.subtitle}>
                    An unexpected error occurred. Please try again.
                </Text>
                <TouchableOpacity style={styles.btn} onPress={this.handleReset} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    root:     { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
    iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFFBEA', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title:    { fontSize: 20, fontFamily: Fonts.bold, color: Colors.textDark, marginBottom: 8 },
    subtitle: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    btn:      { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 48 },
    btnText:  { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textOnPrimary },
});

export default ErrorBoundary;
