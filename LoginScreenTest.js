import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import UserDashboard from './UserDashboard';
import TenantBills from './TenantBills';

const bannerIcon = '🏠';
const Card = ({ children }) => (
  <View style={{
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 32,
    elevation: 9,
    shadowColor: '#6c63ff',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 2,
    borderColor: '#d1d9ff',
  }}>{children}</View>
);

export default function LoginScreenTest() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const phoneInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (usr) => {
      if (usr) {
        try {
          const ref = firestore().collection('users').doc(usr.phoneNumber);
          const snap = await ref.get();
          if (snap.exists) setUserData(snap.data());
          else setUserData({ phoneNumber: usr.phoneNumber });
        } catch (e) {
          console.log('user fetch error', e);
        }
      } else {
        setUserData(null);
      }
    });
    return unsubscribe;
  }, []);

  const sendOtp = async () => {
    setMessage('');
    if (phone.length !== 10) {
      setMessage('Enter valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber('+91' + phone);
      setConfirm(confirmation);
      setMessage('OTP sent');
    } catch (e) {
      setMessage('Failed to send OTP');
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setMessage('');
    if (!confirm) {
      setMessage('Request OTP first');
      return;
    }
    if (otp.length !== 6) {
      setMessage('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await confirm.confirm(otp);
    } catch (e) {
      setMessage('Invalid OTP');
    }
    setLoading(false);
  };

  if (userData) {
    // Role-based navigation: agar admin, to UserDashboard, warna TenantBills
    if (userData.role === 'admin') {
      return <UserDashboard user={userData} onLogout={() => auth().signOut()} />;
    }
    return <TenantBills onLogout={() => auth().signOut()} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={40}>
      <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f4f7fe' }} keyboardShouldPersistTaps="always">
        {/* Banner section */}
        <View style={{ alignItems:'center', marginBottom:2 }}>
          <View style={{ backgroundColor:'#fff', borderRadius:99, padding:16, elevation:7, shadowColor:'#6c63ff', shadowOpacity:0.17, shadowRadius:20 }}>
            <Text style={{ fontSize:44, color:'#6c63ff' }}>{bannerIcon}</Text>
          </View>
          <Text style={{ color:'#6c63ff', fontWeight:'bold', fontSize:28, marginTop:12, letterSpacing:1.2, fontFamily:'sans-serif-medium' }}>RentEase</Text>
          <Text style={{ color:'#bfc9ea', fontSize:16, marginTop:2, fontFamily:'sans-serif' }}>Your premium rental manager</Text>
          <View style={{ width:140, height:14, marginTop:10, marginBottom:-12, overflow:'hidden' }}>
            <View style={{ width:140, height:28, borderTopLeftRadius:70, borderTopRightRadius:70, backgroundColor:'#e0e7ff', opacity:0.7 }} />
          </View>
        </View>
        <Card>
          <Text style={{ fontWeight:'bold', color:'#6c63ff', fontSize:19, marginBottom:20, letterSpacing:0.3, fontFamily:'sans-serif-medium' }}>Login with Mobile OTP</Text>
          <TextInput
            ref={phoneInputRef}
            style={{ width:'100%', borderWidth:2, borderColor:'#bfc9ea', borderRadius:14, padding:15, fontSize:16, marginBottom:16, backgroundColor:'#f8faff', color:'#333', fontFamily:'sans-serif' }}
            placeholder="Mobile Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            placeholderTextColor="#bfc9ea"
            autoCorrect={false}
            autoCompleteType="off"
            blurOnSubmit={true}
            returnKeyType="done"
          />
          <TouchableOpacity style={{ backgroundColor:'#6c63ff', borderRadius:14, paddingVertical:14, alignItems:'center', marginBottom:10, width:'100%', shadowColor:'#6c63ff', shadowOpacity:0.15, elevation:3 }} onPress={sendOtp} disabled={loading}>
            <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16, letterSpacing:0.6 }}>{loading ? 'Sending...' : 'Send OTP'}</Text>
          </TouchableOpacity>
          {confirm && (
            <>
              <TextInput
                style={{ width:'100%', borderWidth:2, borderColor:'#e17055', borderRadius:14, padding:15, fontSize:16, marginBottom:16, backgroundColor:'#fff5f3', color:'#e17055', fontFamily:'sans-serif' }}
                placeholder="OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="#e17055"
                autoCorrect={false}
                autoCompleteType="off"
                blurOnSubmit={true}
                returnKeyType="done"
              />
              <TouchableOpacity style={{ backgroundColor:'#e17055', borderRadius:14, paddingVertical:14, alignItems:'center', marginBottom:10, width:'100%', shadowColor:'#e17055', shadowOpacity:0.14, elevation:2 }} onPress={verifyOtp} disabled={loading}>
                <Text style={{ color:'#fff', fontWeight:'bold', fontSize:16, letterSpacing:0.6 }}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
              </TouchableOpacity>
            </>
          )}
          {loading && <ActivityIndicator size="small" color="#e17055" style={{ marginTop:10 }} />}
          {message ? <Text style={{ color: message.includes('success') ? '#00b894' : '#e17055', marginTop:10, fontWeight:'bold', fontSize:15, textAlign:'center' }}>{message}</Text> : null}
        </Card>
        <View style={{ alignItems:'center', marginTop:44 }}>
          <View style={{ height:5, width:130, borderRadius:2, backgroundColor:'#e0e7ff', marginBottom:10, opacity:0.8 }} />
          <Text style={{ color:'#bdbdbd', fontSize:13 }}>Made with <Text style={{ color:'#e17055' }}>❤️</Text> by Farhan Choksi</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}