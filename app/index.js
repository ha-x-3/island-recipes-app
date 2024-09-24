import { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Image, Text, View, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {

    const [fontsLoaded, fontError] = useFonts({
		'OpenSans': require('../assets/fonts/OpenSans-Regular.ttf'),
        'OpenSans-Italic': require('../assets/fonts/OpenSans-Italic.ttf'),
        'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
        'OpenSans-SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
        'OpenSans-BoldItalic': require('../assets/fonts/OpenSans-BoldItalic.ttf')
	});

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    const hero = require('../assets/islandRecipes.png');

	return (
		<View style={styles.container} onLayout={onLayoutRootView}>
            <Image source={hero} style={styles.heroStyle}></Image>
			<Text style={{ fontFamily: 'OpenSans-BoldItalic', fontSize: 20 }}>Custom font is working because this is the new homepage!</Text>
			<StatusBar style='auto' />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	heroStyle: {
		height: 135,
		width: '100%',
		alignSelf: 'center',
        resizeMode: 'contain',
        marginBottom: 20,
		...Platform.select({
			android: {
				top: 5,
			},
			ios: {
				top: 5,
			},
			default: {
				top: 5,
			},
		}),
	},
});
