import {
	StyleSheet,
	Image,
	Pressable,
	Text,
	View,
	Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons/faBookOpen';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faListCheck } from '@fortawesome/free-solid-svg-icons/faListCheck';

export default function Home() {
	const hero = require('../assets/islandRecipes.png');

	return (
		<View style={styles.container}>
			<Image
				source={hero}
				style={styles.heroStyle}
			></Image>
			<View style={styles.buttonContainer}>
				<Link
					href='/addRecipe'
					asChild
				>
					<Pressable style={styles.button}>
						<View style={styles.buttonContent}>
							<Text style={styles.buttonText}>Add A Recipe</Text>
							<FontAwesomeIcon
								icon={faPlus}
								size={32}
							/>
						</View>
					</Pressable>
				</Link>

				<Link
					href='/ourRecipes'
					asChild
				>
					<Pressable style={styles.button}>
						<View style={styles.buttonContent}>
							<Text style={styles.buttonText}>Our Recipes</Text>
							<FontAwesomeIcon
								icon={faBookOpen}
								size={32}
							/>
						</View>
					</Pressable>
				</Link>

				<Pressable style={styles.button}>
					<View style={styles.buttonContent}>
						<Text style={styles.buttonText}>Search</Text>
						<FontAwesomeIcon
							icon={faMagnifyingGlass}
							size={32}
						/>
					</View>
				</Pressable>

				<Pressable style={styles.button}>
					<View style={styles.buttonContent}>
						<Text style={styles.buttonText}>Shopping List</Text>
						<FontAwesomeIcon
							icon={faListCheck}
							size={32}
						/>
					</View>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		alignItems: 'center',
		justifyContent: 'space-around',
	},
	heroStyle: {
		height: 200,
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
	buttonContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
	button: {
		backgroundColor: '#fff',
		padding: 10,
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.8,
		shadowRadius: 2,
		elevation: 5,
		height: 100,
		width: '50%',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 25,
		paddingHorizontal: 25,
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	buttonText: {
		fontSize: 30,
		fontWeight: 'bold',
		textAlign: 'center',
		color: '#000',
	},
});
