import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	Image,
	StyleSheet,
	FlatList,
	Button,
	Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { Svg, Path } from 'react-native-svg';
import {
	GestureHandlerRootView,
	PanGestureHandler,
} from 'react-native-gesture-handler';

export default function RecipeDetail() {
	const { id } = useLocalSearchParams();
	const [recipe, setRecipe] = useState(null);
	const [isCookingMode, setIsCookingMode] = useState(false);
	const [paths, setPaths] = useState([]); // Store drawn paths
	const [currentPath, setCurrentPath] = useState(''); // Current drawing path
	const [isEraseMode, setIsEraseMode] = useState(false); // Erase mode toggle
	const screenWidth = Dimensions.get('window').width;
	const screenHeight = Dimensions.get('window').height;

	// Fetch recipe details
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

	// Handle user drawing or erasing
	const handleGesture = (event) => {
		const { x, y } = event.nativeEvent;
		if (isEraseMode) {
			// In erase mode: remove paths close to the touch point
			setPaths((prevPaths) =>
				prevPaths.filter((path) => {
					const points = path.split('L').slice(1); // Get points of the path
					return !points.some((point) => {
						const [px, py] = point.trim().split(',');
						return (
							calculateDistance(
								x,
								y,
								parseFloat(px),
								parseFloat(py)
							) < 20
						);
					});
				})
			);
		} else {
			// In draw mode: continue drawing a path
			setCurrentPath((prev) => {
				if (prev === '') {
					return `M ${x},${y}`; // Start the path with a moveTo command
				}
				return `${prev} L ${x},${y}`; // Add lineTo commands
			});
		}
	};

	// End of gesture handling (save the drawn path)
	const handleGestureEnd = () => {
		if (!isEraseMode && currentPath) {
			// Only save valid paths
			setPaths((prevPaths) => [...prevPaths, currentPath]);
			setCurrentPath(''); // Reset for new stroke
		}
	};

	// Helper function to calculate distance for erasing
	const calculateDistance = (x1, y1, x2, y2) => {
		return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
	};

	if (!recipe) {
		return <Text>Loading...</Text>;
	}

	const renderIngredient = ({ item }) => (
		<View style={styles.ingredientContainer}>
			<Text style={styles.details}>
				{item.amount} {item.unit} - {item.name}
			</Text>
		</View>
	);

    //Helper function to round nutritional info decimals
    const roundToTwoDecimalPlaces = (number) => {
		return Number.isNaN(number) ? 'N/A' : Number(number).toFixed(2);
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
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
					numColumns={2}
					columnWrapperStyle={styles.columnWrapper}
				/>
				<Text style={styles.subTitle}>Instructions:</Text>
				<Text style={styles.instructions}>{recipe.instructions}</Text>

				{/* Nutritional Facts */}
				<Text style={styles.subTitle}>Nutritional Information:</Text>
				{recipe.nutritionalData && (
					<>
						<Text style={styles.details}>
							Calories: {recipe.nutritionalData.calories || 'N/A'}
						</Text>
						{recipe.nutritionalData.totalNutrients && (
							<>
								<Text style={styles.details}>
									Fat:{' '}
									{roundToTwoDecimalPlaces(recipe.nutritionalData.totalNutrients.FAT
										?.quantity) || '0'}{' '}
									{recipe.nutritionalData.totalNutrients.FAT
										?.unit || ''}
								</Text>
								<Text style={styles.details}>
									Protein:{' '}
									{roundToTwoDecimalPlaces(recipe.nutritionalData.totalNutrients
										.PROCNT?.quantity) || '0'}{' '}
									{recipe.nutritionalData.totalNutrients
										.PROCNT?.unit || ''}
								</Text>
								<Text style={styles.details}>
									Cholesterol:{' '}
									{roundToTwoDecimalPlaces(recipe.nutritionalData.totalNutrients
										.CHOLE?.quantity) || '0'}{' '}
									{recipe.nutritionalData.totalNutrients
										.CHOLE?.unit || ''}
								</Text>
								<Text style={styles.details}>
									Sodium:{' '}
									{roundToTwoDecimalPlaces(recipe.nutritionalData.totalNutrients
										.NA?.quantity) || '0'}{' '}
									{recipe.nutritionalData.totalNutrients
										.NA?.unit || ''}
								</Text>
							</>
						)}
					</>
				)}

				{/* Cooking Mode Toggle Button */}
				{!isCookingMode && (
					<Button
						title='Enter Cooking Mode'
						onPress={() => setIsCookingMode(true)}
					/>
				)}

				{/* Canvas for Cooking Mode */}
				{isCookingMode && (
					<>
						{/* Canvas Overlay */}
						<View style={styles.overlay}>
							<PanGestureHandler
								onGestureEvent={handleGesture}
								onEnded={handleGestureEnd}
							>
								<View style={styles.canvasContainer}>
									<Svg
										height={screenHeight}
										width={screenWidth}
										style={styles.canvas}
									>
										{/* Render the drawn paths */}
										{paths.map((path, index) => (
											<Path
												key={index}
												d={path}
												stroke='black'
												strokeWidth={3}
												fill='none'
											/>
										))}
										{/* Render the current drawing if valid */}
										{currentPath && (
											<Path
												d={currentPath}
												stroke='black'
												strokeWidth={3}
												fill='none'
											/>
										)}
									</Svg>
								</View>
							</PanGestureHandler>

							{/* Erase and Reset buttons */}
							<View style={styles.buttonContainer}>
								<Button
									title={
										isEraseMode
											? 'Drawing Mode'
											: 'Erase Mode'
									}
									onPress={() => setIsEraseMode(!isEraseMode)}
								/>
								<Button
									title='Reset'
									onPress={() => setPaths([])}
								/>
							</View>
						</View>

						{/* Exit Cooking Mode Button (Placed outside overlay) */}
						<View style={styles.exitButtonContainer}>
							<Button
								title='Exit Cooking Mode'
								onPress={() => setIsCookingMode(false)} // Hide the canvas when exiting
							/>
						</View>
					</>
				)}
			</View>
		</GestureHandlerRootView>
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
	instructions: {
		fontSize: 16,
		marginTop: 8,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent background
		zIndex: 10, // On top of everything
	},
	canvasContainer: {
		flex: 1,
	},
	canvas: {
		flex: 1,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginVertical: 10,
	},
	exitButtonContainer: {
		position: 'absolute',
		bottom: 20, // Position the button at the bottom of the screen
		left: '50%',
		transform: [{ translateX: -50 }],
		zIndex: 20, // Make sure it's above the overlay
	},
	ingredientContainer: {
		flex: 1,
		paddingTop: 10,
	},
	columnWrapper: {
		justifyContent: 'space-between',
	},
});
