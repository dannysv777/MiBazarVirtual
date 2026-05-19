import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateToCart() {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate('Carrito', { screen: 'Cart' });
}
