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
import { Colors } from '../../constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

function timeLabel(recipe) {
	const total =
		(recipe.prepTimeHour ?? 0) * 60 +
		(recipe.prepTimeMin ?? 0) +
		(recipe.cookTimeHour ?? 0) * 60 +
		(recipe.cookTimeMin ?? 0);
	if (total === 0) return null;
	return total >= 60
		? `${Math.floor(total / 60)}h${total % 60 ? ` ${total % 60}m` : ''}`
		: `${total}m`;
}

function Tag({ label }) {
	return (
		<View style={styles.tag}>
			<Text style={styles.tagText}>{label}</Text>
		</View>
	);
}

function RecipeCard({ recipe, onPress }) {
	const time = timeLabel(recipe);
	return (
		<Pressable
			style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
			onPress={onPress}
		>
			<Image
				source={{ uri: recipe.recipePhotoUrl }}
				style={styles.cardImage}
			/>
			<View style={styles.cardBody}>
				{recipe.tags?.length > 0 && (
					<View style={styles.tagRow}>
						{recipe.tags.slice(0, 2).map((t) => (
							<Tag key={t} label={t} />
						))}
					</View>
				)}
				<Text style={styles.cardTitle} numberOfLines={2}>
					{recipe.recipeName}
				</Text>
				{(time || recipe.yield) && (
					<View style={styles.cardMeta}>
						{time && <Text style={styles.cardMetaText}>{time}</Text>}
						{time && recipe.yield ? <View style={styles.metaDot} /> : null}
						{recipe.yield ? (
							<Text style={styles.cardMetaText}>{recipe.yield} servings</Text>
						) : null}
					</View>
				)}
			</View>
		</Pressable>
	);
}

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

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size='large' color={Colors.blue600} />
			</View>
		);
	}

	const uniqueTags = [...new Set(recipes.flatMap((r) => r.tags ?? []))].sort();
	const filtered = activeTag
		? recipes.filter((r) => r.tags?.includes(activeTag))
		: recipes;

	const ListHeader = () => (
		<>
			<Text style={styles.eyebrow}>Your cookbook</Text>
			<Text style={styles.subtitle}>
				{recipes.length} {recipes.length === 1 ? 'dish' : 'dishes'}
			</Text>

			{uniqueTags.length > 0 && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterBar}
					style={styles.filterBarWrapper}
				>
					<Pressable
						style={[styles.chip, !activeTag && styles.chipActive]}
						onPress={() => setActiveTag(null)}
					>
						<Text style={[styles.chipText, !activeTag && styles.chipTextActive]}>
							All
						</Text>
					</Pressable>
					{uniqueTags.map((tag) => (
						<Pressable
							key={tag}
							style={[styles.chip, activeTag === tag && styles.chipActive]}
							onPress={() => setActiveTag(activeTag === tag ? null : tag)}
						>
							<Text
								style={[
									styles.chipText,
									activeTag === tag && styles.chipTextActive,
								]}
							>
								{tag}
							</Text>
						</Pressable>
					))}
				</ScrollView>
			)}

			<View style={styles.sectionRow}>
				<Text style={styles.sectionTitle}>All recipes</Text>
				<Text style={styles.sectionCount}>{filtered.length} total</Text>
			</View>
		</>
	);

	return (
		<View style={styles.container}>
			{error ? (
				<View style={styles.center}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			) : recipes.length === 0 ? (
				<View style={styles.center}>
					<Text style={styles.emptyTitle}>No recipes yet.</Text>
					<Text style={styles.emptyBody}>Tap Add to create your first recipe!</Text>
				</View>
			) : (
				<FlatList
					data={filtered}
					renderItem={({ item }) => (
						<RecipeCard
							recipe={item}
							onPress={() =>
								router.push({ pathname: '/recipeDetail', params: { id: item.id } })
							}
						/>
					)}
					keyExtractor={(item) => item.id?.toString()}
					contentContainerStyle={styles.listContent}
					ListHeaderComponent={<ListHeader />}
					ListEmptyComponent={
						<View style={styles.center}>
							<Text style={styles.emptyTitle}>No "{activeTag}" recipes.</Text>
							<Text style={styles.emptyBody}>Tap All to see everything.</Text>
						</View>
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								setRefreshing(true);
								fetchRecipes();
							}}
							tintColor={Colors.blue600}
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
		backgroundColor: Colors.bg,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: Colors.bg,
	},
	listContent: {
		paddingBottom: 24,
	},

	eyebrow: {
		fontFamily: 'Nunito-Bold',
		fontSize: 12,
		letterSpacing: 0.9,
		textTransform: 'uppercase',
		color: Colors.blue700,
		paddingHorizontal: 20,
		paddingTop: 22,
		marginBottom: 4,
	},
	subtitle: {
		fontFamily: 'Nunito-Medium',
		fontSize: 15,
		color: Colors.ink500,
		paddingHorizontal: 20,
		marginBottom: 16,
	},

	filterBarWrapper: {
		backgroundColor: Colors.bg,
	},
	filterBar: {
		paddingHorizontal: 16,
		paddingBottom: 18,
		gap: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	chip: {
		borderRadius: 999,
		paddingHorizontal: 16,
		paddingVertical: 9,
		backgroundColor: Colors.paper,
		borderWidth: 1,
		borderColor: Colors.ink300,
	},
	chipActive: {
		backgroundColor: Colors.blue700,
		borderColor: Colors.blue700,
	},
	chipText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13.5,
		color: Colors.ink700,
	},
	chipTextActive: {
		color: Colors.white,
	},

	sectionRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingBottom: 14,
	},
	sectionTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 26,
		color: Colors.ink900,
		letterSpacing: -0.5,
	},
	sectionCount: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13,
		color: Colors.ink500,
	},

	card: {
		backgroundColor: Colors.paper,
		borderRadius: 24,
		overflow: 'hidden',
		marginHorizontal: 16,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: Colors.ink200,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
	},
	cardPressed: {
		opacity: 0.87,
	},
	cardImage: {
		width: '100%',
		aspectRatio: 16 / 10,
		backgroundColor: Colors.blue100,
	},
	cardBody: {
		padding: 16,
		gap: 8,
	},
	tagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
	},
	tag: {
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
		backgroundColor: Colors.blue100,
	},
	tagText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 11.5,
		color: Colors.blue800,
	},
	cardTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 19,
		color: Colors.ink900,
		lineHeight: 24,
		letterSpacing: -0.3,
	},
	cardMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	cardMetaText: {
		fontFamily: 'Nunito-SemiBold',
		fontSize: 13,
		color: Colors.ink500,
	},
	metaDot: {
		width: 3,
		height: 3,
		borderRadius: 99,
		backgroundColor: Colors.ink300,
	},

	emptyTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 18,
		color: Colors.ink900,
		marginBottom: 8,
	},
	emptyBody: {
		fontFamily: 'Nunito-Regular',
		fontSize: 14,
		color: Colors.ink500,
		textAlign: 'center',
	},
	errorText: {
		fontFamily: 'Nunito-Regular',
		fontSize: 15,
		color: Colors.error,
		textAlign: 'center',
	},
});
