import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Accent color per bill type for left border and text
const getTypeColor = (type) => {
  switch (type) {
    case 'rent': return '#6c63ff';
    case 'water': return '#00aaff';
    case 'electricity': return '#ffaa00';
    default: return '#cccccc';
  }
};

export default function TenantBills({ onLogout }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('');
  const phone = auth().currentUser?.phoneNumber;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!phone) return;
    // Fetch tenant name
    firestore().collection('users').doc(phone).get().then(doc => {
      if (doc.exists) setTenantName(doc.data().name || '');
    });
    const unsubscribe = firestore()
      .collection('bills')
      .where('tenantPhone', '==', phone)
      .onSnapshot(snapshot => {
        setBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const onRefresh = async () => {
    if (!phone) return;
    setRefreshing(true);
    try {
      const snapshot = await firestore().collection('bills').where('tenantPhone', '==', phone).get();
      setBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.log('Refresh error:', e);
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {tenantName ? <Text style={styles.tenantName}>{tenantName}</Text> : null}
      <Text style={styles.title}>Your Rent Bills</Text>
      {loading ? <ActivityIndicator size="large" color="#6c63ff" style={styles.loadingIndicator} /> : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6c63ff"]} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => {
            const totalDue = bills.filter(item => item.status !== 'paid').reduce((sum, item) => sum + Number(item.amount), 0);
            return <View style={styles.summary}><Text style={styles.summaryText}>Total Due: ₹{totalDue}</Text></View>;
          }}
          data={bills}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const typeColor = getTypeColor(item.billType);
            const dueDateFormatted = new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <View style={[styles.billCard, { borderLeftColor: typeColor }]} >  
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Text style={[styles.dueText]}>{`Due: ${dueDateFormatted}`}</Text>
                <Text style={[styles.typeText, { color: typeColor }]}>
                  {item.billType === 'rent' ? 'RENT' : item.billType === 'water' ? 'WATER BILL' : item.billType === 'electricity' ? 'ELECTRICITY BILL' : item.billType || '-'}
                </Text>
                <View style={[styles.statusBadge, item.status === 'paid' ? styles.paidBadge : styles.dueBadge]}>  
                  <Text style={[styles.badgeText]}>{item.status}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text>No bills found.</Text>}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f7fe', alignItems: 'center' },
  tenantName: { fontWeight: 'bold', fontSize: 24, color: '#2d1d4f', marginBottom: 10, letterSpacing: 0.3 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16, color: '#6c63ff', textAlign: 'center', letterSpacing: 0.5 },
  loadingIndicator: { marginVertical: 22 },
  billCard: {
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 22,
    marginVertical: 16,
    width: 350,
    alignSelf: 'center',
    alignItems: 'center',
    borderLeftWidth: 7,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderRightWidth: 2,
    borderRightColor: '#f3e8ff',
  },
  amount: { fontSize: 26, fontWeight: 'bold', color: '#4b2997', textAlign: 'center', marginBottom: 2 },
  dueText: { color: '#7c7c7c', marginTop: 6, fontStyle: 'italic', textAlign: 'center', fontSize: 16 },
  typeText: { color: '#555', marginTop: 8, textAlign: 'center', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
  statusBadge: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f8d7da',
    minWidth: 80,
    shadowColor: '#f9bebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  paidBadge: { backgroundColor: '#d4edda' },
  dueBadge: { backgroundColor: '#f8d7da' },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', letterSpacing: 0.5 },
  summary: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    width: 240,
    alignSelf: 'center',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e9e2ff',
  },
  summaryText: { fontSize: 18, fontWeight: 'bold', color: '#6c63ff', textAlign: 'center', letterSpacing: 0.5 },
  button: { padding: 16, borderRadius: 12, marginVertical: 18, width: 240, alignItems: 'center', backgroundColor: '#6c63ff', elevation: 3 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.7 },
  listContent: { alignItems: 'center', paddingBottom: 40 },
});
