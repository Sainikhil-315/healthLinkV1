import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import HospitalDashboardScreen from '../screens/Hospital/HospitalDashboardScreen';
import HospitalEditProfileScreen from '../screens/Hospital/HospitalEditProfileScreen';
import IncomingAlertsScreen from '../screens/Hospital/IncomingAlertsScreen';
import PatientHistoryScreen from '../screens/Hospital/PatientHistoryScreen';
import HospitalSettingsScreen from '../screens/Hospital/HospitalSettingsScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={HospitalDashboardScreen} />
    <Stack.Screen name="EditProfile" component={HospitalEditProfileScreen} />
  </Stack.Navigator>
);

const HospitalNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Incoming') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        }
      })}
    >
      <Tab.Screen name="Home" component={DashboardStack} />
      <Tab.Screen 
        name="Incoming" 
        component={IncomingAlertsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadgeStyle: { backgroundColor: COLORS.primary }
        }}
      />
      <Tab.Screen 
        name="History" 
        component={PatientHistoryScreen}
        options={{
          tabBarLabel: 'Patients'
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={HospitalSettingsScreen}
        options={{
          tabBarLabel: 'Settings'
        }}
      />
    </Tab.Navigator>
  );
};

export default HospitalNavigator;