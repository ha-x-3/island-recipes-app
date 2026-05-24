import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
	useFonts,
	Nunito_400Regular,
	Nunito_500Medium,
	Nunito_600SemiBold,
	Nunito_700Bold,
	Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShoppingListProvider } from '../components/ShoppingListProvider.js';
import { Colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.68;

export default function RootLayout() {
	const [fontsLoaded, fontError] = useFonts({
		'Nunito-Regular':    Nunito_400Regular,
		'Nunito-Medium':     Nunito_500Medium,
		'Nunito-SemiBold':   Nunito_600SemiBold,
		'Nunito-Bold':       Nunito_700Bold,
		'Nunito-ExtraBold':  Nunito_800ExtraBold,
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
			<StatusBar style='dark' />
			<Stack>
				<Stack.Screen
					name='(tabs)'
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name='recipeDetail'
					options={{
						title: '',
						headerStyle: { backgroundColor: Colors.paper },
						headerTintColor: Colors.ink700,
						headerBackTitle: 'Back',
						headerShadowVisible: false,
					}}
				/>
				<Stack.Screen
					name='editRecipe'
					options={{
						title: 'Edit Recipe',
						headerStyle: { backgroundColor: Colors.paper },
						headerTintColor: Colors.ink700,
						headerBackTitle: 'Back',
						headerShadowVisible: false,
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
		backgroundColor: Colors.blue600,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 999,
	},
	logo: {
		width: LOGO_SIZE,
		height: LOGO_SIZE,
	},
});
