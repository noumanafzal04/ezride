import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';

function App() {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <AppProvider>
            <SafeAreaProvider>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                <AppNavigator />
            </SafeAreaProvider>
        </AppProvider>
    );
}

export default App;
