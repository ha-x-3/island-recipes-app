import { StyleSheet, Image, Text, View, Platform } from 'react-native';

export default function Home() {

    const hero = require('../assets/islandRecipes.png');

	return (
		<View style={styles.container}>
            <Image source={hero} style={styles.heroStyle}></Image>
			<Text style={{ fontFamily: 'OpenSans-BoldItalic', fontSize: 20 }}>Custom font is working because this is the new homepage!</Text>
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
