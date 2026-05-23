import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	FlatList,
	Pressable,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons/faClock';
import { Colors } from '../../constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function OurRecipes() {
	const [recipes, setRecipes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [activeTag, setActiveTag] = useState(null);
	const router = useRouter();

	const fetchRecipes = useCallback(async () => {
		try {
			setError(null);
			const response = await axios.get(`${BASE_URL}/api/recipes`);
			setRecipes(response.data);
		} catch (err) {
			console.error('Error fetching recipes:', err);
			setError('Could not load recipes. Pull down to try again.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		fetchRecipes();
	}, [fetchRecipes]);

	const onRefresh = () => {
		setRefreshing(true);
		fetchRecipes();
	};

	if (loading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator
					size='large'
					color={Colors.primary}
				/>
			</View>
		);
	}

	const uniqueTags = [...new Set(recipes.flatMap((r) => r.tags ?? []))].sort();
	const filteredRecipes = activeTag
		? recipes.filter((r) => r.tags?.includes(activeTag))
		: recipes;

	const renderRecipe = ({ item }) => {
		const totalMinutes =
			item.prepTimeHour * 60 +
			item.prepTimeMin +
			item.cookTimeHour * 60 +
			item.cookTimeMin;
		const timeLabel =
			totalMinutes >= 60
				? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
				: `${totalMinutes}m`;

		return (
			<Pressable
				style={({ pressed }) => [
					styles.card,
					pressed && styles.cardPressed,
				]}
				onPress={() =>
					router.push({ pathname: '/recipeDetail', params: { id: item.id } })
				}
			>
				<Image
					source={{ uri: item.recipePhotoUrl }}
					style={styles.cardImage}
				/>
				<View style={styles.cardInfo}>
					{item.tags?.length > 0 && (
						<View style={styles.cardTagRow}>
							{item.tags.slice(0, 2).map((tag) => (
								<View key={tag} style={styles.cardTag}>
									<Text style={styles.cardTagText}>{tag}</Text>
								</View>
							))}
						</View>
					)}
					<Text
						style={styles.cardTitle}
						numberOfLines={2}
					>
						{item.recipeName}
					</Text>
					<View style={styles.cardMeta}>
						<FontAwesomeIcon
							icon={faClock}
							size={13}
							color={Colors.lightText}
						/>
						<Text style={styles.cardTime}>{timeLabel}</Text>
						<Text style={styles.cardYield}>· {item.yield} servings</Text>
					</View>
				</View>
			</Pressable>
		);
	};

	return (
		<View style={styles.container}>
			{uniqueTags.length > 0 && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterBar}
					style={styles.filterBarWrapper}
				>
					<Pressable
						style={[styles.filterChip, !activeTag && styles.filterChipActive]}
						onPress={() => setActiveTag(null)}
					>
						<Text
							style={[
								styles.filterChipText,
								!activeTag && styles.filterChipTextActive,
							]}
						>
							All
						</Text>
					</Pressable>
					{uniqueTags.map((tag) => (
						<Pressable
							key={tag}
							style={[
								styles.filterChip,
								activeTag === tag && styles.filterChipActive,
							]}
							onPress={() => setActiveTag(activeTag === tag ? null : tag)}
						>
							<Text
								style={[
									styles.filterChipText,
									activeTag === tag && styles.filterChipTextActive,
								]}
							>
								{tag}
							</Text>
						</Pressable>
					))}
				</ScrollView>
			)}
			{error ? (
				<View style={styles.centerContainer}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			) : recipes.length === 0 ? (
				<View style={styles.centerContainer}>
					<Text style={styles.emptyText}>No recipes yet.</Text>
					<Text style={styles.emptySubText}>
						Tap Add to create your first recipe!
					</Text>
				</View>
			) : filteredRecipes.length === 0 ? (
				<View style={styles.centerContainer}>
					<Text style={styles.emptyText}>No recipes tagged "{activeTag}".</Text>
					<Text style={styles.emptySubText}>
						Tap All to see everything, or add this tag to a recipe.
					</Text>
				</View>
			) : (
				<FlatList
					data={filteredRecipes}
					renderItem={renderRecipe}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							tintColor={Colors.primary}
						/>
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: Colors.background,
	},
	listContent: {
		padding: 16,
		gap: 16,
	},
	card: {
		backgroundColor: Colors.cardBackground,
		borderRadius: 20,
		overflow: 'hidden',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 5,
	},
	cardPressed: {
		opacity: 0.87,
	},
	cardImage: {
		width: '100%',
		height: 185,
	},
	cardInfo: {
		padding: 16,
		gap: 8,
	},
	cardTitle: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 18,
		color: Colors.darkText,
		lineHeight: 26,
	},
	cardMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	cardTime: {
		fontFamily: 'OpenSans',
		fontSize: 13,
		color: Colors.lightText,
	},
	cardYield: {
		fontFamily: 'OpenSans',
		fontSize: 13,
		color: Colors.lightText,
	},
	emptyText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 18,
		color: Colors.darkText,
		marginBottom: 8,
	},
	emptySubText: {
		fontFamily: 'OpenSans',
		fontSize: 14,
		color: Colors.lightText,
		textAlign: 'center',
	},
	errorText: {
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.error,
		textAlign: 'center',
	},
	filterBarWrapper: {
		backgroundColor: Colors.background,
		borderBottomColor: Colors.divider,
		borderBottomWidth: 1,
	},
	filterBar: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		gap: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	filterChip: {
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: Colors.white,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
	},
	filterChipActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	filterChipText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 13,
		color: Colors.darkText,
	},
	filterChipTextActive: {
		color: Colors.white,
	},
	cardTagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
	},
	cardTag: {
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
		backgroundColor: Colors.primaryLight,
	},
	cardTagText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 11,
		color: Colors.primary,
	},
});
