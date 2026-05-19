import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { navigationRef } from './navigationService';

const navigationTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      {isLoading ? <SplashScreen /> : isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
