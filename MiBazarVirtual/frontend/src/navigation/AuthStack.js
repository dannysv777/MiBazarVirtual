import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';

import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SplashScreen from '../screens/auth/SplashScreen';

const Stack = createStackNavigator();
// Versioned so the final APK can show onboarding once after older local test builds.
const ONBOARDING_KEY = 'mibazarvirtual:onboarding_seen:v2';

export default function AuthStack() {
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        setHasSeenOnboarding(false);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasSeenOnboarding ? 'Login' : 'Onboarding'}>
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
