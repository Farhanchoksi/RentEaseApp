import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function BillForm({ tenants = [], onBillCreated }) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [billType, setBillType] = useState('rent');
  const [message, setMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setDueDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleCreateBill = async () => {
    setMessage('');
    if (!selectedTenant || !amount || !dueDate || !billType) {
      setMessage('Fill all fields');
      return;
    }
    try {
      await firestore().collection('bills').add({
        tenantPhone: selectedTenant, 
        amount: parseFloat(amount),
        dueDate,
        billType,
        status: 'unpaid',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setMessage('Bill created!');
      setAmount('');
      setDueDate('');
      setBillType('rent');
      setSelectedTenant('');
      if (onBillCreated) onBillCreated();
    } catch (e) {
      setMessage('Error: ' + e.message);
    }
  };

  return (
    <ScrollView style={{width:'100%'}} contentContainerStyle={styles.container}>
      {/* SVG/PNG illustration at the top */}
      <View style={{alignItems:'center', marginTop:10, marginBottom:10}}>
        <View style={{backgroundColor:'#ffe6e6', borderRadius:40, padding:8, marginBottom:6, shadowColor:'#e17055', shadowOpacity:0.13, shadowRadius:10, elevation:2}}>
          <Text style={{fontSize:38, color:'#e17055'}}>🏦</Text>
        </View>
      </View>
      {/* Gradient background for the entire form */}
      <View style={{position:'absolute', left:0, top:0, right:0, bottom:0, zIndex:-1}} pointerEvents="none">
        <View style={{flex:1, height:'100%', width:'100%', backgroundColor:'#f8fafd', opacity:0.97}} />
        <View style={{position:'absolute', left:0, right:0, top:0, height:180, borderBottomLeftRadius:60, borderBottomRightRadius:60, backgroundColor:'#6c63ff', opacity:0.19}} />
        <View style={{position:'absolute', left:-40, top:60, width:120, height:120, borderRadius:60, backgroundColor:'#00b894', opacity:0.10}} />
        <View style={{position:'absolute', right:-40, top:120, width:100, height:100, borderRadius:50, backgroundColor:'#e17055', opacity:0.08}} />
      </View>
      <View style={{alignItems:'center', marginBottom:18, marginTop:8}}>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:19, backgroundColor:'#6c63ff', paddingHorizontal:22, paddingVertical:10, borderRadius:18, marginBottom:7, shadowColor:'#6c63ff', shadowOpacity:0.13, shadowRadius:10, elevation:3, letterSpacing:0.5}}>📝 Bill Generation Form</Text>
        <Text style={{color:'#6c63ff', fontWeight:'600', fontSize:15, backgroundColor:'#e9f1ff', paddingHorizontal:18, paddingVertical:6, borderRadius:10, marginTop:2, shadowColor:'#6c63ff', shadowOpacity:0.10, shadowRadius:6, elevation:2}}>Fill all details below</Text>
      </View>
      {/* Same color for all field labels and borders */}
      <Text style={[styles.label, {color:'#6c63ff', fontSize:18, marginBottom:2, marginLeft:2}]}>Tenant</Text>
      <View style={[styles.pickerWrap, {
        borderWidth:2, borderColor:'#6c63ff', borderRadius:22, backgroundColor:'#f3f0ff', marginBottom:20,
        shadowColor:'#6c63ff', shadowOpacity:0.13, shadowRadius:10, elevation:4, paddingHorizontal:14, paddingVertical:5
      }]}>  
        <Picker
          selectedValue={selectedTenant}
          onValueChange={(itemValue) => setSelectedTenant(itemValue)}
          style={[styles.input, {fontWeight:'bold', color: selectedTenant ? '#6c63ff' : '#aaa', fontSize:18, backgroundColor:'transparent', height:52}]}
          dropdownIconColor="#6c63ff"
        >
          <Picker.Item label="👤 Select Tenant" value="" color="#aaa" />
          {tenants.map(tenant => (
            <Picker.Item
              key={tenant.phoneNumber}
              label={`👤 ${tenant.name} (${tenant.phoneNumber})`}
              value={tenant.phoneNumber}
              color="#6c63ff"
            />
          ))}
        </Picker>
      </View>
      <Text style={[styles.label, {color:'#6c63ff', fontSize:18, marginBottom:2, marginLeft:2}]}>Amount</Text>
      <View style={{flexDirection:'row', alignItems:'center', borderWidth:2, borderColor:'#6c63ff', borderRadius:20, backgroundColor:'#f3f0ff', marginBottom:14, paddingHorizontal:14, shadowColor:'#6c63ff', shadowOpacity:0.09, shadowRadius:7, elevation:2}}>
        <Text style={{fontSize:22, color:'#6c63ff', fontWeight:'bold', marginRight:8}}>₹</Text>
        <TextInput
          style={{flex:1, height:52, fontSize:19, color:'#6c63ff', fontWeight:'bold', backgroundColor:'transparent'}}
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholderTextColor="#6c63ff"
        />
      </View>
      <Text style={[styles.label, {color:'#6c63ff', fontSize:18, marginBottom:2, marginLeft:2}]}>Due Date</Text>
      <TouchableOpacity style={[styles.input, {flexDirection:'row', alignItems:'center', borderWidth:2, borderColor:'#6c63ff', borderRadius:20, fontSize:18, backgroundColor:'#f3f0ff', marginBottom:14, justifyContent:'center', height:52, shadowColor:'#6c63ff', shadowOpacity:0.09, shadowRadius:7, elevation:2}]} onPress={() => setShowDatePicker(true)}>
        <Text style={{color: dueDate ? '#6c63ff' : '#aaa', fontSize:17, fontWeight:'bold'}}>{dueDate ? `📅 ${dueDate}` : '📅 Select Due Date'}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      <Text style={[styles.label, {color:'#6c63ff', fontSize:18, marginBottom:2, marginLeft:2}]}>Bill Type</Text>
      <View style={[styles.pickerWrap, {
        borderWidth:2, borderColor:'#6c63ff', borderRadius:22, backgroundColor:'#f3f0ff', marginBottom:26,
        shadowColor:'#6c63ff', shadowOpacity:0.13, shadowRadius:10, elevation:4, paddingHorizontal:14, paddingVertical:5
      }]}>  
        <Picker
          selectedValue={billType}
          onValueChange={(itemValue) => setBillType(itemValue)}
          style={[styles.input, {fontWeight:'bold', color:'#6c63ff', fontSize:18, backgroundColor:'transparent', height:52}]}
          dropdownIconColor="#6c63ff"
        >
          <Picker.Item label="🏠 Rent" value="rent" color="#6c63ff" />
          <Picker.Item label="💧 Water Bill" value="water" color="#6c63ff" />
          <Picker.Item label="⚡ Electricity Bill" value="electricity" color="#6c63ff" />
        </Picker>
      </View>
      <TouchableOpacity style={{backgroundColor:'#6c63ff', borderRadius:22, marginTop:14, elevation:5, shadowColor:'#6c63ff', shadowOpacity:0.22, alignItems:'center', paddingVertical:16, flexDirection:'row', justifyContent:'center'}} onPress={handleCreateBill}>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:20, letterSpacing:1, marginRight:7}}>🚀</Text>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:20, letterSpacing:1}}>Generate Bill</Text>
      </TouchableOpacity>
      {message ? <Text style={{ color: message.includes('created') ? '#00b894' : '#e17055', marginTop: 18, fontWeight:'bold', fontSize:18, textAlign:'center', textShadowColor:'#e9f1ff', textShadowRadius:2 }}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', padding: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  label: { fontWeight: 'bold', marginTop: 10 },
  input: { padding: 12, marginVertical: 6, width: '100%' },
  pickerWrap: { width: '100%' },
  button: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, marginVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  message: { color: 'green', marginTop: 10 },
});
