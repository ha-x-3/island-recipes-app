import React, { useState } from 'react';
import {
	View,
	TextInput,
	Button,
	FlatList,
	Text,
	Image,
	StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function Search() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const router = useRouter();

	const searchRecipes = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await axios.get(
				'http://localhost:8080/api/recipes/search',
				{
					params: { query },
				}
			);
			setResults(response.data);
		} catch (err) {
			console.error(err);
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const renderRecipeItem = ({ item }) => (
		<View style={styles.recipeItem}>
			<Image
				source={{ uri: item.recipePhoto }}
				style={styles.recipeImage}
			/>
			<View>
				<Text style={styles.recipeName}>{item.recipeName}</Text>
				<Text>
					{item.ingredients
						.map((ingredient) => ingredient.name)
						.join(', ')}
				</Text>
				<Button
					title='View Recipe'
					onPress={() =>
						router.push({
							pathname: '/recipeDetail',
							params: { id: item.id },
						})
					}
				/>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.searchInput}
				placeholder='Search by recipe name or ingredient'
				value={query}
				onChangeText={setQuery}
			/>
			<Button
				title='Search'
				onPress={searchRecipes}
				disabled={loading || !query.trim()}
			/>

			{loading && <Text>Loading...</Text>}
			{error && <Text style={styles.errorText}>{error}</Text>}

			<FlatList
				data={results}
				keyExtractor={(item) => item.id}
				renderItem={renderRecipeItem}
				ListEmptyComponent={!loading && <Text>No recipes found.</Text>}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
	},
	searchInput: {
		height: 40,
		borderColor: 'gray',
		borderWidth: 1,
		marginBottom: 10,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
	recipeItem: {
		flexDirection: 'row',
		marginBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
		paddingBottom: 10,
	},
	recipeImage: {
		width: 60,
		height: 60,
		marginRight: 10,
		borderRadius: 4,
	},
	recipeName: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	errorText: {
		color: 'red',
		marginTop: 10,
	},
});
