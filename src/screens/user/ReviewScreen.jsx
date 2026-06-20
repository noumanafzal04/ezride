import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import useRideDetail from '../../hooks/useRideDetail';
import { useRateBooking } from '../../hooks/useReview';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const ReviewScreen = ({ navigation, route }) => {
    const { bookingId, ridePostId, title = 'Rate your driver' } = route.params || {};
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const { data: ride } = useRideDetail(ridePostId);
    const subtitle = ride ? `${ride.from?.city?.name || ''} → ${ride.to?.city?.name || ''}` : '';

    const rate = useRateBooking({
        onSuccess: () => { Toast.show({ type: 'success', text1: 'Thanks for your review!' }); navigation.goBack(); },
        onError: (err) => Toast.show({ type: 'error', text1: 'Couldn’t submit', text2: err.response?.data?.message || 'Try again.' }),
    });

    const submit = () => {
        if (!rating) { Toast.show({ type: 'info', text1: 'Tap a star to rate' }); return; }
        rate.mutate({ id: bookingId, rating, review: comment });
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle.trim() && subtitle.trim() !== '→' && <Text style={styles.subtitle}>{subtitle}</Text>}

                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
                            <Icon
                                name={i <= rating ? 'star' : 'star-outline'}
                                size={40}
                                color={i <= rating ? '#FFC107' : '#D6DADF'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.ratingLabel}>{LABELS[rating]}</Text>

                <TextInput
                    style={styles.comment}
                    placeholder="Add a comment (optional)"
                    placeholderTextColor="#AAAAAA"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.submitBtn, !rating && styles.submitBtnDisabled]}
                    onPress={submit}
                    disabled={rate.isPending}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>{rate.isPending ? 'Submitting…' : 'Submit Review'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    body: { padding: 24, alignItems: 'center' },
    title: { fontSize: 18, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 8 },
    subtitle: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', marginTop: 6 },
    stars: { flexDirection: 'row', gap: 8, marginTop: 28 },
    ratingLabel: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 12, height: 20 },
    comment: {
        width: '100%', minHeight: 96, borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 12,
        padding: 14, marginTop: 24, fontSize: 14, fontFamily: Fonts.regular, color: '#202223',
        textAlignVertical: 'top',
    },
    submitBtn: {
        width: '100%', backgroundColor: '#FFD400', borderRadius: 12,
        paddingVertical: 15, alignItems: 'center', marginTop: 20,
    },
    submitBtnDisabled: { backgroundColor: '#F0F1F3' },
    submitText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default ReviewScreen;
