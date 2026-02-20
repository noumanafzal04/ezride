import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import Fonts from '../constants/fonts';

const Button = ({ title, onPress, style, textStyle, variant = 'primary' }) => {
    return (
        <TouchableOpacity
            style={[styles.button, variant === 'outline' && styles.outline, style]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Text style={[styles.text, variant === 'outline' && styles.outlineText, textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    text: {
        color: Colors.secondary,
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    outlineText: {
        color: Colors.primary,
    },
});

export default Button;
