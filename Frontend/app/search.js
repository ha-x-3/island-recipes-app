import React, { useState } from 'react';
import {
	View,
	TextInput,
	Button,
	Pressable,
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
				placeholderTextColor='#2B2B2B'
			/>
			<Pressable
                style={styles.searchButton}
				title='Search'
				onPress={searchRecipes}
				disabled={loading || !query.trim()}
			>
				<Text style={styles.searchButtonText}>Search</Text>
			</Pressable>

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
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
	},
	searchInput: {
		height: 40,
		borderColor: '#CED4DA',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginVertical: 12,
		backgroundColor: '#F2F2F2',
	},
	searchButton: {
		backgroundColor: '#2DAA6E',
		borderRadius: 5,
		padding: 8,
		marginTop: 12,
        alignSelf: 'center',
        width: '50%',
	},
    searchButtonText: {
        color: 'white',
        textAlign: 'center',
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
