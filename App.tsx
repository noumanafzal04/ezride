import React from 'react';
import { StatusBar, useColorScheme, View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import ErrorBoundary from './src/components/ErrorBoundary';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
        mutations: {
            retry: 0,
        },
    },
});

const { width } = Dimensions.get('window');

const toastConfig = {
    success: ({ text1, text2 }: any) => (
        <View style={[styles.toast, { borderLeftColor: '#16A34A' }]}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 ? <Text style={styles.toastSubtitle}>{text2}</Text> : null}
        </View>
    ),
    error: ({ text1, text2 }: any) => (
        <View style={[styles.toast, { borderLeftColor: '#DC2626' }]}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 ? <Text style={styles.toastSubtitle}>{text2}</Text> : null}
        </View>
    ),
    info: ({ text1, text2 }: any) => (
        <View style={[styles.toast, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.toastTitle}>{text1}</Text>
            {text2 ? <Text style={styles.toastSubtitle}>{text2}</Text> : null}
        </View>
    ),
};

const styles = StyleSheet.create({
    toast: {
        width: width - 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderLeftWidth: 5,
        paddingHorizontal: 16,
        paddingVertical: 14,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    toastTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    toastSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
});

function App() {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AppProvider>
                    <SafeAreaProvider>
                        <StatusBar
                            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                            backgroundColor="transparent"
                            translucent
                        />
                        <AppNavigator />
                        <Toast
                            config={toastConfig}
                            position="top"
                            topOffset={56}
                            visibilityTime={3000}
                        />
                    </SafeAreaProvider>
                </AppProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
