import React, { useCallback, useState } from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	ScrollView,
	Pressable,
	Alert,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { Svg, Path } from 'react-native-svg';
import {
	GestureHandlerRootView,
	PanGestureHandler,
} from 'react-native-gesture-handler';
import { useShoppingList } from '../components/ShoppingListProvider';
import RecipeDetailPDF from '../components/RecipeDetailPDF';
import { roundToTwoDecimalPlaces } from '../utils/utlityFunctions';
import { Colors } from '../constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function fmtTime(recipe) {
	const total =
		(recipe.prepTimeHour ?? 0) * 60 +
		(recipe.prepTimeMin ?? 0) +
		(recipe.cookTimeHour ?? 0) * 60 +
		(recipe.cookTimeMin ?? 0);
	if (total === 0) return '—';
	return total >= 60
		? `${Math.floor(total / 60)}h${total % 60 ? ` ${total % 60}m` : ''}`
		: `${total}m`;
}

function MetaCell({ value, label }) {
	return (
		<View style={styles.metaCell}>
			<Text style={styles.metaValue}>{value}</Text>
			<Text style={styles.metaLabel}>{label}</Text>
		</View>
	);
}

function SectionHead({ title, hint }) {
	return (
		<View style={styles.sectionHead}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
		</View>
	);
}

function StepRow({ index, text }) {
	return (
		<View style={styles.stepRow}>
			<View style={styles.stepPill}>
				<Text style={styles.stepNum}>{index + 1}</Text>
			</View>
			<Text style={styles.stepText}>{text}</Text>
		</View>
	);
}

