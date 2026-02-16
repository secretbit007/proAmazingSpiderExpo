import 'react-native-reanimated';

import { GameBoard } from '@/components/GameBoard';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F1A12' }} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <GameBoard />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
