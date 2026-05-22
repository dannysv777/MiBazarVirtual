import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getPushTokens() {
  if (!Device.isDevice) {
    return [];
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'MiBazarVirtual',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4332',
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;

  if (finalStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    return [];
  }

  const tokens = [];

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId
      ?? undefined;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

    tokens.push({
      token: token.data,
      tokenType: 'EXPO',
      platform: Platform.OS,
      deviceId: Constants.sessionId ?? Device.osInternalBuildId ?? null,
    });
  } catch (expoError) {
    console.warn('Expo push token could not be created', expoError);
  }

  try {
    const nativeToken = await Notifications.getDevicePushTokenAsync();

    tokens.push({
      token: nativeToken.data,
      tokenType: 'NATIVE',
      platform: Platform.OS,
      deviceId: Constants.sessionId ?? Device.osInternalBuildId ?? null,
    });
  } catch (nativeError) {
    console.warn('Native push token could not be created', nativeError);
  }

  return tokens;
}
