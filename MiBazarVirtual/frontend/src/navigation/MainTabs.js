import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';

import { colors, spacing } from '../theme';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import CartScreen from '../screens/cart/CartScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import HomeScreen from '../screens/home/HomeScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
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
  Carrito: ['cart', 'cart-outline'],
  Pedidos: ['receipt', 'receipt-outline'],
  Mensajes: ['chatbubble', 'chatbubble-outline'],
  Perfil: ['person', 'person-outline'],
};

export default function MainTabs() {
  const { itemCount } = useCart();
  const { unreadCount } = useChat();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const [activeIcon, inactiveIcon] = tabIcons[route.name];
          return <Ionicons name={focused ? activeIcon : inactiveIcon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeCatalogStack} />
      <Tab.Screen name="Buscar" component={SearchCatalogStack} />
      <Tab.Screen
        name="Carrito"
        component={CartScreen}
        options={{ tabBarBadge: itemCount > 0 ? itemCount : undefined }}
      />
      <Tab.Screen
        name="Pedidos"
        component={OrdersStack}
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

function HomeCatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
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

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    height: 64,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
