import React, { useEffect, useRef, useState } from 'react';
import {
    Modal, View, StyleSheet, Animated, PanResponder, Dimensions, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';

const SCREEN_H = Dimensions.get('window').height;

/**
 * Reusable bottom sheet — smooth slide + backdrop fade + swipe-to-dismiss.
 * Pure Animated + PanResponder, so it behaves identically on iOS & Android
 * with no native dependencies.
 *
 * Props: visible, onClose, children, sheetStyle
 */
const BottomSheet = ({ visible, onClose, children, sheetStyle }) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(SCREEN_H)).current;
    const backdrop   = useRef(new Animated.Value(0)).current;
    const [rendered, setRendered] = useState(false);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const closingRef = useRef(false);

    const animateIn = () => {
        closingRef.current = false;
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, stiffness: 160, damping: 20, mass: 0.7 }),
            Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
    };

    const animateOut = (after) => {
        if (closingRef.current) return;
        closingRef.current = true;
        Animated.parallel([
            Animated.timing(translateY, { toValue: SCREEN_H, duration: 230, useNativeDriver: true }),
            Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(({ finished }) => {
            closingRef.current = false;
            if (finished) {
                setRendered(false);
                after && after();
            }
        });
    };

    const requestClose = () => animateOut(() => onCloseRef.current && onCloseRef.current());

    // Mount on open, animate out on close
    useEffect(() => {
        if (visible && !rendered) setRendered(true);
        else if (!visible && rendered) animateOut();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Run the entrance animation once mounted
    useEffect(() => {
        if (rendered) {
            translateY.setValue(SCREEN_H);
            backdrop.setValue(0);
            requestAnimationFrame(animateIn);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rendered]);

    const pan = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 120 || g.vy > 0.6) {
                    animateOut(() => onCloseRef.current && onCloseRef.current());
                } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, stiffness: 200, damping: 22 }).start();
                }
            },
        })
    ).current;

    if (!rendered) return null;

    return (
        <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={requestClose}>
            <View style={styles.root}>
                <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} />
                </Animated.View>

                <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: Math.max(insets.bottom, 20), transform: [{ translateY }] }]}>
                    <View style={styles.handleArea} {...pan.panHandlers}>
                        <View style={styles.handle} />
                    </View>
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    root:       { flex: 1, justifyContent: 'flex-end' },
    backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        // paddingBottom is applied dynamically from the safe-area inset.
    },
    handleArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
    handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
});

export default BottomSheet;
