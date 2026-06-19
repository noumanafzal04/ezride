import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Colors from '../constants/colors';
import Fonts from '../constants/fonts';
import BottomSheet from './BottomSheet';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const ReviewSheet = ({ visible, onClose, onSubmit, submitting, title = 'Rate your ride', subtitle }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    // Reset whenever the sheet is freshly opened (BottomSheet unmounts on close)
    const reset = () => { setRating(0); setReview(''); };

    return (
        <BottomSheet visible={visible} onClose={() => { reset(); onClose(); }}>
            <View style={styles.body}>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

                {/* Stars */}
                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map(n => (
                        <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                            <Icon
                                name={n <= rating ? 'star' : 'star-outline'}
                                size={38}
                                color={n <= rating ? '#FFC107' : '#D7DBDE'}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.ratingLabel}>{LABELS[rating] || 'Tap to rate'}</Text>

                {/* Comment */}
                <View style={styles.noteBox}>
                    <TextInput
                        style={styles.noteInput}
                        placeholder="Add a comment (optional)"
                        placeholderTextColor="#9CA3AF"
                        value={review}
                        onChangeText={setReview}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={[styles.submitBtn, (rating === 0 || submitting) && styles.submitBtnDisabled]}
                    onPress={() => onSubmit(rating, review.trim())}
                    disabled={rating === 0 || submitting}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={() => { reset(); onClose(); }}>
                    <Text style={styles.skipText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    body:        { paddingHorizontal: 20, paddingTop: 4, alignItems: 'center' },
    title:       { fontSize: 17, fontFamily: Fonts.semiBold, color: Colors.textDark, marginBottom: 4 },
    subtitle:    { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textSecondary, marginBottom: 18, textAlign: 'center' },
    stars:       { flexDirection: 'row', gap: 8, marginTop: 8 },
    ratingLabel: { fontSize: 13, fontFamily: Fonts.medium, color: Colors.textSecondary, marginTop: 8, marginBottom: 18 },
    noteBox:     { width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#F9F9F9', marginBottom: 18 },
    noteInput:   { minHeight: 80, padding: 12, fontSize: 14, fontFamily: Fonts.regular, color: Colors.textDark },
    submitBtn:   { width: '100%', backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: '#E5E7EB' },
    submitText:  { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.textOnPrimary },
    skipBtn:     { paddingVertical: 12, marginTop: 4 },
    skipText:    { fontSize: 14, fontFamily: Fonts.medium, color: Colors.textSecondary },
});

export default ReviewSheet;
