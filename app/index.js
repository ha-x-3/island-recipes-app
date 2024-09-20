import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Image, Text, View, Platform } from 'react-native';

export default function App() {

    const hero = require('../assets/islandRecipes.png');

	return (
		<View style={styles.container}>
            <Image source={hero} style={styles.heroStyle}></Image>
			<Text>Expo Router is working because this is the new homepage!</Text>
			<StatusBar style='auto' />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	heroStyle: {
		height: 120,
		width: '100%',
		alignSelf: 'center',
		...Platform.select({
			android: {
				top: '-10%',
			},
			ios: {
				top: '-10%',
			},
			default: {
				top: '-3%',
			},
		}),
	},
});
