import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';

import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        setShowOnboarding(completed !== 'true');
      } catch {
        setShowOnboarding(false);
      }
    };

    checkOnboarding();
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding === null) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={showOnboarding ? 'Onboarding' : 'Login'}>
      <Stack.Screen
        name="Onboarding"
      >
        {(props) => <OnboardingScreen {...props} onFinish={markOnboardingSeen} />}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
