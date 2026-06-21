import React from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useServiceCategories } from '../../hooks/useServices';

const ServicesScreen = ({ navigation }) => {
    const { data: categories = [], isLoading } = useServiceCategories();

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.cell}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ServiceProviders', { category: item })}
        >
            <View style={styles.iconWrap}>
                <Icon name={item.icon || 'wrench'} size={26} color="#07163B" />
            </View>
            <Text style={styles.cellLabel} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                ) : <View style={styles.headerSide} />}
                <Text style={styles.headerTitle}>Car Services</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MyServiceRequests')} style={styles.headerSide}>
                    <Text style={styles.headerLink}>Requests</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.center}><ActivityIndicator color="#FFD400" /></View>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderItem}
                    numColumns={3}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerSide: { minWidth: 64, justifyContent: 'center' },
    headerLink: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF', textAlign: 'right' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    grid: { padding: 12 },
    row: { gap: 10 },
    cell: {
        flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, marginBottom: 10,
        borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 14, backgroundColor: '#FFFFFF',
    },
    iconWrap: {
        width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF4C2',
        alignItems: 'center', justifyContent: 'center',
    },
    cellLabel: { fontSize: 11.5, fontFamily: Fonts.medium, color: '#202223', textAlign: 'center', paddingHorizontal: 4 },
});

export default ServicesScreen;
