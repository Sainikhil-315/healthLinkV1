import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import DriverDashboardScreen from '../screens/Ambulance/DriverDashboardScreen';
import ActiveEmergencyScreen from '../screens/Ambulance/ActiveEmergencyScreen';
import NavigationScreen from '../screens/Ambulance/NavigationScreen';
import CompletedTripsScreen from '../screens/Ambulance/CompletedTripsScreen';
import EquipmentStatusScreen from '../screens/Ambulance/EquipmentStatusScreen';
import ProfileSettingsScreen from '../screens/Ambulance/ProfileSettingsScreen';
import IncomingRequestsScreen from '../screens/Ambulance/IncomingRequestScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DriverDashboardScreen} />
    <Stack.Screen name="ActiveEmergency" component={ActiveEmergencyScreen} />
    <Stack.Screen name="Navigation" component={NavigationScreen} />
    <Stack.Screen name="EquipmentStatus" component={EquipmentStatusScreen} />
    <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
  </Stack.Navigator>
);

const AmbulanceNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Emergency') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Trips') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'person' : 'person-outline';
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
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={ActiveEmergencyScreen}
        options={{
          tabBarLabel: 'Active Trip',
          tabBarLabelStyle: { fontWeight: 'bold' },
        }}
      />
      <Tab.Screen
        name="Trips"
        component={CompletedTripsScreen}
        options={{
          tabBarLabel: 'History',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default AmbulanceNavigator;
