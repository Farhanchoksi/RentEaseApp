import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { ActivityIndicator, View, Text, StyleSheet, Animated, Easing } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LoginScreen from './src/LoginScreenTest';
import AdminDrawer from './src/AdminDrawer';
import TenantBills from './src/TenantBills';
import { requestUserPermission, getFcmToken, setupNotificationListeners } from './src/NotificationService';

const Stack = createNativeStackNavigator();
const bannerIcon = '🏠';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [dotCount, setDotCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    requestUserPermission().then((enabled) => {
      if (enabled) {
        getFcmToken().then(token => {
          console.log('FCM Token:', token);
        });
      }
    });
    setupNotificationListeners();
    const unsubscribe = auth().onAuthStateChanged(async (usr) => {
      setUser(usr);
      if (usr && usr.phoneNumber) {
        try {
          const snap = await firestore().collection('users').doc(usr.phoneNumber).get();
          const data = snap.data();
          setRole(data && data.role ? data.role : null);
        } catch (error) {
          console.log('Error fetching role:', error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [scaleAnim]);

  useEffect(() => {
    const interval = setInterval(() => setDotCount(prev => (prev + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  if (initializing || (user !== null && role === null)) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Text style={[styles.bannerIcon, { transform: [{ scale: scaleAnim }] }]}>{bannerIcon}</Animated.Text>
        <Text style={styles.loadingTitle}>RentEase</Text>
        <ActivityIndicator size="large" color="#6c63ff" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>
          Loading your dashboard{'.'.repeat(dotCount)}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : role === 'admin' ? (
          <Stack.Screen name="Drawer" component={AdminDrawer} />
        ) : (
          <Stack.Screen name="Tenant">
            {() => <TenantBills onLogout={() => auth().signOut()} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fe' },
  bannerIcon: { fontSize: 64, color: '#6c63ff' },
  loadingTitle: { fontSize: 28, color: '#6c63ff', fontWeight: 'bold', marginTop: 10 },
  loadingIndicator: { marginTop: 20 },
  loadingText: { fontSize: 18, color: '#6c63ff', marginTop: 15 },
});
