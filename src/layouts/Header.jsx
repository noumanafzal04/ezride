import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const Header = ({ title = 'App' }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.primary,  // Yellow header
        paddingVertical: 16,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    title: {
        color: Colors.secondary,  // Dark blue text on yellow
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default Header;
