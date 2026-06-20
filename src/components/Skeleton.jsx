import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

// Reusable shimmer placeholder. Compose these to build skeleton cards anywhere.
// e.g. <Skeleton width={38} height={38} radius={19} />
const Skeleton = ({ width = '100%', height = 12, radius = 8, style }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[styles.base, { width, height, borderRadius: radius, opacity }, style]}
        />
    );
};

const styles = StyleSheet.create({
    base: { backgroundColor: '#E6E8EB' },
});

export default Skeleton;
