import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import Fonts from '../constants/fonts';

const Input = ({ style, placeholderTextColor = '#202223', ...props }) => {
    return (
        <View style={[styles.container, style]}>
            <TextInput
                style={styles.input}
                placeholderTextColor={placeholderTextColor}
                {...props}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        width: '100%',
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#3B3E40',
    },
});

export default Input;
