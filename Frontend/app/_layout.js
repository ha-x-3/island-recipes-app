import { useEffect } from 'react';
import { SplashScreen, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './header.js';
import { ShoppingListProvider } from '../components/ShoppingListProvider.js';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
	const [fontsLoaded, fontError] = useFonts({
		OpenSans: require('../assets/fonts/OpenSans-Regular.ttf'),
		'OpenSans-Italic': require('../assets/fonts/OpenSans-Italic.ttf'),
		'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
		'OpenSans-SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
		'OpenSans-BoldItalic': require('../assets/fonts/OpenSans-BoldItalic.ttf'),
	});

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
		return null;
	}

	return (
		<ShoppingListProvider>
			<SafeAreaView style={{ flex: 1 }}>
				<StatusBar style='dark' />
				<Header title='Island Recipes' />
				<Slot />
			</SafeAreaView>
		</ShoppingListProvider>
	);
}
