import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {navigationRef} from './navigationRef';
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import MainNavigator from './MainNavigator';
import ProfileScreen from '../screens/settings/ProfileScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import PostRideScreen from '../screens/driver/PostRideScreen';
import AvailableRidesScreen from '../screens/user/AvailableRidesScreen';
import RideDetailScreen from '../screens/driver/RideDetailScreen';
import RideHistoryScreen from '../screens/user/RideHistoryScreen';
import ReviewScreen from '../screens/user/ReviewScreen';
import ChatsScreen from "../screens/chat/ChatsScreen";
import ChatDetailScreen from "../screens/chat/ChatDetailScreen";
import MarketplaceScreen from "../screens/buysell/MarketplaceScreen";
import FeaturedPostsScreen from "../screens/buysell/FeaturedPostsScreen";
import CarDetailScreen from "../screens/buysell/CarDetailScreen";
import SellerProfileScreen from "../screens/buysell/SellerProfileScreen";
import SellCarScreen from "../screens/buysell/SellCarScreen";
import TopUpScreen from "../screens/user/TopUpScreen";
import HistoryScreen from "../screens/user/HistoryScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import HelpSupportScreen from "../screens/settings/HelpSupportScreen";
import DriverOnboardingScreen from '../screens/driver/DriverOnboardingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName="Splash">
                <Stack.Screen name="Splash" component={SplashScreen}/>
                <Stack.Screen name="Onboarding" component={OnboardingScreen}/>
                <Stack.Screen name="RoleSelect" component={RoleSelectScreen}/>
                <Stack.Screen name="Login" component={LoginScreen}/>
                <Stack.Screen name="OTP" component={OTPScreen}/>
                <Stack.Screen name="Signup" component={SignupScreen}/>

                <Stack.Screen name="Main" component={MainNavigator}/>
                <Stack.Screen name="Profile" component={ProfileScreen}/>
                <Stack.Screen name="EditProfile" component={EditProfileScreen}/>

                <Stack.Screen name="PostRide" component={PostRideScreen}/>
                <Stack.Screen name="AvailableRides" component={AvailableRidesScreen}/>
                <Stack.Screen name="RideDetail" component={RideDetailScreen}/>
                <Stack.Screen name="RideHistory" component={RideHistoryScreen}/>
                <Stack.Screen name="Review" component={ReviewScreen}/>

                <Stack.Screen name="Chats" component={ChatsScreen}/>
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen}/>

                <Stack.Screen name="Marketplace" component={MarketplaceScreen}/>
                <Stack.Screen name="FeaturedPosts" component={FeaturedPostsScreen}/>
                <Stack.Screen name="CarDetail" component={CarDetailScreen}/>
                <Stack.Screen name="SellerProfile" component={SellerProfileScreen}/>
                <Stack.Screen name="SellCar" component={SellCarScreen}/>

                <Stack.Screen name="TopUp" component={TopUpScreen}/>
                <Stack.Screen name="History" component={HistoryScreen}/>
                <Stack.Screen name="Settings" component={SettingsScreen}/>
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen}/>
                <Stack.Screen name="DriverOnboarding" component={DriverOnboardingScreen}/>

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
