import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AdminDrawer from './AdminDrawer';

export default function RootNavigation() {
  return (
    <NavigationContainer independent={true}>
      <AdminDrawer />
    </NavigationContainer>
  );
}
