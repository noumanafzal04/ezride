import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const Footer = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>© 2025 MyApp</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.secondary,  // Dark blue footer
        paddingVertical: 12,
        alignItems: 'center',
    },
    text: {
        color: Colors.white,
        fontSize: 12,
    },
});

export default Footer;
