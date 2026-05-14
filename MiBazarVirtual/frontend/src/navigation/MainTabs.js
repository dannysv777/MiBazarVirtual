import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import HomeScreen from '../screens/home/HomeScreen';
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
  Perfil: ['person', 'person-outline'],
};

export default function MainTabs() {
  const cartCount = 0;
  // TODO Part 2: const { itemCount } = useCart(); use itemCount for badge

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
        component={PlaceholderScreen}
        initialParams={{ text: 'Carrito - Parte 2' }}
        options={{ tabBarBadge: cartCount > 0 ? cartCount : undefined }}
      />
      <Tab.Screen
        name="Pedidos"
        component={PlaceholderScreen}
        initialParams={{ text: 'Pedidos - Parte 2' }}
      />
      <Tab.Screen
        name="Perfil"
        component={PlaceholderScreen}
        initialParams={{ text: 'Perfil - Parte 3' }}
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
    </Stack.Navigator>
  );
}

function SearchCatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductList" component={ProductListScreen} initialParams={{ title: 'Productos' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
    </Stack.Navigator>
  );
}

function PlaceholderScreen({ route }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{route.params?.text}</Text>
    </View>
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
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  placeholderText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
});