function IngredientRow({ ingredient, inCart, onPress }) {
	return (
		<TouchableOpacity
			style={[styles.ingredientRow, inCart && styles.ingredientRowInCart]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={[styles.ingredientCheck, inCart && styles.ingredientCheckDone]}>
				{inCart && (
					<Svg width={13} height={13} viewBox='0 0 24 24' fill='none'
						stroke='#fff' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round'>
						<Path d='m4 12 5 5L20 6' />
					</Svg>
				)}
			</View>
			<Text style={[styles.ingredientText, inCart && styles.ingredientTextDone]}>
				<Text style={styles.ingredientAmount}>
					{ingredient.amount} {ingredient.unit}{' '}
				</Text>
				{ingredient.name}
			</Text>
			{inCart && <Text style={styles.inCartLabel}>IN CART</Text>}
		</TouchableOpacity>
	);
}

function NutCell({ value, label }) {
	return (
		<View style={styles.nutCell}>
			<Text style={styles.nutValue}>{value ?? '—'}</Text>
			<Text style={styles.nutLabel}>{label}</Text>
		</View>
	);
}

export default function RecipeDetail() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [recipe, setRecipe] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isCookingMode, setIsCookingMode] = useState(false);
	const [paths, setPaths] = useState([]);
	const [currentPath, setCurrentPath] = useState('');
	const [isEraseMode, setIsEraseMode] = useState(false);
	const [cartIngredients, setCartIngredients] = useState(new Set());
	const { addItem } = useShoppingList();

	useFocusEffect(
		useCallback(() => {
			let active = true;
			const fetchRecipe = async () => {
				setLoading(true);
				try {
					const response = await axios.get(`${BASE_URL}/api/recipes/${id}`);
					if (active) setRecipe(response.data);
				} catch (error) {
					console.error('Error fetching recipe details:', error);
				} finally {
					if (active) setLoading(false);
				}
			};
			if (id) fetchRecipe();
			return () => { active = false; };
		}, [id])
	);

	const handleDelete = () => {
		Alert.alert(
			'Delete Recipe',
			`Are you sure you want to delete "${recipe.recipeName}"? This cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await axios.delete(`${BASE_URL}/api/recipes/${id}`);
							router.replace('/(tabs)');
						} catch {
							Alert.alert('Error', 'Could not delete recipe. Please try again.');
						}
					},
				},
			]
		);
	};

	const handleGesture = (event) => {
		const { x, y } = event.nativeEvent;
		if (isEraseMode) {
			setPaths((prev) =>
				prev.filter((path) => {
					const points = path.split('L').slice(1);
					return !points.some((point) => {
						const [px, py] = point.trim().split(',');
						return Math.sqrt((x - parseFloat(px)) ** 2 + (y - parseFloat(py)) ** 2) < 20;
					});
				})
			);
		} else {
			setCurrentPath((prev) =>
				prev === '' ? `M ${x},${y}` : `${prev} L ${x},${y}`
			);
		}
	};

	const handleGestureEnd = () => {
		if (!isEraseMode && currentPath) {
			setPaths((prev) => [...prev, currentPath]);
			setCurrentPath('');
		}
	};

	const handleIngredientPress = (ingredient, idx) => {
		if (cartIngredients.has(idx)) return;
		Alert.alert(
			'Add to Cart',
			`Add ${ingredient.name} to your shopping list?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Add',
					onPress: () => {
						addItem(ingredient);
						setCartIngredients((prev) => new Set([...prev, idx]));
					},
				},
			]
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={Colors.blue600} />
			</View>
		);
	}

	if (!recipe) {
		return (
			<View style={styles.loadingContainer}>
				<Text style={styles.errorText}>Recipe not found.</Text>
			</View>
		);
	}

	const steps = recipe.instructions
		? recipe.instructions.split(/\n\n+/).filter((s) => s.trim())
		: [recipe.instructions].filter(Boolean);
	const totalTime = fmtTime(recipe);
	const prepMin = (recipe.prepTimeHour ?? 0) * 60 + (recipe.prepTimeMin ?? 0);
	const cookMin = (recipe.cookTimeHour ?? 0) * 60 + (recipe.cookTimeMin ?? 0);
	const prepLabel = prepMin ? (prepMin >= 60 ? `${Math.floor(prepMin/60)}h${prepMin%60 ? ` ${prepMin%60}m` : ''}` : `${prepMin}m`) : '—';
	const cookLabel = cookMin ? (cookMin >= 60 ? `${Math.floor(cookMin/60)}h${cookMin%60 ? ` ${cookMin%60}m` : ''}` : `${cookMin}m`) : '—';

	const nut = recipe.nutritionalData;
	const hasNutrition = !!nut;

	return (
		<GestureHandlerRootView style={styles.root}>
			<Stack.Screen
				options={{
					title: '',
					headerRight: () => (
						<View style={styles.headerActions}>
							<Pressable
								hitSlop={8}
								onPress={() => router.push({ pathname: '/editRecipe', params: { id } })}
							>
								<Svg width={20} height={20} viewBox='0 0 24 24' fill='none'
									stroke={Colors.ink700} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
									<Path d='M16 3.5 20.5 8 8 20.5H3.5V16Z' />
									<Path d='m13.5 6 4.5 4.5' />
								</Svg>
							</Pressable>
							<Pressable hitSlop={8} onPress={handleDelete}>
								<Svg width={20} height={20} viewBox='0 0 24 24' fill='none'
									stroke={Colors.danger} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
									<Path d='M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13' />
									<Path d='M10 11v6M14 11v6' />
								</Svg>
							</Pressable>
						</View>
					),
				}}
			/>

			<ScrollView
				style={styles.scroll}
				scrollEnabled={!isCookingMode}
			>
				{/* Hero image */}
				<Image
					source={{ uri: recipe.recipePhotoUrl }}
					style={styles.heroImage}
				/>

				<View style={styles.body}>
					{/* Tags */}
					{recipe.tags?.length > 0 && (
						<View style={styles.tagRow}>
							{recipe.tags.map((tag) => (
								<View key={tag} style={styles.tag}>
									<Text style={styles.tagText}>{tag}</Text>
								</View>
							))}
						</View>
					)}

					{/* Title */}
					<Text style={styles.recipeTitle}>{recipe.recipeName}</Text>

					{/* Meta strip */}
					<View style={styles.metaStrip}>
						<MetaCell value={recipe.yield ?? '—'} label='servings' />
						<View style={styles.metaDivider} />
						<MetaCell value={totalTime} label='total time' />
						<View style={styles.metaDivider} />
						<MetaCell value={prepLabel} label='prep' />
						<View style={styles.metaDivider} />
						<MetaCell value={cookLabel} label='cook' />
					</View>

					{/* Ingredients */}
					<SectionHead title='Ingredients' hint='Tap any to add to cart' />
					<View style={styles.ingredientsList}>
						{recipe.ingredients.map((item, idx) => (
							<IngredientRow
								key={idx}
								ingredient={item}
								inCart={cartIngredients.has(idx)}
								onPress={() => handleIngredientPress(item, idx)}
							/>
						))}
					</View>

					<Pressable
						style={({ pressed }) => [styles.addAllBtn, pressed && { opacity: 0.8 }]}
						onPress={() => {
							recipe.ingredients.forEach((item, idx) => {
								addItem(item);
								setCartIngredients((prev) => new Set([...prev, idx]));
							});
						}}
					>
						<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
							stroke={Colors.sage700} strokeWidth='2.1' strokeLinecap='round' strokeLinejoin='round'>
							<Path d='M3 4h2.5l2.4 11.2a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-2l1-7H6.5' />
							<Path d='M10 20a1.6 1.6 0 1 1 0 .001M17 20a1.6 1.6 0 1 1 0 .001' />
						</Svg>
						<Text style={styles.addAllBtnText}>Add all to shopping list</Text>
					</Pressable>

					{/* Method */}
					{steps.length > 0 && (
						<>
							<SectionHead
								title='Method'
								hint={steps.length > 1 ? `${steps.length} steps` : undefined}
							/>
							<View style={styles.stepsList}>
								{steps.map((step, i) => (
									<StepRow key={i} index={i} text={step.trim()} />
								))}
							</View>
						</>
					)}

					{/* Nutrition */}
					{hasNutrition && (
						<>
							<SectionHead title='Per serving' hint='Nutritional estimate' />
							<View style={styles.nutGrid}>
								<NutCell
									value={
										nut.calories
											? `${roundToTwoDecimalPlaces(nut.calories / (recipe.yield || 1))}`
											: null
									}
									label='Calories'
								/>
								{nut.totalNutrients?.FAT && (
									<NutCell
										value={`${roundToTwoDecimalPlaces(nut.totalNutrients.FAT.quantity / (recipe.yield || 1))}${nut.totalNutrients.FAT.unit}`}
										label='Fat'
									/>
								)}
								{nut.totalNutrients?.PROCNT && (
									<NutCell
										value={`${roundToTwoDecimalPlaces(nut.totalNutrients.PROCNT.quantity / (recipe.yield || 1))}${nut.totalNutrients.PROCNT.unit}`}
										label='Protein'
									/>
								)}
								{nut.totalNutrients?.NA && (
									<NutCell
										value={`${roundToTwoDecimalPlaces(nut.totalNutrients.NA.quantity / (recipe.yield || 1))}${nut.totalNutrients.NA.unit}`}
										label='Sodium'
									/>
								)}
							</View>
						</>
					)}

					{/* Actions */}
					<View style={styles.actionRow}>
						<Pressable
							style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.8 }]}
							onPress={() => setIsCookingMode(true)}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke='#fff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='M7 2v9a2 2 0 0 0 2 2v8' />
								<Path d='M11 2v9a2 2 0 0 1-2 2' />
								<Path d='M7 6v2M17 2c-1.5 0-3 1.5-3 4v6h2.5V22H18V2z' />
							</Svg>
							<Text style={styles.actionBtnText}>Cooking Mode</Text>
						</Pressable>
						<Pressable
							style={({ pressed }) => [styles.actionBtn, styles.actionBtnOutline, pressed && { opacity: 0.8 }]}
							onPress={async () => {
								try {
									await RecipeDetailPDF.preview(recipe);
								} catch {
									Alert.alert('Error', 'Failed to generate PDF. Please try again.');
								}
							}}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={Colors.ink700} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='M6 4h12v17l-6-4-6 4z' />
							</Svg>
							<Text style={styles.actionBtnTextOutline}>Share / Print</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>

			{/* Cooking mode overlay */}
			{isCookingMode && (
				<View style={styles.cookingOverlay}>
					<PanGestureHandler
						onGestureEvent={handleGesture}
						onEnded={handleGestureEnd}
					>
						<View style={styles.canvas}>
							<Svg height={SCREEN_HEIGHT} width={SCREEN_WIDTH}>
								{paths.map((path, i) => (
									<Path key={i} d={path} stroke={Colors.blue600} strokeWidth={3} fill='none' />
								))}
								{currentPath !== '' && (
									<Path d={currentPath} stroke={Colors.blue600} strokeWidth={3} fill='none' />
								)}
							</Svg>
						</View>
					</PanGestureHandler>
					<View style={styles.cookingToolbar}>
						<Pressable
							style={[styles.toolbarBtn, !isEraseMode && styles.toolbarBtnActive]}
							onPress={() => setIsEraseMode(false)}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={!isEraseMode ? '#fff' : Colors.ink700}
								strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='M16 3.5 20.5 8 8 20.5H3.5V16Z' />
								<Path d='m13.5 6 4.5 4.5' />
							</Svg>
						</Pressable>
						<Pressable
							style={[styles.toolbarBtn, isEraseMode && styles.toolbarBtnActive]}
							onPress={() => setIsEraseMode(true)}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={isEraseMode ? '#fff' : Colors.ink700}
								strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='M20 20H7L3 16l13-13 4 4-1.5 1.5' />
								<Path d='m6 17 4-4' />
							</Svg>
						</Pressable>
						<Pressable
							style={styles.toolbarBtn}
							onPress={() => { setPaths([]); setCurrentPath(''); }}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={Colors.ink700} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='M21 12a9 9 0 1 1-3.6-7.2' />
								<Path d='M21 4v5h-5' />
							</Svg>
						</Pressable>
						<Pressable
							style={[styles.toolbarBtn, styles.toolbarBtnExit]}
							onPress={() => { setIsCookingMode(false); setPaths([]); setCurrentPath(''); setIsEraseMode(false); }}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke='#fff' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='m6 6 12 12M18 6 6 18' />
							</Svg>
						</Pressable>
					</View>
				</View>
			)}
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: Colors.bg,
	},
	scroll: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.bg,
	},
	heroImage: {
		width: '100%',
		height: 280,
		resizeMode: 'cover',
		backgroundColor: Colors.blue100,
	},
	body: {
		backgroundColor: Colors.paper,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -28,
		paddingTop: 24,
		paddingHorizontal: 20,
		paddingBottom: 48,
	},

	// Tags
	tagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
		marginBottom: 14,
	},
	tag: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 5,
		backgroundColor: Colors.blue100,
	},
	tagText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 11.5,
		color: Colors.blue800,
	},

	// Title
	recipeTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 28,
		color: Colors.ink900,
		lineHeight: 34,
		letterSpacing: -0.5,
		marginBottom: 20,
	},

	// Meta
	metaStrip: {
		flexDirection: 'row',
		backgroundColor: Colors.bg,
		borderRadius: 18,
		paddingVertical: 16,
		paddingHorizontal: 8,
		marginBottom: 28,
		borderWidth: 1,
		borderColor: Colors.ink200,
		alignItems: 'center',
	},
	metaCell: {
		flex: 1,
		alignItems: 'center',
	},
	metaValue: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 18,
		color: Colors.ink900,
		letterSpacing: -0.3,
	},
	metaLabel: {
		fontFamily: 'Nunito-SemiBold',
		fontSize: 10.5,
		color: Colors.ink500,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginTop: 3,
	},
	metaDivider: {
		width: 1,
		height: 32,
		backgroundColor: Colors.ink200,
	},

	// Section head
	sectionHead: {
		marginBottom: 14,
		marginTop: 4,
	},
	sectionTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 22,
		color: Colors.ink900,
		letterSpacing: -0.3,
	},
	sectionHint: {
		fontFamily: 'Nunito-SemiBold',
		fontSize: 12.5,
		color: Colors.ink500,
		marginTop: 3,
	},

	// Ingredients
	ingredientsList: {
		marginBottom: 14,
	},
	ingredientRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 11,
		paddingHorizontal: 10,
		borderRadius: 12,
	},
	ingredientRowInCart: {
		backgroundColor: Colors.sage100,
	},
	ingredientCheck: {
		width: 22,
		height: 22,
		borderRadius: 999,
		borderWidth: 1.5,
		borderColor: Colors.ink300,
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	ingredientCheckDone: {
		backgroundColor: Colors.sage600,
		borderWidth: 0,
	},
	ingredientText: {
		flex: 1,
		fontFamily: 'Nunito-Medium',
		fontSize: 14.5,
		color: Colors.ink900,
	},
	ingredientTextDone: {
		color: Colors.ink500,
	},
	ingredientAmount: {
		fontFamily: 'Nunito-Bold',
		color: Colors.ink700,
	},
	inCartLabel: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 10.5,
		color: Colors.sage700,
		letterSpacing: 0.5,
	},
	addAllBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 14,
		borderRadius: 14,
		backgroundColor: Colors.sage100,
		marginBottom: 32,
	},
	addAllBtnText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 14.5,
		color: Colors.sage700,
	},

	// Steps
	stepsList: {
		gap: 20,
		marginBottom: 32,
	},
	stepRow: {
		flexDirection: 'row',
		gap: 14,
		alignItems: 'flex-start',
	},
	stepPill: {
		width: 36,
		height: 36,
		borderRadius: 12,
		backgroundColor: Colors.blue600,
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	},
	stepNum: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 16,
		color: Colors.white,
	},
	stepText: {
		flex: 1,
		fontFamily: 'Nunito-Medium',
		fontSize: 15,
		color: Colors.ink700,
		lineHeight: 23,
		paddingTop: 6,
	},

	// Nutrition
	nutGrid: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 28,
		flexWrap: 'wrap',
	},
	nutCell: {
		flex: 1,
		minWidth: 72,
		backgroundColor: Colors.blue50,
		borderRadius: 16,
		padding: 14,
		borderWidth: 1,
		borderColor: Colors.blue100,
	},
	nutValue: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 20,
		color: Colors.blue800,
		letterSpacing: -0.3,
	},
	nutLabel: {
		fontFamily: 'Nunito-Bold',
		fontSize: 11,
		color: Colors.ink500,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginTop: 5,
	},

	// Actions
	actionRow: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 8,
	},
	actionBtn: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 15,
		borderRadius: 999,
	},
	actionBtnPrimary: {
		backgroundColor: Colors.blue600,
	},
	actionBtnOutline: {
		borderWidth: 1,
		borderColor: Colors.ink300,
		backgroundColor: Colors.paper,
	},
	actionBtnText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 14.5,
		color: Colors.white,
	},
	actionBtnTextOutline: {
		fontFamily: 'Nunito-Bold',
		fontSize: 14.5,
		color: Colors.ink900,
	},

	// Header
	headerActions: {
		flexDirection: 'row',
		gap: 18,
		marginRight: 4,
	},
	errorText: {
		fontFamily: 'Nunito-Regular',
		fontSize: 16,
		color: Colors.error,
	},

	// Cooking mode
	cookingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255,255,255,0.06)',
		zIndex: 10,
	},
	canvas: {
		flex: 1,
	},
	cookingToolbar: {
		position: 'absolute',
		bottom: 40,
		right: 20,
		gap: 10,
	},
	toolbarBtn: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: Colors.paper,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.14,
		shadowRadius: 6,
		elevation: 4,
	},
	toolbarBtnActive: {
		backgroundColor: Colors.blue600,
	},
	toolbarBtnExit: {
		backgroundColor: Colors.danger,
		marginTop: 8,
	},
});
