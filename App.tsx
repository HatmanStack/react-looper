import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { looperTheme } from './src/theme/paperTheme';
import { MainScreen } from '@screens/MainScreen';

export default function App() {
  return (
    <PaperProvider theme={looperTheme}>
      <MainScreen />
      <StatusBar style="light" />
    </PaperProvider>
  );
}
