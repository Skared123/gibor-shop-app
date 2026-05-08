import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NavigationDrawer() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

  const { isDrawerOpen, closeDrawer, user, logout, pendingOrdersCount } = useAppData();
  const [showModal, setShowModal] = React.useState(isDrawerOpen);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDrawerOpen) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [isDrawerOpen, DRAWER_WIDTH]);

  const isActivePath = (itemPath: string) => {
    if (itemPath === '/' && pathname === '/') return true;
    if (itemPath !== '/' && pathname.startsWith(itemPath)) return true;
    return false;
  };

  const navigateTo = (path: string) => {
    closeDrawer();
    router.push(path as any);
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    router.replace('/(auth)/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/' },
    { label: 'Catálogo Global', icon: 'inventory-2', path: '/products' },
    { label: 'Mis Productos', icon: 'category', path: '/my-products' },
    { label: 'Shops', icon: 'storefront', path: '/stores' },
    { label: 'Pedidos Pendientes', icon: 'pending-actions', path: '/pending-orders', badge: pendingOrdersCount },
    { label: 'Historial de Pedidos', icon: 'history', path: '/orders' },
    { label: 'Mis Cupones', icon: 'local-offer', path: '/coupons', isSpecial: true },
  ];

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'GS';

  return (
    <Modal
      transparent
      visible={showModal}
      onRequestClose={closeDrawer}
      animationType="none"
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            {
              width: DRAWER_WIDTH,
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* User Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.email.split('@')[0] || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
            </View>
          </View>

          {/* Navigation Links */}
          <View style={styles.navLinks}>
            {menuItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                    item.isSpecial && styles.specialItem,
                    isActive && item.isSpecial && styles.specialItemActive,
                  ]}
                  onPress={() => navigateTo(item.path)}
                >
                  <View>
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color={
                        isActive
                          ? item.isSpecial ? Theme.colors.onPrimaryContainer : Theme.colors.primary
                          : Theme.colors.onSurfaceVariant
                      }
                    />
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.navLabel,
                      isActive && styles.navLabelActive,
                      isActive && item.isSpecial && styles.specialLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color={Theme.colors.error} />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawerPanel: {
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
  },
  profileHeader: {
    padding: 24,
    backgroundColor: '#f6f3f2',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e2e1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  userName: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  userEmail: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  navLinks: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 16,
  },
  navItemActive: {
    backgroundColor: '#f0eded',
  },
  navLabel: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurfaceVariant,
  },
  navLabelActive: {
    color: Theme.colors.onSurface,
    fontWeight: '700',
  },
  specialItem: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  specialItemActive: {
    backgroundColor: 'rgba(242, 153, 74, 0.15)',
    borderColor: Theme.colors.primaryContainer,
  },
  specialLabelActive: {
    color: Theme.colors.onPrimaryContainer,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e2e1',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 16,
  },
  logoutText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.error,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#ba1a1a',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
});
