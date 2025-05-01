import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import BillForm from './BillForm';
import TenantBills from './TenantBills';

export default function UserDashboard({ user, onLogout, showTenantsOnly }) {
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [message, setMessage] = useState('');
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedTenantForBills, setSelectedTenantForBills] = useState(null);

  // Fetch tenants if user is admin
  React.useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unsubscribe = firestore()
      .collection('users')
      .where('role', '==', 'tenant')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => doc.data());
        setTenants(data);
      });
    return unsubscribe;
  }, [user]);

  const fetchBills = () => {
    if (!user || user.role !== 'admin') return;
    firestore().collection('bills').onSnapshot(snapshot => {
      if (!snapshot || !Array.isArray(snapshot.docs)) {
        setBills([]);
        return;
      }
      setBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  };

  useEffect(() => {
    
    if (!user || user.role !== 'admin') return;
    fetchBills();
  }, [user]);

  const handleAddTenant = async () => {
    setMessage('');
    if (!tenantName.trim() || !tenantPhone.match(/^\d{10}$/)) {
      setMessage('Enter valid name and 10-digit mobile number');
      return;
    }
    try {
      const phoneWithCode = '+91' + tenantPhone;
      const tenantRef = firestore().collection('users').doc(phoneWithCode);
      const tenantSnap = await tenantRef.get();
      if (tenantSnap.exists) {
        setMessage('Tenant already exists!');
        return;
      }
      await tenantRef.set({
        phoneNumber: phoneWithCode,
        name: tenantName.trim(),
        role: 'tenant',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setMessage('Tenant added successfully!');
      setTenantName('');
      setTenantPhone('');
    } catch (error) {
      setMessage('Error adding tenant: ' + error.message);
    }
  };

  const handleMarkAsPaid = async (billId) => {
    await firestore().collection('bills').doc(billId).update({ status: 'paid' });
  };

  const handleDeleteBill = async (billId) => {
    await firestore().collection('bills').doc(billId).delete();
  };

  // Delete tenant and (optionally) their bills
  const handleDeleteTenant = async (phoneNumber) => {
    try {
      // Delete tenant document
      await firestore().collection('users').doc(phoneNumber).delete();
      // Delete all bills for this tenant
      const billsSnap = await firestore().collection('bills').where('tenantPhone', '==', phoneNumber).get();
      const batch = firestore().batch();
      billsSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      setMessage('Tenant and their bills deleted!');
      // Remove selection if deleted tenant was selected
      if (selectedTenantForBills && selectedTenantForBills.phoneNumber === phoneNumber) {
        setSelectedTenantForBills(null);
      }
    } catch (error) {
      setMessage('Error deleting tenant: ' + error.message);
    }
  };

  if (showTenantsOnly) {
    // Show tenants section for drawer navigation (same as dashboard's tenants section)
    return (
      <ScrollView style={{ flex: 1, width: '100%', backgroundColor: '#f4f8fb' }} contentContainerStyle={[styles.container, { alignItems: 'stretch' }]}> 
        <View style={{backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, elevation: 3, shadowColor: '#2563eb', shadowOpacity: 0.08, shadowRadius: 8, borderWidth: 1, borderColor: '#e3eaf6'}}>
          <Text style={[styles.sectionTitle, {color: '#2563eb', marginBottom: 8}]}>Tenants</Text>
          <View style={{ width: '100%' }}>
            {tenants.length === 0 ? (
              <Text>No tenants added yet.</Text>
            ) : (
              tenants.map(item => (
                <TouchableOpacity
                  style={[styles.tenantItem, { backgroundColor: selectedTenantForBills && selectedTenantForBills.phoneNumber === item.phoneNumber ? '#e7f0fe' : '#f7f9fa', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: selectedTenantForBills && selectedTenantForBills.phoneNumber === item.phoneNumber ? '#2563eb' : '#e3eaf6', padding: 12, elevation: selectedTenantForBills && selectedTenantForBills.phoneNumber === item.phoneNumber ? 2 : 0 }]}
                  key={item.phoneNumber}
                  onPress={() => setSelectedTenantForBills(item)}
                >
                  <Text style={{fontWeight: 'bold', color: '#2563eb', fontSize: 16}}>{item.name} ({item.phoneNumber})</Text>
                  {/* Delete Tenant Button */}
                  <TouchableOpacity
                    style={{backgroundColor:'#e17055', borderRadius:10, marginTop:7, alignSelf:'flex-start', paddingVertical:7, paddingHorizontal:18, elevation:2}}
                    onPress={() => {
                      Alert.alert(
                        'Delete Tenant',
                        'Are you sure you want to delete this tenant and all their bills?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteTenant(item.phoneNumber) },
                        ]
                      );
                    }}
                  >
                    <Text style={{color:'#fff', fontWeight:'bold', fontSize:15}}>Delete Tenant</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
        {selectedTenantForBills && (
          <View style={{ width: '100%', marginTop: 10, padding: 16, borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 14, backgroundColor: '#eaf2fd', marginBottom: 26, elevation: 2 }}> 
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#2563eb', fontSize: 17 }}>Bills for {selectedTenantForBills.name} ({selectedTenantForBills.phoneNumber})</Text>
            {bills.filter(bill => bill.tenantPhone === selectedTenantForBills.phoneNumber).length === 0 ? (
              <Text>No bills found for this tenant.</Text>
            ) : (
              bills.filter(bill => bill.tenantPhone === selectedTenantForBills.phoneNumber).map(item => (
                <View style={[styles.tenantItem, {backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#e3eaf6', elevation: 1}]} key={item.id}>
                  <Text style={{fontWeight: 'bold', fontSize: 17, color: '#222'}}>₹{item.amount}</Text>
                  <Text>Due: <Text style={{fontWeight: 'bold'}}>{item.dueDate}</Text></Text>
                  <Text>Type: {item.billType ? (
                    item.billType === 'rent' ? 'Rent' : item.billType === 'water' ? 'Water Bill' : item.billType === 'electricity' ? 'Electricity Bill' : item.billType
                  ) : '-'}</Text>
                  <Text>Status: <Text style={{ color: item.status === 'paid' ? 'green' : 'red', fontWeight: 'bold' }}>{item.status}</Text></Text>
                  {item.status !== 'paid' && (
                    <TouchableOpacity style={[styles.button, { backgroundColor: 'green', marginTop: 8, borderRadius: 8 }]} onPress={() => handleMarkAsPaid(item.id)}>
                      <Text style={styles.buttonText}>Mark as Paid</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.button, { backgroundColor: 'red', marginTop: 8, borderRadius: 8 }]} onPress={() => handleDeleteBill(item.id)}>
                    <Text style={styles.buttonText}>Delete Bill</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  if (user) {
    // Defensive: if user is null (after logout), do not render dashboard/tenant bills
    if (!user) return null;
    // Show tenant bills if tenant, admin dashboard if admin
    if (user.role === 'tenant') {
      return <TenantBills onLogout={onLogout} />;
    }
    // Modern, attractive admin dashboard
    return (
      <ScrollView style={{ flex: 1, width: '100%', backgroundColor: '#f8fafd' }} contentContainerStyle={[styles.container, { alignItems: 'stretch', paddingTop: 0 }]}> 
        {/* Header Banner */}
        <View style={{alignItems:'center', backgroundColor:'#6c63ff', borderBottomLeftRadius:32, borderBottomRightRadius:32, paddingVertical:30, marginBottom:16, shadowColor:'#6c63ff', shadowOpacity:0.14, shadowRadius:12, elevation:4}}>
          <View style={{backgroundColor:'#fff', borderRadius:38, padding:8, elevation:2, shadowColor:'#6c63ff', shadowOpacity:0.13, shadowRadius:8}}>
            <Text style={{fontSize:36, color:'#6c63ff'}}>🏠</Text>
          </View>
          <Text style={{color:'#fff', fontWeight:'bold', fontSize:23, marginTop:10, letterSpacing:1}}>RentEase Admin</Text>
          <Text style={{color:'#e9f1ff', fontSize:15, marginTop:2}}>Welcome, {user?.name || user?.phoneNumber}</Text>
        </View>
        {/* Add Tenant Card */}
        <View style={{backgroundColor:'#fff', borderRadius:22, padding:22, marginBottom:24, elevation:3, shadowColor:'#6c63ff', shadowOpacity:0.09, shadowRadius:10, borderWidth:1, borderColor:'#e9f1ff', marginHorizontal:2}}>
          <Text style={{fontSize:19, fontWeight:'bold', color:'#6c63ff', marginBottom:8, letterSpacing:0.5}}>Add Tenant</Text>
          <TextInput
            style={{borderWidth:2, borderColor:'#6c63ff', borderRadius:16, padding:12, fontSize:16, marginBottom:10, backgroundColor:'#f3f0ff', color:'#6c63ff'}}
            placeholder="Tenant Name"
            value={tenantName}
            onChangeText={setTenantName}
            placeholderTextColor="#6c63ff"
          />
          <TextInput
            style={{borderWidth:2, borderColor:'#6c63ff', borderRadius:16, padding:12, fontSize:16, marginBottom:10, backgroundColor:'#f3f0ff', color:'#6c63ff'}}
            placeholder="Tenant Phone (10 digits)"
            value={tenantPhone}
            onChangeText={setTenantPhone}
            keyboardType="phone-pad"
            maxLength={10}
            placeholderTextColor="#6c63ff"
          />
          <TouchableOpacity style={{backgroundColor:'#6c63ff', borderRadius:14, paddingVertical:13, alignItems:'center', marginTop:4, elevation:3, shadowColor:'#6c63ff', shadowOpacity:0.13}} onPress={handleAddTenant}>
            <Text style={{color:'#fff', fontWeight:'bold', fontSize:16, letterSpacing:1}}>Add Tenant</Text>
          </TouchableOpacity>
          {message ? <Text style={{ color: message.includes('success') ? '#00b894' : '#e17055', marginTop: 10, fontWeight:'bold', fontSize:15, textAlign:'center' }}>{message}</Text> : null}
        </View>
        <TouchableOpacity style={{ backgroundColor: '#e17055', marginBottom: 32, marginTop: 10, borderRadius: 14, elevation: 1, alignItems:'center', paddingVertical:13 }} onPress={() => {
            try {
              if (onLogout) onLogout();
            } catch (err) {
              console.log('Logout error:', err);
            }
          }}>
            <Text style={{ color: '#fff', fontWeight:'bold', fontSize:16, letterSpacing:1 }}>Logout</Text>
          </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  role: { fontSize: 18, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 0, marginBottom: 10 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginVertical: 6 },
  button: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, marginVertical: 6, width: '100%', alignItems: 'center', elevation: 1 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  tenantItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
