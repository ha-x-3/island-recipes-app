import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	FlatList,
	Pressable,
	ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const OurRecipes = () => {
	const [recipes, setRecipes] = useState([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchRecipes = async () => {
			try {
				const response = await axios.get(
					'http://localhost:8080/api/recipes'
				);
				setRecipes(response.data);
			} catch (error) {
				console.error('Error fetching recipes:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchRecipes();
	}, []);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator
					size='large'
					color='rgba(2, 169, 157, 1.0)'
				/>
			</View>
		);
	}

	const renderRecipe = ({ item }) => {
		const totalTime =
			item.prepTimeHour * 60 +
			item.prepTimeMin +
			item.cookTimeHour * 60 +
			item.cookTimeMin;

		return (
			<Pressable
				style={styles.recipeContainer}
				onPress={() =>
					router.push({
						pathname: '/recipeDetail',
						params: { id: item.id },
					})
				}
			>
				<Image
					source={{ uri: item.recipePhotoUrl }}
					style={styles.recipeImage}
				/>
				<View style={styles.recipeInfo}>
					<Text style={styles.recipeName}>{item.recipeName}</Text>
					<Text style={styles.recipeTime}>{totalTime} minutes</Text>
				</View>
			</Pressable>
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Our Recipes</Text>
			<FlatList
				data={recipes}
				renderItem={renderRecipe}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContainer}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
		color: 'black',
	},
	recipeContainer: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderRadius: 8,
		marginBottom: 16,
		overflow: 'hidden',
		elevation: 4,
	},
	recipeImage: {
		width: 100,
		height: 100,
	},
	recipeInfo: {
		flex: 1,
		padding: 16,
		justifyContent: 'center',
	},
	recipeName: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
		color: '#333',
	},
	recipeTime: {
		fontSize: 14,
		color: '#666',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default OurRecipes;
