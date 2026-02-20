import React, {useState} from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const FAQS = [
    {
        q: 'How do I create a ride request?',
        a: 'Go to the Home screen and tap "Find a Ride" or use the + button at the bottom to open the Create Request screen.'
    },
    {
        q: 'How do I cancel a ride?',
        a: 'Open the Rides tab, find your active ride and tap "Cancel Request". Note that cancellations may affect your rating.'
    },
    {
        q: 'How do I top up my wallet?',
        a: 'Go to Home screen and tap "Top Up" on the wallet card. Choose an amount and payment method to proceed.'
    },
    {
        q: 'How do I post a car for sale?',
        a: 'Go to the Buy/Sell tab, switch to "Sell Cars" and tap "Sell Your Car" button at the bottom.'
    },
    {
        q: 'How do I contact a driver?',
        a: 'Open the Driver Detail screen from any offer and use the Chat or Call Driver buttons at the bottom.'
    },
];

const CONTACT = [
    {icon: 'whatsapp', label: 'WhatsApp Support', value: '+92 300 1234567', color: '#25D366', bg: '#E8FFF2'},
    {icon: 'email-outline', label: 'Email Us', value: 'support@ezride.pk', color: '#1D6AFF', bg: '#EEF4FF'},
    {icon: 'phone-outline', label: 'Call Helpline', value: '0800-39743', color: '#07163B', bg: '#FFFBEA'},
];

const HelpSupportScreen = ({navigation}) => {
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{width: 24}}/>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>

                {/* Hero Banner */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroIcon}>
                        <Icon name="headset" size={36} color="#FFD400"/>
                    </View>
                    <Text style={styles.heroTitle}>How can we help you?</Text>
                    <Text style={styles.heroSubtitle}>Find answers or reach out to our support team</Text>
                </View>

                {/* Contact Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <View style={styles.contactGrid}>
                        {CONTACT.map(c => (
                            <TouchableOpacity key={c.label} style={[styles.contactCard, {backgroundColor: c.bg}]}>
                                <Icon name={c.icon} size={24} color={c.color}/>
                                <Text style={[styles.contactLabel, {color: c.color}]}>{c.label}</Text>
                                <Text style={styles.contactValue}>{c.value}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* FAQs */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    <View style={styles.faqCard}>
                        {FAQS.map((faq, i) => (
                            <View key={i} style={[styles.faqItem, i < FAQS.length - 1 && styles.faqBorder]}>
                                <TouchableOpacity
                                    style={styles.faqQuestion}
                                    onPress={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                                    <Icon
                                        name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                                        size={18}
                                        color="#5D5F62"
                                    />
                                </TouchableOpacity>
                                {openFaq === i && (
                                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Report Issue */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.reportCard}>
                        <View style={styles.reportLeft}>
                            <View style={styles.reportIconBox}>
                                <Icon name="flag-outline" size={20} color="#D83F54"/>
                            </View>
                            <View>
                                <Text style={styles.reportTitle}>Report an Issue</Text>
                                <Text style={styles.reportSub}>Something not working? Let us know</Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={18} color="#AAAAAA"/>
                    </TouchableOpacity>
                </View>

            </ScrollView>
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

    heroBanner: {
        backgroundColor: '#1D3461', margin: 16, borderRadius: 20,
        padding: 28, alignItems: 'center', gap: 8,
    },
    heroIcon: {
        width: 70, height: 70, borderRadius: 35,
        backgroundColor: 'rgba(255,212,0,0.15)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    heroTitle: {fontSize: 18, fontFamily: Fonts.bold, color: '#FFFFFF'},
    heroSubtitle: {fontSize: 13, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.65)', textAlign: 'center'},

    section: {paddingHorizontal: 16, marginBottom: 16},
    sectionTitle: {
        fontSize: 15, fontFamily: Fonts.semiBold,
        color: '#07163B', marginBottom: 12,
    },

    contactGrid: {gap: 10},
    contactCard: {
        borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 14,
    },
    contactLabel: {fontSize: 13, fontFamily: Fonts.semiBold, flex: 1},
    contactValue: {fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62'},

    faqCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden',
    },
    faqItem: {paddingHorizontal: 16, paddingVertical: 14},
    faqBorder: {borderBottomWidth: 1, borderBottomColor: '#F5F5F5'},
    faqQuestion: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    },
    faqQuestionText: {flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: '#202223', lineHeight: 20},
    faqAnswer: {
        fontSize: 13, fontFamily: Fonts.regular,
        color: '#5D5F62', lineHeight: 19, marginTop: 10,
    },

    reportCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    reportLeft: {flexDirection: 'row', alignItems: 'center', gap: 14},
    reportIconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#FFF0F2', borderWidth: 1,
        borderColor: 'rgba(216,63,84,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    reportTitle: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 2},
    reportSub: {fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62'},
});

export default HelpSupportScreen;
