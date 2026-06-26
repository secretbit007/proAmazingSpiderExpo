import 'react-native-reanimated';

import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0d2818' }} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
