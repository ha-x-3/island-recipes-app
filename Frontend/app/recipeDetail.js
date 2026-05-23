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
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons/faUtensils';
import { faEraser } from '@fortawesome/free-solid-svg-icons/faEraser';
import { faPencil } from '@fortawesome/free-solid-svg-icons/faPencil';
import { faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons/faArrowRotateLeft';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { faFilePdf } from '@fortawesome/free-regular-svg-icons/faFilePdf';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { useShoppingList } from '../components/ShoppingListProvider';
import RecipeDetailPDF from '../components/RecipeDetailPDF';
import { roundToTwoDecimalPlaces } from '../utils/utlityFunctions';
import { Colors } from '../constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RecipeDetail() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [recipe, setRecipe] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isCookingMode, setIsCookingMode] = useState(false);
	const [paths, setPaths] = useState([]);
	const [currentPath, setCurrentPath] = useState('');
	const [isEraseMode, setIsEraseMode] = useState(false);
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
						} catch (error) {
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
						return (
							Math.sqrt(
								(x - parseFloat(px)) ** 2 + (y - parseFloat(py)) ** 2
							) < 20
						);
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

	const previewPDF = async () => {
		try {
			await RecipeDetailPDF.preview(recipe);
		} catch (error) {
			console.error('Error previewing PDF:', error);
			Alert.alert('Error', 'Failed to generate PDF. Please try again.');
		}
	};

	const addIngredientToShoppingList = (ingredient) => {
		Alert.alert(
			'Add to Cart',
			`Add ${ingredient.name} to your shopping list?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Add', onPress: () => addItem(ingredient) },
			]
		);
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator
					size='large'
					color={Colors.primary}
				/>
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

	const totalMinutes =
		recipe.prepTimeHour * 60 +
		recipe.prepTimeMin +
		recipe.cookTimeHour * 60 +
		recipe.cookTimeMin;
	const timeLabel =
		totalMinutes >= 60
			? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
			: `${totalMinutes}m`;

	return (
		<GestureHandlerRootView style={styles.root}>
			<Stack.Screen
				options={{
					title: recipe.recipeName,
					headerRight: () => (
						<View style={styles.headerButtons}>
							<Pressable
								onPress={() =>
									router.push({ pathname: '/editRecipe', params: { id } })
								}
								hitSlop={8}
							>
								<FontAwesomeIcon icon={faPencil} size={18} color={Colors.white} />
							</Pressable>
							<Pressable onPress={handleDelete} hitSlop={8}>
								<FontAwesomeIcon icon={faTrash} size={18} color={Colors.white} />
							</Pressable>
						</View>
					),
				}}
			/>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				scrollEnabled={!isCookingMode}
			>
				<Image
					source={{ uri: recipe.recipePhotoUrl }}
					style={styles.heroImage}
				/>

				<View style={styles.body}>
					{recipe.tags?.length > 0 && (
						<View style={styles.tagRow}>
							{recipe.tags.map((tag) => (
								<View key={tag} style={styles.tagChip}>
									<Text style={styles.tagChipText}>{tag}</Text>
								</View>
							))}
						</View>
					)}

					<Text style={styles.title}>{recipe.recipeName}</Text>

					<View style={styles.metaRow}>
						<View style={styles.metaBadge}>
							<Text style={styles.metaValue}>{recipe.yield}</Text>
							<Text style={styles.metaLabel}>servings</Text>
						</View>
						<View style={styles.metaDivider} />
						<View style={styles.metaBadge}>
							<Text style={styles.metaValue}>{timeLabel}</Text>
							<Text style={styles.metaLabel}>total time</Text>
						</View>
						<View style={styles.metaDivider} />
						<View style={styles.metaBadge}>
							<Text style={styles.metaValue}>
								{recipe.prepTimeHour}h {recipe.prepTimeMin}m
							</Text>
							<Text style={styles.metaLabel}>prep</Text>
						</View>
					</View>

					<Text style={styles.sectionTitle}>Ingredients</Text>
					<Text style={styles.sectionHint}>Tap an ingredient to add to cart</Text>
					<View style={styles.ingredientsGrid}>
						{recipe.ingredients.map((item, idx) => (
							<TouchableOpacity
								key={idx}
								style={styles.ingredientChip}
								onPress={() => addIngredientToShoppingList(item)}
								activeOpacity={0.7}
							>
								<Text style={styles.ingredientText}>
									{item.amount} {item.unit} {item.name}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					<Text style={styles.sectionTitle}>Instructions</Text>
					<Text style={styles.instructions}>{recipe.instructions}</Text>

					{recipe.nutritionalData && (
						<>
							<Text style={styles.sectionTitle}>Nutrition per serving</Text>
							<View style={styles.nutritionGrid}>
								<View style={styles.nutritionCard}>
									<Text style={styles.nutritionValue}>
										{recipe.nutritionalData.calories
											? roundToTwoDecimalPlaces(recipe.nutritionalData.calories / recipe.yield)
											: '—'}
									</Text>
									<Text style={styles.nutritionLabel}>Calories</Text>
								</View>
								{recipe.nutritionalData.totalNutrients && (
									<>
										<View style={styles.nutritionCard}>
											<Text style={styles.nutritionValue}>
												{roundToTwoDecimalPlaces(
													recipe.nutritionalData.totalNutrients.FAT
														?.quantity / recipe.yield
												)}
												{recipe.nutritionalData.totalNutrients.FAT?.unit}
											</Text>
											<Text style={styles.nutritionLabel}>Fat</Text>
										</View>
										<View style={styles.nutritionCard}>
											<Text style={styles.nutritionValue}>
												{roundToTwoDecimalPlaces(
													recipe.nutritionalData.totalNutrients.PROCNT
														?.quantity / recipe.yield
												)}
												{
													recipe.nutritionalData.totalNutrients.PROCNT
														?.unit
												}
											</Text>
											<Text style={styles.nutritionLabel}>Protein</Text>
										</View>
										<View style={styles.nutritionCard}>
											<Text style={styles.nutritionValue}>
												{roundToTwoDecimalPlaces(
													recipe.nutritionalData.totalNutrients.NA
														?.quantity / recipe.yield
												)}
												{recipe.nutritionalData.totalNutrients.NA?.unit}
											</Text>
											<Text style={styles.nutritionLabel}>Sodium</Text>
										</View>
									</>
								)}
							</View>
						</>
					)}

					<View style={styles.actionRow}>
						<Pressable
							style={({ pressed }) => [
								styles.actionButton,
								styles.cookingButton,
								pressed && styles.buttonPressed,
							]}
							onPress={() => setIsCookingMode(true)}
						>
							<FontAwesomeIcon
								icon={faUtensils}
								size={16}
								color={Colors.white}
							/>
							<Text style={styles.actionButtonText}>Cooking Mode</Text>
						</Pressable>

						<Pressable
							style={({ pressed }) => [
								styles.actionButton,
								styles.pdfButton,
								pressed && styles.buttonPressed,
							]}
							onPress={previewPDF}
						>
							<FontAwesomeIcon
								icon={faFilePdf}
								size={16}
								color={Colors.white}
							/>
							<Text style={styles.actionButtonText}>Share / Print</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>

			{isCookingMode && (
				<View style={styles.cookingOverlay}>
					<PanGestureHandler
						onGestureEvent={handleGesture}
						onEnded={handleGestureEnd}
					>
						<View style={styles.canvas}>
							<Svg
								height={SCREEN_HEIGHT}
								width={SCREEN_WIDTH}
							>
								{paths.map((path, index) => (
									<Path
										key={index}
										d={path}
										stroke={Colors.primary}
										strokeWidth={3}
										fill='none'
									/>
								))}
								{currentPath !== '' && (
									<Path
										d={currentPath}
										stroke={Colors.primary}
										strokeWidth={3}
										fill='none'
									/>
								)}
							</Svg>
						</View>
					</PanGestureHandler>

					<View style={styles.cookingToolbar}>
						<Pressable
							style={[
								styles.toolbarButton,
								!isEraseMode && styles.toolbarButtonActive,
							]}
							onPress={() => setIsEraseMode(false)}
						>
							<FontAwesomeIcon
								icon={faPencil}
								size={18}
								color={!isEraseMode ? Colors.white : Colors.darkText}
							/>
						</Pressable>
						<Pressable
							style={[
								styles.toolbarButton,
								isEraseMode && styles.toolbarButtonActive,
							]}
							onPress={() => setIsEraseMode(true)}
						>
							<FontAwesomeIcon
								icon={faEraser}
								size={18}
								color={isEraseMode ? Colors.white : Colors.darkText}
							/>
						</Pressable>
						<Pressable
							style={styles.toolbarButton}
							onPress={() => {
								setPaths([]);
								setCurrentPath('');
							}}
						>
							<FontAwesomeIcon
								icon={faArrowRotateLeft}
								size={18}
								color={Colors.darkText}
							/>
						</Pressable>
						<Pressable
							style={[styles.toolbarButton, styles.exitButton]}
							onPress={() => {
								setIsCookingMode(false);
								setPaths([]);
								setCurrentPath('');
								setIsEraseMode(false);
							}}
						>
							<FontAwesomeIcon
								icon={faXmark}
								size={18}
								color={Colors.white}
							/>
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
		backgroundColor: Colors.background,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 0,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.background,
	},
	heroImage: {
		width: '100%',
		height: 300,
		resizeMode: 'cover',
	},
	body: {
		backgroundColor: Colors.white,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		marginTop: -28,
		paddingTop: 28,
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	title: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 28,
		color: Colors.darkText,
		marginBottom: 16,
		lineHeight: 36,
	},
	tagRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 16,
	},
	tagChip: {
		borderRadius: 24,
		paddingHorizontal: 14,
		paddingVertical: 6,
		backgroundColor: Colors.primary,
	},
	tagChipText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 12,
		color: Colors.white,
	},
	metaRow: {
		flexDirection: 'row',
		backgroundColor: Colors.white,
		borderRadius: 16,
		padding: 16,
		marginBottom: 24,
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 2,
	},
	metaBadge: {
		flex: 1,
		alignItems: 'center',
	},
	metaValue: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 16,
		color: Colors.primary,
	},
	metaLabel: {
		fontFamily: 'OpenSans',
		fontSize: 11,
		color: Colors.lightText,
		marginTop: 2,
	},
	metaDivider: {
		width: 1,
		height: 32,
		backgroundColor: Colors.divider,
	},
	sectionTitle: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 18,
		color: Colors.darkText,
		marginBottom: 8,
		marginTop: 8,
		borderLeftWidth: 3,
		borderLeftColor: Colors.primary,
		paddingLeft: 10,
	},
	sectionHint: {
		fontFamily: 'OpenSans',
		fontSize: 12,
		color: Colors.lightText,
		marginBottom: 12,
	},
	ingredientsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 24,
	},
	ingredientChip: {
		backgroundColor: Colors.white,
		borderRadius: 24,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 1,
	},
	ingredientText: {
		fontFamily: 'OpenSans',
		fontSize: 13,
		color: Colors.darkText,
	},
	instructions: {
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.mediumText,
		lineHeight: 24,
		marginBottom: 24,
	},
	nutritionGrid: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 24,
		flexWrap: 'wrap',
	},
	nutritionCard: {
		flex: 1,
		minWidth: 70,
		backgroundColor: Colors.surfaceAlt,
		borderRadius: 14,
		padding: 14,
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	nutritionValue: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 15,
		color: Colors.primary,
	},
	nutritionLabel: {
		fontFamily: 'OpenSans',
		fontSize: 11,
		color: Colors.lightText,
		marginTop: 2,
	},
	actionRow: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	actionButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 15,
		borderRadius: 14,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 3,
	},
	cookingButton: {
		backgroundColor: Colors.success,
	},
	pdfButton: {
		backgroundColor: Colors.info,
	},
	buttonPressed: {
		opacity: 0.75,
	},
	actionButtonText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 14,
		color: Colors.white,
	},
	errorText: {
		fontFamily: 'OpenSans',
		fontSize: 16,
		color: Colors.error,
	},
	cookingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255,255,255,0.08)',
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
	toolbarButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: Colors.white,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
	},
	toolbarButtonActive: {
		backgroundColor: Colors.primary,
	},
	exitButton: {
		backgroundColor: Colors.danger,
		marginTop: 8,
	},
	headerButtons: {
		flexDirection: 'row',
		gap: 20,
		marginRight: 4,
	},
});
