import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';

const Header = ({ title }) => {
	const router = useRouter();
	const segments = useSegments();
	const [menuVisible, setMenuVisible] = useState(false);

	const toggleMenu = () => {
		setMenuVisible((prev) => !prev);
	};

	const isHome =
		segments.length === 0 || (segments.length === 1 && segments[0] === '');

	return (
		<View style={styles.container}>
			<SafeAreaView style={styles.headerContainer}>
				{/* Back Button */}
				{!isHome && (
					<Pressable
						onPress={() => router.back()}
						style={styles.iconContainer}
					>
						<Icon
							name='arrow-back'
							type='material'
						/>
					</Pressable>
				)}

				{/* Title */}
				<Text style={styles.title}>{title}</Text>

				{/* Hamburger Menu */}
				<Pressable
					onPress={toggleMenu}
					style={styles.iconContainer}
				>
					<Icon
						name='menu'
						type='material'
					/>
				</Pressable>
			</SafeAreaView>

			{/* Menu Drawer */}
			{menuVisible && (
				<View style={styles.menuOverlay}>
					<View style={styles.menu}>
						<Pressable
							onPress={() => {
								router.push('/addRecipe');
								toggleMenu();
							}}
						>
							<Text style={styles.menuItem}>Add Recipe</Text>
						</Pressable>
						<Pressable
							onPress={() => {
								router.push('/ourRecipes');
								toggleMenu();
							}}
						>
							<Text style={styles.menuItem}>Our Recipes</Text>
						</Pressable>
						<Pressable
							onPress={() => {
								router.push('/search');
								toggleMenu();
							}}
						>
							<Text style={styles.menuItem}>Search</Text>
						</Pressable>
						<Pressable onPress={toggleMenu}>
							<Text style={styles.menuItem}>Close Menu</Text>
						</Pressable>
					</View>
				</View>
			)}
		</View>
	);
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		zIndex: 1000,
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	iconContainer: {
		padding: 10,
	},
	menuOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
	},
	menu: {
		width: width * 0.7,
		height: height,
		backgroundColor: 'white',
		borderTopLeftRadius: 20,
		borderBottomLeftRadius: 20,
		paddingTop: 50,
		paddingHorizontal: 20,
		shadowColor: '#000',
		shadowOffset: {
			width: -2,
			height: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	menuItem: {
		paddingVertical: 15,
		fontSize: 18,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
});

export default Header;
