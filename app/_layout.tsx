import 'react-native-reanimated';

import { GameBoard } from '@/components/GameBoard';
import { SafeAreaView } from 'react-native';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GameBoard />
    </SafeAreaView>
  );
}
