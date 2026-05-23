import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShoppingListProvider } from '../components/ShoppingListProvider.js';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.68;

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		OpenSans: require('../assets/fonts/OpenSans-Regular.ttf'),
		'OpenSans-Italic': require('../assets/fonts/OpenSans-Italic.ttf'),
		'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
		'OpenSans-SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
		'OpenSans-BoldItalic': require('../assets/fonts/OpenSans-BoldItalic.ttf'),
	});

	const [showOverlay, setShowOverlay] = useState(true);
	const overlayOpacity = useRef(new Animated.Value(1)).current;
	const logoScale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (fontsLoaded || fontError) {
			SplashScreen.hideAsync();

			// Brief pause so the overlay is visible on screen before animating
			const timer = setTimeout(() => {
				Animated.parallel([
					Animated.timing(overlayOpacity, {
						toValue: 0,
						duration: 650,
						useNativeDriver: true,
					}),
					Animated.timing(logoScale, {
						toValue: 1.12,
						duration: 650,
						useNativeDriver: true,
					}),
				]).start(() => setShowOverlay(false));
			}, 250);

			return () => clearTimeout(timer);
		}
	}, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
		return null;
	}

	return (
		<SafeAreaProvider>
		<ShoppingListProvider>
			<StatusBar style='light' />
			<Stack>
				<Stack.Screen
					name='(tabs)'
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name='recipeDetail'
					options={{
						title: '',
						headerStyle: { backgroundColor: Colors.primary },
						headerTintColor: Colors.white,
						headerBackTitle: 'Back',
					}}
				/>
				<Stack.Screen
					name='editRecipe'
					options={{
						title: 'Edit Recipe',
						headerStyle: { backgroundColor: Colors.primary },
						headerTintColor: Colors.white,
						headerBackTitle: 'Back',
					}}
				/>
			</Stack>

			{showOverlay && (
				<Animated.View
					style={[styles.overlay, { opacity: overlayOpacity }]}
					pointerEvents='none'
				>
					<Animated.Image
						source={require('../assets/splash.png')}
						style={[styles.logo, { transform: [{ scale: logoScale }] }]}
						resizeMode='contain'
					/>
				</Animated.View>
			)}
		</ShoppingListProvider>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#02A99D',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 999,
	},
	logo: {
		width: LOGO_SIZE,
		height: LOGO_SIZE,
	},
});
