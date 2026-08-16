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
import { Svg, Path, Circle } from 'react-native-svg';
import axios from 'axios';
import { useRouter } from 'expo-router';
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

	const clearSearch = () => {
		setQuery('');
		setResults([]);
		setSearched(false);
		setError(null);
	};

	const renderItem = ({ item }) => (
		<Pressable
			style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.87 }]}
			onPress={() =>
				router.push({ pathname: '/recipeDetail', params: { id: item.id } })
			}
		>
			<Image source={{ uri: item.recipePhotoUrl }} style={styles.resultImage} />
			<View style={styles.resultInfo}>
				<Text style={styles.resultName} numberOfLines={2}>
					{item.recipeName}
				</Text>
				{item.tags?.length > 0 && (
					<View style={styles.tagRow}>
						{item.tags.slice(0, 3).map((t) => (
							<View key={t} style={styles.tag}>
								<Text style={styles.tagText}>{t}</Text>
							</View>
						))}
					</View>
				)}
				{item.ingredients?.length > 0 && (
					<Text style={styles.resultSub} numberOfLines={1}>
						{item.ingredients.map((i) => i.name).join(', ')}
					</Text>
				)}
			</View>
			<View style={styles.chevronWrap}>
				<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
					stroke={Colors.blue700} strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
					<Path d='m9 6 6 6-6 6' />
				</Svg>
			</View>
		</Pressable>
	);

	return (
		<View style={styles.container}>
			{/* Page header */}
			<Text style={styles.eyebrow}>Find a recipe</Text>
			<Text style={styles.pageTitle}>Search</Text>
			<Text style={styles.pageSubtitle}>By recipe name, ingredient, or tag</Text>

			{/* Search bar */}
			<View style={styles.searchBar}>
				<Svg width={20} height={20} viewBox='0 0 24 24' fill='none'
					stroke={Colors.ink500} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
					<Circle cx='11' cy='11' r='7' />
					<Path d='m20 20-3.5-3.5' />
				</Svg>
				<TextInput
					style={styles.searchInput}
					placeholder='Recipe name or ingredient…'
					value={query}
					onChangeText={setQuery}
					placeholderTextColor={Colors.ink400}
					returnKeyType='search'
					onSubmitEditing={searchRecipes}
					autoCapitalize='none'
				/>
				{query.length > 0 && (
					<Pressable hitSlop={8} onPress={clearSearch} style={styles.clearBtn}>
						<Svg width={14} height={14} viewBox='0 0 24 24' fill='none'
							stroke={Colors.ink700} strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
							<Path d='m6 6 12 12M18 6 6 18' />
						</Svg>
					</Pressable>
				)}
				<Pressable
					style={[styles.searchBtn, (!query.trim() || loading) && styles.searchBtnDisabled]}
					onPress={searchRecipes}
					disabled={loading || !query.trim()}
				>
					<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
						stroke='#fff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<Circle cx='11' cy='11' r='7' />
						<Path d='m20 20-3.5-3.5' />
					</Svg>
				</Pressable>
			</View>

			{/* Hint */}
			{!searched && !loading && (
				<Text style={styles.hint}>Search by recipe name, ingredient, or tag</Text>
			)}

			{loading && (
				<ActivityIndicator style={styles.spinner} size='large' color={Colors.blue600} />
			)}

			{error && (
				<Text style={styles.errorText}>{error}</Text>
			)}

			{!loading && searched && results.length === 0 && !error && (
				<View style={styles.empty}>
					<Text style={styles.emptyTitle}>No results for "{query}"</Text>
					<Text style={styles.emptyBody}>Try a different name or ingredient.</Text>
				</View>
			)}

			{results.length > 0 && (
				<>
					<Text style={styles.resultsLabel}>
						{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
					</Text>
					<FlatList
						data={results}
						keyExtractor={(item) => item.id?.toString()}
						renderItem={renderItem}
						contentContainerStyle={styles.list}
					/>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.bg,
		paddingHorizontal: 16,
		paddingTop: 20,
	},
	eyebrow: {
		fontFamily: 'Nunito-Bold',
		fontSize: 11,
		letterSpacing: 1.1,
		textTransform: 'uppercase',
		color: Colors.blue700,
		marginBottom: 2,
	},
	pageTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 34,
		color: Colors.ink900,
		letterSpacing: -0.8,
		marginBottom: 2,
	},
	pageSubtitle: {
		fontFamily: 'Nunito-Medium',
		fontSize: 14,
		color: Colors.ink500,
		marginBottom: 16,
	},

	// Search bar
	searchBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: Colors.paper,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: Colors.ink200,
		paddingHorizontal: 18,
		paddingVertical: 10,
		height: 58,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		marginBottom: 14,
	},
	searchInput: {
		flex: 1,
		fontFamily: 'Nunito-Medium',
		fontSize: 16,
		color: Colors.ink900,
	},
	clearBtn: {
		width: 28,
		height: 28,
		borderRadius: 999,
		backgroundColor: Colors.ink200,
		alignItems: 'center',
		justifyContent: 'center',
	},
	searchBtn: {
		width: 40,
		height: 40,
		borderRadius: 999,
		backgroundColor: Colors.blue600,
		alignItems: 'center',
		justifyContent: 'center',
	},
	searchBtnDisabled: {
		backgroundColor: Colors.ink300,
	},

	hint: {
		fontFamily: 'Nunito-Medium',
		fontSize: 14,
		color: Colors.ink500,
		textAlign: 'center',
		marginTop: 24,
	},
	spinner: {
		marginTop: 32,
	},

	resultsLabel: {
		fontFamily: 'Nunito-Bold',
		fontSize: 12,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		color: Colors.ink500,
		marginBottom: 12,
	},
	list: {
		gap: 10,
		paddingBottom: 24,
	},

	// Result card
	resultCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.paper,
		borderRadius: 20,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: Colors.ink200,
		paddingRight: 14,
		gap: 14,
	},
	resultImage: {
		width: 88,
		height: 88,
		backgroundColor: Colors.blue100,
	},
	resultInfo: {
		flex: 1,
		paddingVertical: 12,
		gap: 6,
	},
	resultName: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 16,
		color: Colors.ink900,
		lineHeight: 21,
		letterSpacing: -0.2,
	},
	tagRow: {
		flexDirection: 'row',
		gap: 5,
		flexWrap: 'wrap',
	},
	tag: {
		borderRadius: 999,
		paddingHorizontal: 9,
		paddingVertical: 3,
		backgroundColor: Colors.blue100,
	},
	tagText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 11,
		color: Colors.blue800,
	},
	resultSub: {
		fontFamily: 'Nunito-Regular',
		fontSize: 12,
		color: Colors.ink500,
	},
	chevronWrap: {
		width: 36,
		height: 36,
		borderRadius: 999,
		backgroundColor: Colors.blue100,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// States
	empty: {
		alignItems: 'center',
		marginTop: 48,
	},
	emptyTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 16,
		color: Colors.ink900,
		marginBottom: 6,
		textAlign: 'center',
	},
	emptyBody: {
		fontFamily: 'Nunito-Regular',
		fontSize: 13,
		color: Colors.ink500,
		textAlign: 'center',
	},
	errorText: {
		fontFamily: 'Nunito-Regular',
		fontSize: 14,
		color: Colors.error,
		textAlign: 'center',
		marginTop: 16,
	},
});
