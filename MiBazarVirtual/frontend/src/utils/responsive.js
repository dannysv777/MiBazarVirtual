import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;

export const scale = (size) => {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  const clamped = Math.min(Math.max(ratio, 0.9), 1.15);
  return Math.round(size * clamped);
};

export const fontScale = (size) => size;

export const wp = (percentage) => (SCREEN_WIDTH * percentage) / 100;

export const hp = (percentage) => (SCREEN_HEIGHT * percentage) / 100;

export const SCREEN_WIDTH_EXPORT = SCREEN_WIDTH;

export const SCREEN_HEIGHT_EXPORT = SCREEN_HEIGHT;

export const isSmallScreen = SCREEN_WIDTH < 375;

export const isLargeScreen = SCREEN_WIDTH > 414;

export const STATUS_BAR_HEIGHT = Platform.OS === 'android'
  ? StatusBar.currentHeight ?? 24
  : 0;
