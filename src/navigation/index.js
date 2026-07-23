import React, { useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../store/AuthContext';
import { COLORS } from '../utils/theme';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import TastePickerScreen from '../screens/TastePickerScreen';
import AdminMailConfigScreen from '../screens/AdminMailConfigScreen';
import MiniPlayer from '../components/MiniPlayer';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import GroupsScreen from '../screens/GroupsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Stack Screens (không nằm trong tab)
import PlayerScreen from '../screens/PlayerScreen';
import LyricsScreen from '../screens/LyricsScreen';
import SongDetailScreen from '../screens/SongDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import SnippetCreatorScreen from '../screens/SnippetCreatorScreen';
import UploadStudioScreen from '../screens/UploadStudioScreen';
import MyUploadsScreen from '../screens/MyUploadsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICON = {
  Home: { active: 'home', inactive: 'home-outline' },
  Feed: { active: 'radio', inactive: 'radio-outline' },
  Groups: { active: 'people', inactive: 'people-outline' },
  Library: { active: 'library', inactive: 'library-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.accentPurple,
          tabBarInactiveTintColor: COLORS.foregroundSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.bgSurface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICON[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
        <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: 'Feed' }} />
        <Tab.Screen name="Groups" component={GroupsScreen} options={{ tabBarLabel: 'Nhóm' }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Thư viện' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgSurface },
        headerTintColor: COLORS.foreground,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {/* Tab chính */}
      <Stack.Screen name="App" component={MainTabs} options={{ headerShown: false }} />

      {/* Màn hình Player (full screen modal) */}
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="Lyrics"
        component={LyricsScreen}
        options={{ title: 'Lời bài hát', presentation: 'modal' }}
      />

      {/* Chi tiết & Tạo */}
      <Stack.Screen name="SongDetail" component={SongDetailScreen} options={{ title: 'Chi tiết bài hát' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SnippetCreator"
        component={SnippetCreatorScreen}
        options={{ title: 'Tạo Snippet', presentation: 'modal' }}
      />
      <Stack.Screen name="UploadStudio" component={UploadStudioScreen} options={{ title: 'Upload Nhạc' }} />
      <Stack.Screen name="MyUploads" component={MyUploadsScreen} options={{ title: 'Bài hát của tôi' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
      <Stack.Screen name="AdminMailConfig" component={AdminMailConfigScreen} options={{ title: 'Cấu hình mail' }} />
    </Stack.Navigator>
  );
}

export const navigationRef = createNavigationContainerRef();

export default function AppNavigator() {
  const { user, token, tasteTags, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.accentPurple} />
      </View>
    );
  }

  const isAuthenticated = !!(token && user);
  const needsTastePicker = isAuthenticated && (!tasteTags || tasteTags.length === 0);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash ? (
          <Stack.Screen name="Splash">
            {(props) => <SplashScreen {...props} onFinish={() => setShowSplash(false)} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : needsTastePicker ? (
          <Stack.Screen name="TastePicker" component={TastePickerScreen} />
        ) : (
          <Stack.Screen name="AppRoot" component={AppStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
