import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';

import useAuthStore from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import AmbulanceNavigator from './AmbulanceNavigator';
import HospitalNavigator from './HospitalNavigator';
import VolunteerNavigator from './VolunteerNavigator';
import DonorNavigator from './DonorNavigator';
import AdminNavigator from './AdminNavigator';
import { COLORS, USER_ROLES } from '../utils/constants';

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading, loadStoredAuth, user } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Determine which navigator to show based on user role
  const getRoleNavigator = () => {
    if (!user) return UserNavigator;

    switch (user.role) {
      case USER_ROLES.AMBULANCE:
        return AmbulanceNavigator;
      case USER_ROLES.HOSPITAL:
        return HospitalNavigator;
      case USER_ROLES.VOLUNTEER:
        return VolunteerNavigator;
      case USER_ROLES.DONOR:
        return DonorNavigator;
      case USER_ROLES.ADMIN:
        return AdminNavigator;
      case USER_ROLES.USER:
      default:
        return UserNavigator;
    }
  };

  const MainNavigator = getRoleNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;