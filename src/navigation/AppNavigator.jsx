import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import MainNavigator from './MainNavigator';
import ProfileScreen from '../screens/settings/ProfileScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import CreateRequestScreen from '../screens/user/CreateRequestScreen';
import RideOffersScreen from '../screens/user/RideOffersScreen';
import DriverDetailScreen from '../screens/user/DriverDetailScreen';
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

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
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

                <Stack.Screen name="CreateRequest" component={CreateRequestScreen}/>
                <Stack.Screen name="RideOffers" component={RideOffersScreen}/>
                <Stack.Screen name="DriverDetail" component={DriverDetailScreen}/>

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

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
