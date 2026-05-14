import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isLoading ? <SplashScreen /> : isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
