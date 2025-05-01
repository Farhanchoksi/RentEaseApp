import React, { useEffect, useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BillForm from './BillForm';
import UserDashboard from './UserDashboard';
import LoginScreen from './LoginScreen';

function DashboardScreen(props) {
  // For now, pass a dummy admin user (replace with real user logic as needed)
  const user = { role: 'admin', name: 'Admin' };
  return <UserDashboard {...props} user={user} onLogout={props.onLogout} />;
}

function BillFormScreen({ tenants }) {
  // Only show BillForm, pass tenants and onBillCreated as needed
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.header}>Create Bill</Text>
      <BillForm tenants={tenants} />
    </View>
  );
}

function TenantsScreen(props) {
  // Pass the same dummy admin user as DashboardScreen to ensure tenants load
  const user = { role: 'admin', name: 'Admin' };
  return <UserDashboard {...props} showTenantsOnly user={user} onLogout={props.onLogout} />;
}

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  // Example user info (replace with real user data if available)
  const userName = 'Admin';
  const userPhone = '+91-XXXXXXXXXX';

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{flex:1, paddingTop:0, backgroundColor:'#f8fafd'}}>
      {/* Gradient Header with Avatar Fallback */}
      <View style={{alignItems:'center', paddingVertical:36, backgroundColor:'#6c63ff', borderBottomLeftRadius:32, borderBottomRightRadius:32, marginBottom:12, elevation:8, shadowColor:'#6c63ff', shadowOpacity:0.26, shadowRadius:22}}>
        <View style={{backgroundColor:'#fff', borderRadius:50, padding:12, elevation:4, shadowColor:'#6c63ff', shadowOpacity:0.18, shadowRadius:13, marginBottom:6}}>
          <View style={{width:54, height:54, borderRadius:27, borderWidth:2, borderColor:'#e17055', backgroundColor:'#f3f0ff', alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:32, color:'#e17055'}}>👤</Text>
          </View>
        </View>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:22, marginTop:4, letterSpacing:1.1, fontFamily:'sans-serif-medium'}}>{userName}</Text>
        <Text style={{color:'#e9f1ff', fontSize:14, marginTop:1, marginBottom:2, fontFamily:'sans-serif'}}>{userPhone}</Text>
        <Text style={{color:'#ffe0b2', fontSize:15, marginTop:2, fontFamily:'sans-serif'}}>RentEase Admin Panel</Text>
      </View>
      {/* Floating Card for Drawer Items */}
      <View style={{paddingHorizontal:8, paddingVertical:7, borderRadius:20, backgroundColor:'#fff', marginHorizontal:13, marginBottom:12, elevation:3, shadowColor:'#6c63ff', shadowOpacity:0.13, shadowRadius:7}}>
        <DrawerItemList {...props} />
      </View>
      <View style={{flex:1}} />
      {/* Improved Logout Button */}
      <View style={{alignItems:'center', marginBottom:10}}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            flexDirection:'row',
            alignItems:'center',
            justifyContent:'center',
            backgroundColor:'#e17055',
            paddingVertical:13,
            paddingHorizontal:34,
            borderRadius:24,
            elevation:4,
            shadowColor:'#e17055',
            shadowOpacity:0.18,
            shadowRadius:10,
            marginBottom:2,
            marginTop:8,
            minWidth:160
          }}
          onPress={() => {
            if(props.onLogout) props.onLogout();
          }}
        >
          <Text style={{color:'#fff', fontWeight:'bold', letterSpacing:1, fontSize:18}}>Logout</Text>
        </TouchableOpacity>
      </View>
      {/* Stylish Footer */}
      <View style={{alignItems:'center', marginVertical:16, paddingBottom:15}}>
        <Text style={{color:'#6c63ff', fontWeight:'bold', fontSize:15, fontFamily:'sans-serif'}}>Made with <Text style={{color:'#e17055'}}>❤️</Text> by</Text>
        <Text style={{color:'#e17055', fontWeight:'bold', fontSize:16, marginTop:2, fontFamily:'sans-serif-medium'}}>Farhan Choksi</Text>
        <Text style={{color:'#bdbdbd', fontSize:11, marginTop:2, fontFamily:'sans-serif'}}>© {new Date().getFullYear()} RentEase</Text>
      </View>
    </DrawerContentScrollView>
  );
}

export default function AdminDrawer(props) {
  const [tenants, setTenants] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth().currentUser);

  useEffect(() => {
    if (!isLoggedIn) {
      setTenants([]);
      return;
    }
    let unsub = null;
    try {
      unsub = firestore()
        .collection('users')
        .where('role', '==', 'tenant')
        .onSnapshot(
          snapshot => {
            if (!snapshot || !Array.isArray(snapshot.docs)) {
              setTenants([]);
              return;
            }
            const data = snapshot.docs.map(doc => doc.data());
            setTenants(data);
          },
          err => {
            console.log('Firestore tenant fetch error:', err);
            setTenants([]);
          }
        );
    } catch (err) {
      console.log('Firestore useEffect outer error:', err);
      setTenants([]);
    }
    return unsub;
  }, [isLoggedIn]);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);

  // Proper logout: sign out from Firebase
  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (err) {
      alert('Logout error: ' + (err?.message || err));
      console.log('Logout error:', err);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={props => <CustomDrawerContent {...props} onLogout={handleLogout} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#6c63ff', borderBottomLeftRadius:24, borderBottomRightRadius:24 },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#fff',
        drawerActiveBackgroundColor: '#6c63ff',
        drawerInactiveTintColor: '#6c63ff',
        drawerLabelStyle: { fontWeight: 'bold', fontSize: 17, marginLeft: -10 },
        drawerStyle: { backgroundColor: '#f8fafd', borderTopRightRadius: 32, borderBottomRightRadius: 32, width: 260, elevation: 6 },
      }}
    >
      <Drawer.Screen name="Dashboard" options={{drawerIcon: () => <Text style={{fontSize:22}}>📊</Text>}}>
        {screenProps => <DashboardScreen {...screenProps} onLogout={handleLogout} />}
      </Drawer.Screen>
      <Drawer.Screen name="Create Bill" options={{drawerIcon: () => <Text style={{fontSize:22}}>🧾</Text>}}>
        {() => <BillFormScreen tenants={tenants} />}
      </Drawer.Screen>
      <Drawer.Screen name="Tenants" options={{drawerIcon: () => <Text style={{fontSize:22}}>👥</Text>}}>
        {screenProps => <TenantsScreen {...screenProps} onLogout={handleLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafd',
    padding: 0,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c63ff',
    marginTop: 28,
    marginBottom: 12,
    alignSelf: 'center',
    letterSpacing: 1,
  },
});
