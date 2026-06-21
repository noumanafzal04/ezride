import React, {useState} from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';

const AMOUNTS = ['500', '1,000', '2,000', '5,000', '10,000', '20,000'];

const PAYMENT_METHODS = [
    {id: 'jazzcash', label: 'JazzCash', icon: 'cellphone'},
    {id: 'easypaisa', label: 'Easypaisa', icon: 'cellphone-wireless'},
    {id: 'card', label: 'Debit / Credit Card', icon: 'credit-card-outline'},
    {id: 'bank', label: 'Bank Transfer', icon: 'bank-outline'},
];

const TopUpScreen = ({navigation}) => {
    const insets = useSafeAreaInsets();
    const [selectedAmount, setSelectedAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('jazzcash');

    const displayAmount = selectedAmount || customAmount;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Top Up</Text>
                <View style={{width: 24}}/>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 120}}>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceAmount}>RS 250,000</Text>
                    <View style={styles.balanceBadge}>
                        <Icon name="wallet-outline" size={14} color="#109F2A"/>
                        <Text style={styles.balanceBadgeText}>Wallet Active</Text>
                    </View>
                </View>

                <View style={styles.body}>

                    {/* Select Amount */}
                    <Text style={styles.sectionLabel}>Select Amount</Text>
                    <View style={styles.amountsGrid}>
                        {AMOUNTS.map(amt => (
                            <TouchableOpacity
                                key={amt}
                                style={[styles.amountChip, selectedAmount === amt && styles.amountChipActive]}
                                onPress={() => {
                                    setSelectedAmount(amt);
                                    setCustomAmount('');
                                }}
                            >
                                <Text
                                    style={[styles.amountChipText, selectedAmount === amt && styles.amountChipTextActive]}>
                                    PKR {amt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount */}
                    <Text style={styles.sectionLabel}>Or Enter Custom Amount</Text>
                    <View style={styles.customAmountRow}>
                        <Text style={styles.currencyLabel}>PKR</Text>
                        <TextInput
                            style={styles.customInput}
                            placeholder="Enter amount"
                            placeholderTextColor="#AAAAAA"
                            keyboardType="numeric"
                            value={customAmount}
                            onChangeText={(v) => {
                                setCustomAmount(v);
                                setSelectedAmount('');
                            }}
                        />
                    </View>

                    {/* Payment Method */}
                    <Text style={styles.sectionLabel}>Payment Method</Text>
                    <View style={styles.methodsCard}>
                        {PAYMENT_METHODS.map((method, i) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[styles.methodRow, i < PAYMENT_METHODS.length - 1 && styles.methodBorder]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.methodIconBox}>
                                    <Icon name={method.icon} size={20} color="#07163B"/>
                                </View>
                                <Text style={styles.methodLabel}>{method.label}</Text>
                                <View style={[styles.radio, selectedMethod === method.id && styles.radioActive]}>
                                    {selectedMethod === method.id && <View style={styles.radioDot}/>}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Summary */}
                    {displayAmount !== '' && (
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Top Up Amount</Text>
                                <Text style={styles.summaryValue}>PKR {displayAmount}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Processing Fee</Text>
                                <Text style={styles.summaryValue}>PKR 0</Text>
                            </View>
                            <View style={styles.summaryDivider}/>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryTotal}>Total</Text>
                                <Text style={styles.summaryTotalValue}>PKR {displayAmount}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Proceed Button */}
            <View style={[styles.bottomBtn, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[styles.proceedBtn, !displayAmount && styles.proceedBtnDisabled]}
                    disabled={!displayAmount}
                    activeOpacity={0.85}
                >
                    <Text style={styles.proceedBtnText}>Proceed to Pay</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F5F5F7'},
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: {fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B'},

    balanceCard: {
        backgroundColor: '#1D3461',
        margin: 16, borderRadius: 20, padding: 24,
        alignItems: 'center', gap: 8,
    },
    balanceLabel: {fontSize: 13, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.7)'},
    balanceAmount: {fontSize: 32, fontFamily: Fonts.bold, color: '#FFD400'},
    balanceBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(16,159,42,0.15)',
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,159,42,0.3)',
    },
    balanceBadgeText: {fontSize: 12, fontFamily: Fonts.medium, color: '#109F2A'},

    body: {paddingHorizontal: 16},
    sectionLabel: {
        fontSize: 14, fontFamily: Fonts.semiBold,
        color: '#202223', marginBottom: 12, marginTop: 4,
    },

    amountsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
    },
    amountChip: {
        width: '30%', paddingVertical: 13,
        alignItems: 'center', borderRadius: 12,
        borderWidth: 1, borderColor: '#EAEDEE',
        backgroundColor: '#FFFFFF',
    },
    amountChipActive: {
        backgroundColor: 'rgba(245,214,50,0.12)',
        borderColor: 'rgba(245,214,50,0.7)',
    },
    amountChipText: {fontSize: 13, fontFamily: Fonts.medium, color: '#5D5F62'},
    amountChipTextActive: {color: '#07163B', fontFamily: Fonts.semiBold},

    customAmountRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#D7DBDE',
        borderRadius: 10, backgroundColor: '#FFFFFF',
        overflow: 'hidden', marginBottom: 20,
    },
    currencyLabel: {
        fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B',
        paddingHorizontal: 14, paddingVertical: 14,
        borderRightWidth: 1, borderRightColor: '#D7DBDE',
    },
    customInput: {
        flex: 1, fontSize: 14, fontFamily: Fonts.regular,
        color: '#202223', paddingHorizontal: 14,
    },

    methodsCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', marginBottom: 16,
        overflow: 'hidden',
    },
    methodRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, gap: 14,
    },
    methodBorder: {borderBottomWidth: 1, borderBottomColor: '#F5F5F5'},
    methodIconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#FFFBEA', borderWidth: 1,
        borderColor: '#FFE066', alignItems: 'center', justifyContent: 'center',
    },
    methodLabel: {flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: '#202223'},
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: '#D7DBDE',
        alignItems: 'center', justifyContent: 'center',
    },
    radioActive: {borderColor: '#FFD400'},
    radioDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#FFD400',
    },

    summaryCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', padding: 16,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
    },
    summaryLabel: {fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62'},
    summaryValue: {fontSize: 13, fontFamily: Fonts.medium, color: '#202223'},
    summaryDivider: {height: 1, backgroundColor: '#F0F0F0', marginBottom: 10},
    summaryTotal: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B'},
    summaryTotalValue: {fontSize: 15, fontFamily: Fonts.bold, color: '#07163B'},

    bottomBtn: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    proceedBtn: {
        backgroundColor: '#FFD400', borderRadius: 12,
        paddingVertical: 16, alignItems: 'center',
    },
    proceedBtnDisabled: {backgroundColor: '#F0F0F0'},
    proceedBtnText: {fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111'},
});

export default TopUpScreen;
