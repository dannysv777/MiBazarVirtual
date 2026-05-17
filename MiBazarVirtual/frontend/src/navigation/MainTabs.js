import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Animated, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import CartScreen from '../screens/cart/CartScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';
import HomeScreen from '../screens/home/HomeScreen';
import WeeklyPurchaseScreen from '../screens/home/WeeklyPurchaseScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import OrderConfirmationScreen from '../screens/orders/OrderConfirmationScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import CreateProductScreen from '../screens/seller/CreateProductScreen';
import EditProductScreen from '../screens/seller/EditProductScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import SellerStoreScreen from '../screens/seller/SellerStoreScreen';
import StoreDetailScreen from '../screens/stores/StoreDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigation params contract for Part 2/3:
// ProductListScreen: { query?, categoryId?, title? }
// ProductDetailScreen: { productId }
// StoreDetailScreen: { storeId }
// ChatScreen: { conversationId, otherUsername, productId }
// OrderDetailScreen: { orderId, isSeller? }

const tabIcons = {
  Inicio: ['home', 'home-outline'],
  Buscar: ['search', 'search-outline'],
  Favoritos: ['heart', 'heart-outline'],
  Carrito: ['cart', 'cart-outline'],
  Pedidos: ['receipt', 'receipt-outline'],
  'Mis Productos': ['cube', 'cube-outline'],
  Mensajes: ['chatbubble', 'chatbubble-outline'],
  Perfil: ['person', 'person-outline'],
};

const fullScreenRoutes = new Set([
  'Chat',
  'ProductDetail',
  'StoreDetail',
  'OrderDetail',
  'OrderConfirmation',
  'Notifications',
  'CreateProduct',
  'EditProduct',
  'SellerStore',
  'SellerOrders',
  'WeeklyPurchase',
]);

const initialStackScreens = {
  Inicio: 'Home',
  Buscar: 'ProductList',
  Favoritos: 'Favorites',
  'Mis Productos': 'SellerProducts',
  Mensajes: 'Conversations',
  Perfil: 'Profile',
};

export default function MainTabs() {
  const { user } = useAuth();
  const { itemCount, cartPulseKey } = useCart();
  const { unreadCount } = useChat();
  const isBuyer = user?.role === 'BUYER';
  const isSeller = user?.role === 'SELLER';

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} cartPulseKey={cartPulseKey} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeCatalogStack} />
      {isBuyer ? <Tab.Screen name="Buscar" component={SearchCatalogStack} /> : null}
      {isBuyer ? <Tab.Screen name="Favoritos" component={FavoritesStack} /> : null}
      {isBuyer ? (
        <Tab.Screen
          name="Carrito"
          component={CartStack}
          options={{ tabBarBadge: itemCount > 0 ? itemCount : undefined }}
        />
      ) : null}
      {isSeller ? (
        <Tab.Screen
          name="Mis Productos"
          component={SellerProductsStack}
        />
      ) : null}
      <Tab.Screen
        name="Pedidos"
        component={isSeller ? SellerOrdersStack : OrdersStack}
      />
      <Tab.Screen
        name="Mensajes"
        component={ChatStack}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStack}
      />
    </Tab.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation, cartPulseKey }) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(0)).current;
  const cartScale = useRef(new Animated.Value(1)).current;
  const [barWidth, setBarWidth] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const focusedRoute = state.routes[state.index];
  const nestedRouteName = getFocusedRouteNameFromRoute(focusedRoute);
  const bottomInset = Math.max(insets.bottom, 0);
  const tabWidth = barWidth > 0 ? barWidth / state.routes.length : 0;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!tabWidth) return;

    Animated.timing(translateX, {
      toValue: state.index * tabWidth + tabWidth / 2 - 12,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, translateX]);

  useEffect(() => {
    if (!cartPulseKey) return;

    Animated.sequence([
      Animated.spring(cartScale, { toValue: 1.18, friction: 4, tension: 180, useNativeDriver: true }),
      Animated.spring(cartScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  }, [cartPulseKey, cartScale]);

  if (keyboardVisible || fullScreenRoutes.has(nestedRouteName)) {
    return null;
  }

  return (
    <View
      style={[styles.tabBar, { height: 50 + bottomInset, paddingBottom: bottomInset > 0 ? bottomInset : 4 }]}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View style={[styles.activeIndicator, { transform: [{ translateX }] }]} />
      ) : null}

      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const options = descriptor.options;
        const isFocused = state.index === index;
        const [activeIcon, inactiveIcon] = tabIcons[route.name];
        const color = isFocused ? colors.primary : colors.textLight;
        const badge = options.tabBarBadge;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, initialStackScreens[route.name] ? {
              screen: initialStackScreens[route.name],
            } : undefined);
          }
        };

        return (
          <Animated.View key={route.key} style={[styles.tabItemWrap, route.name === 'Carrito' && { transform: [{ scale: cartScale }] }]}>
          <TouchableOpacity
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={styles.iconBox}>
              <Ionicons name={isFocused ? activeIcon : inactiveIcon} size={24} color={color} />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
              {route.name}
            </Text>
          </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

function HomeCatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="WeeklyPurchase" component={WeeklyPurchaseScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerStore" component={SellerStoreScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
    </Stack.Navigator>
  );
}

function SearchCatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductList" component={ProductListScreen} initialParams={{ title: 'Productos' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

function SellerProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="SellerStore" component={SellerStoreScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function SellerOrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="SellerProducts" component={SellerProductsScreen} />
      <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} />
      <Stack.Screen name="SellerStore" component={SellerStoreScreen} />
      <Stack.Screen name="CreateProduct" component={CreateProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    paddingTop: 5,
    zIndex: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingTop: 10,
  },
  tabItemWrap: {
    flex: 1,
  },
  activeIndicator: {
    position: 'absolute',
    top: 3,
    left: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  iconBox: {
    width: 32,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.error,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
