import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

export default function FocusAwareStatusBar({
  style = 'dark',
  backgroundColor = 'transparent',
  translucent = true,
}) {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    RNStatusBar.setBarStyle(style === 'light' ? 'light-content' : 'dark-content', true);

    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(translucent);
      RNStatusBar.setBackgroundColor(backgroundColor, true);
    }
  }, [backgroundColor, isFocused, style, translucent]);

  if (!isFocused) return null;

  return <StatusBar style={style} backgroundColor={backgroundColor} translucent={translucent} />;
}
