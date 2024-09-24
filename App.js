import { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {

  const [fontsLoaded, fontError] = useFonts({
		OpenSans: require('../assets/fonts/OpenSans-Regular.ttf'),
		'OpenSans-Italic': require('../assets/fonts/OpenSans-Italic.ttf'),
		'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
		'OpenSans-SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
		'OpenSans-BoldItalic': require('../assets/fonts/OpenSans-BoldItalic.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
		if (fontsLoaded || fontError) {
			await SplashScreen.hideAsync();
		}
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
		return null;
  }

	return (
		<View
			style={styles.container}
			onLayout={onLayoutRootView}
		>
			<Text>Open up App.js to start working on your app!</Text>
			<StatusBar style='auto' />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
