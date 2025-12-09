import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import PermissionsScreen from '../screens/Auth/PermissionsScreen';
import { SCREENS } from '../utils/constants';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
      initialRouteName={SCREENS.LOGIN}
    >
      <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
      <Stack.Screen name={SCREENS.REGISTER} component={RegisterScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;