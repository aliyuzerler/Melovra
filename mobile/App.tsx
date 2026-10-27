import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { useStudio } from './src/store/useStudio';
import { colors } from './src/theme';

export default function App() {
  const hydrate = useStudio((s) => s.hydrate);
  const loaded = useStudio((s) => s.loaded);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {loaded ? <RootNavigator /> : null}
    </SafeAreaProvider>
  );
}
