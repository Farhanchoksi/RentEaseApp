import React, { useState } from 'react';
import { View, TextInput } from 'react-native';

export default function KeyboardTest() {
  const [phone, setPhone] = useState('');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TextInput
        style={{ borderWidth: 1, width: 200, fontSize: 20, padding: 10 }}
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone"
      />
    </View>
  );
}
