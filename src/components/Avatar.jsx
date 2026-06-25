import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';

/**
 * Circular avatar with graceful fallbacks:
 *  - shows the photo at `uri` if it loads,
 *  - else the first letter of `name`,
 *  - else a person icon.
 *
 * Props: uri, name, size (default 44), bg, color, style.
 */
const Avatar = ({ uri, name, size = 44, bg = '#FFF4C2', color = '#07163B', style }) => {
    const [failed, setFailed] = useState(false);
    const dim = { width: size, height: size, borderRadius: size / 2 };
    const initial = (name?.trim?.()?.[0] || '').toUpperCase();
    const showImg = !!uri && !failed;

    return (
        <View style={[styles.wrap, dim, { backgroundColor: bg }, style]}>
            {showImg ? (
                <Image
                    source={{ uri }}
                    style={[dim, styles.img]}
                    resizeMode="cover"
                    onError={() => setFailed(true)}
                />
            ) : initial ? (
                <Text style={[styles.initial, { color, fontSize: size * 0.42 }]}>{initial}</Text>
            ) : (
                <Icon name="account" size={size * 0.55} color={color} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    img: { position: 'absolute' },
    initial: { fontFamily: Fonts.bold },
});

export default Avatar;
