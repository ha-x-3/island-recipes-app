import React, { useState } from 'react';
import {
	View,
	TextInput,
	Pressable,
	FlatList,
	Text,
	Image,
	StyleSheet,
	ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { Colors } from '../../constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function Search() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [searched, setSearched] = useState(false);
	const router = useRouter();

	const searchRecipes = async () => {
		if (!query.trim()) return;
		setLoading(true);
		setError(null);
		setSearched(true);
		try {
			const response = await axios.get(`${BASE_URL}/api/recipes/search`, {
				params: { query },
			});
			setResults(response.data);
		} catch (err) {
			console.error(err);
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const renderRecipeItem = ({ item }) => (
		<Pressable
			style={({ pressed }) => [styles.resultCard, pressed && styles.cardPressed]}
			onPress={() =>
				router.push({ pathname: '/recipeDetail', params: { id: item.id } })
			}
		>
			<Image
				source={{ uri: item.recipePhotoUrl }}
				style={styles.resultImage}
			/>
			<View style={styles.resultInfo}>
				<Text
					style={styles.resultName}
					numberOfLines={2}
				>
					{item.recipeName}
				</Text>
				<Text
					style={styles.resultIngredients}
					numberOfLines={1}
				>
					{item.ingredients.map((i) => i.name).join(', ')}
				</Text>
			</View>
			<FontAwesomeIcon
				icon={faChevronRight}
				size={14}
				color={Colors.lightText}
			/>
		</Pressable>
	);

	return (
		<View style={styles.container}>
			<View style={styles.searchRow}>
				<View style={styles.searchInputWrapper}>
					<FontAwesomeIcon
						icon={faMagnifyingGlass}
						size={16}
						color={Colors.lightText}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder='Recipe name or ingredient…'
						value={query}
						onChangeText={setQuery}
						placeholderTextColor={Colors.mutedText}
						returnKeyType='search'
						onSubmitEditing={searchRecipes}
						autoCapitalize='none'
					/>
				</View>
				<Pressable
					style={({ pressed }) => [
						styles.searchButton,
						(!query.trim() || loading) && styles.searchButtonDisabled,
						pressed && styles.searchButtonPressed,
					]}
					onPress={searchRecipes}
					disabled={loading || !query.trim()}
				>
					<FontAwesomeIcon
						icon={faMagnifyingGlass}
						size={18}
						color={Colors.white}
					/>
				</Pressable>
			</View>

			{loading && (
				<ActivityIndicator
					style={styles.spinner}
					size='large'
					color={Colors.primary}
				/>
			)}

			{error && <Text style={styles.errorText}>{error}</Text>}

			{!loading && searched && results.length === 0 && !error && (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No recipes found for "{query}"</Text>
					<Text style={styles.emptySubText}>
						Try searching by ingredient or a different name.
					</Text>
				</View>
			)}

			<FlatList
				data={results}
				keyExtractor={(item) => item.id}
				renderItem={renderRecipeItem}
				contentContainerStyle={styles.listContent}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
		padding: 16,
	},
	searchRow: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 16,
	},
	searchInputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		height: 48,
		backgroundColor: Colors.white,
		borderRadius: 14,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		paddingHorizontal: 14,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	searchInput: {
		flex: 1,
		height: 48,
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.darkText,
	},
	searchButton: {
		width: 48,
		height: 48,
		borderRadius: 14,
		backgroundColor: Colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.18,
		shadowRadius: 6,
		elevation: 3,
	},
	searchButtonDisabled: {
		backgroundColor: Colors.inputBorder,
	},
	searchButtonPressed: {
		opacity: 0.75,
	},
	spinner: {
		marginTop: 32,
	},
	listContent: {
		gap: 10,
	},
	resultCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.cardBackground,
		borderRadius: 16,
		overflow: 'hidden',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.10,
		shadowRadius: 8,
		elevation: 3,
		paddingRight: 14,
		gap: 12,
	},
	cardPressed: {
		opacity: 0.85,
	},
	resultImage: {
		width: 80,
		height: 80,
	},
	resultInfo: {
		flex: 1,
		paddingVertical: 10,
		gap: 4,
	},
	resultName: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 15,
		color: Colors.darkText,
	},
	resultIngredients: {
		fontFamily: 'OpenSans',
		fontSize: 12,
		color: Colors.lightText,
	},
	emptyContainer: {
		alignItems: 'center',
		marginTop: 48,
	},
	emptyText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 16,
		color: Colors.darkText,
		marginBottom: 6,
		textAlign: 'center',
	},
	emptySubText: {
		fontFamily: 'OpenSans',
		fontSize: 13,
		color: Colors.lightText,
		textAlign: 'center',
	},
	errorText: {
		fontFamily: 'OpenSans',
		fontSize: 14,
		color: Colors.error,
		textAlign: 'center',
		marginTop: 16,
	},
});
