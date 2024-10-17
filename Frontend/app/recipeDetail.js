import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function RecipeDetail() {
	const { id } = useLocalSearchParams();
	const [recipe, setRecipe] = useState(null);

	useEffect(() => {
		const fetchRecipe = async () => {
			try {
				const response = await axios.get(
					`http://localhost:8080/api/recipes/${id}`
				);
				setRecipe(response.data);
			} catch (error) {
				console.error('Error fetching recipe details:', error);
			}
		};

		if (id) {
			fetchRecipe();
		}
	}, [id]);

	if (!recipe) {
		return <Text>Loading...</Text>;
	}

    const renderIngredient = ({ item }) => (
		<Text>
			{item.name} - {item.amount} {item.unit}
		</Text>
	);

	return (
		<View style={styles.container}>
			<Image
				source={{ uri: recipe.recipePhotoUrl }}
				style={styles.image}
			/>
			<Text style={styles.title}>{recipe.recipeName}</Text>
			<Text style={styles.details}>Servings: {recipe.yield}</Text>
			<Text style={styles.details}>
				Prep Time: {recipe.prepTimeHour} hr {recipe.prepTimeMin} min
			</Text>
			<Text style={styles.details}>
				Cook Time: {recipe.cookTimeHour} hr {recipe.cookTimeMin} min
			</Text>
			<Text style={styles.subTitle}>Ingredients:</Text>
			<FlatList
				data={recipe.ingredients}
				renderItem={renderIngredient}
				keyExtractor={(item) => item.name}
			/>
			<Text style={styles.subTitle}>Instructions:</Text>
			<Text style={styles.instructions}>{recipe.instructions}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	image: {
		width: '100%',
		height: 200,
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	details: {
		fontSize: 16,
		marginBottom: 4,
	},
	subTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginTop: 16,
	},
	ingredient: {
		fontSize: 16,
	},
	instructions: {
		fontSize: 16,
		marginTop: 8,
	},
});
