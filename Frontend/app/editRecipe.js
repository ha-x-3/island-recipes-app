import React, { useState, useEffect } from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	View,
	Pressable,
	Alert,
	ScrollView,
	Image,
	ActivityIndicator,
} from 'react-native';
import NumericInput from 'react-native-numeric-input-pure-js';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faImage } from '@fortawesome/free-solid-svg-icons/faImage';
import { Colors } from '../constants/colors';
import { TAG_GROUPS } from '../constants/tags';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const CLOUDINARY_CLOUD_NAME =
	process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dv7bkdy36';
const CLOUDINARY_UPLOAD_PRESET =
	process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'z3xss4hi';
const EDAMAM_APP_ID = process.env.EXPO_PUBLIC_EDAMAM_APP_ID ?? '';
const EDAMAM_APP_KEY = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY ?? '';

const validationSchema = Yup.object().shape({
	recipeName: Yup.string().required('Recipe name is required'),
	yield: Yup.number().required('Yield is required').positive().integer(),
	prepTimeHour: Yup.number().required('Prep time is required').integer(),
	prepTimeMin: Yup.number().required('Prep time is required').integer(),
	cookTimeHour: Yup.number().required('Cook time is required').integer(),
	cookTimeMin: Yup.number().required('Cook time is required').integer(),
	ingredients: Yup.array()
		.of(
			Yup.object().shape({
				name: Yup.string().required('Ingredient name is required'),
				amount: Yup.number().required('Amount is required').positive(),
				unit: Yup.string().required('Unit is required'),
			})
		)
		.min(1, 'At least one ingredient is required'),
	instructions: Yup.string().required('Instructions are required'),
	recipePhoto: Yup.string().required('Recipe photo is required'),
});

export default function EditRecipe() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [recipe, setRecipe] = useState(null);
	const [loading, setLoading] = useState(true);
	const [imageUri, setImageUri] = useState(null);
	const [customTagInput, setCustomTagInput] = useState('');

	useEffect(() => {
		const fetchRecipe = async () => {
			try {
				const response = await axios.get(`${BASE_URL}/api/recipes/${id}`);
				setRecipe(response.data);
			} catch (error) {
				console.error('Error fetching recipe for edit:', error);
				Alert.alert('Error', 'Could not load recipe.');
				router.back();
			} finally {
				setLoading(false);
			}
		};
		if (id) fetchRecipe();
	}, [id]);

	const pickImage = async (setFieldValue) => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission Denied', 'Please allow access to photos.');
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		});
		if (!result.canceled && result.assets?.length > 0) {
			setImageUri(result.assets[0].uri);
			setFieldValue('recipePhoto', result.assets[0].uri);
		}
	};

	const fetchNutrition = async (ingredients) => {
		const formatted = ingredients.map((i) => `${i.amount} ${i.unit} ${i.name}`);
		try {
			const response = await axios.post(
				`https://api.edamam.com/api/nutrition-details?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}`,
				{ ingr: formatted }
			);
			return {
				calories: response.data.calories,
				totalNutrients: {
					FAT: response.data.totalNutrients.FAT,
					PROCNT: response.data.totalNutrients.PROCNT,
					CHOLE: response.data.totalNutrients.CHOLE,
					NA: response.data.totalNutrients.NA,
				},
			};
		} catch (error) {
			console.error('Error fetching nutrition data', error);
			return null;
		}
	};

	const handleSubmit = async (values, { setSubmitting }) => {
		try {
			setSubmitting(true);

			let imageUrl = recipe.recipePhotoUrl;
			if (imageUri) {
				const formData = new FormData();
				formData.append('file', {
					uri: imageUri,
					name: `${values.recipeName.toLowerCase().replace(/ /g, '-')}.jpg`,
					type: 'image/jpeg',
				});
				formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
				const cloudinaryResponse = await axios.post(
					`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
					formData
				);
				imageUrl = cloudinaryResponse.data.secure_url;
			}

			const nutritionalData = await fetchNutrition(values.ingredients);

			await axios.put(`${BASE_URL}/api/recipes/${id}`, {
				recipeName: values.recipeName,
				yield: values.yield,
				prepTimeHour: values.prepTimeHour,
				prepTimeMin: values.prepTimeMin,
				cookTimeHour: values.cookTimeHour,
				cookTimeMin: values.cookTimeMin,
				ingredients: values.ingredients,
				instructions: values.instructions,
				recipePhotoUrl: imageUrl,
				nutritionalData,
				tags: values.tags,
			});

			Alert.alert('Saved', 'Recipe updated successfully!', [
				{ text: 'OK', onPress: () => router.back() },
			]);
		} catch (error) {
			Alert.alert('Error', 'Could not update recipe. Please try again.');
			console.error(error);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size='large' color={Colors.primary} />
			</View>
		);
	}

	const initialValues = {
		recipeName: recipe.recipeName,
		yield: recipe.yield,
		prepTimeHour: recipe.prepTimeHour,
		prepTimeMin: recipe.prepTimeMin,
		cookTimeHour: recipe.cookTimeHour,
		cookTimeMin: recipe.cookTimeMin,
		ingredients: recipe.ingredients.map((i) => ({
			name: i.name,
			amount: String(i.amount),
			unit: i.unit,
		})),
		instructions: recipe.instructions,
		recipePhoto: recipe.recipePhotoUrl,
		tags: recipe.tags ?? [],
	};

	return (
		<ScrollView
			style={styles.scrollView}
			contentContainerStyle={styles.scrollContent}
			keyboardShouldPersistTaps='handled'
		>
			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
			>
				{({
					values,
					handleChange,
					handleSubmit,
					setFieldValue,
					isSubmitting,
					errors,
					touched,
				}) => (
					<View style={styles.form}>
						<View style={styles.sectionCard}>
							<Text style={styles.sectionLabel}>Recipe Name</Text>
							<TextInput
								style={styles.input}
								onChangeText={handleChange('recipeName')}
								value={values.recipeName}
								placeholder='e.g. Jerk Chicken'
								placeholderTextColor={Colors.mutedText}
							/>
							{touched.recipeName && errors.recipeName && (
								<Text style={styles.errorText}>{errors.recipeName}</Text>
							)}

							<Text style={styles.sectionLabel}>Yield (servings)</Text>
							<NumericInput
								value={values.yield}
								onChange={(value) => setFieldValue('yield', value)}
								totalWidth={200}
								totalHeight={44}
								iconSize={22}
								step={1}
								valueType='integer'
								minValue={1}
								rounded
								textColor={Colors.darkText}
								iconStyle={{ color: Colors.white }}
								rightButtonBackgroundColor={Colors.primary}
								leftButtonBackgroundColor={Colors.primary}
							/>
							{touched.yield && errors.yield && (
								<Text style={styles.errorText}>{errors.yield}</Text>
							)}
						</View>

						<View style={styles.sectionCard}>
							<View style={styles.timeRow}>
								<View style={styles.timeGroup}>
									<Text style={styles.sectionLabel}>Prep Time</Text>
									<View style={styles.timePair}>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('prepTimeHour')}
											value={String(values.prepTimeHour)}
											placeholder='hr'
											keyboardType='numeric'
											placeholderTextColor={Colors.mutedText}
										/>
										<Text style={styles.timeSep}>:</Text>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('prepTimeMin')}
											value={String(values.prepTimeMin)}
											placeholder='min'
											keyboardType='numeric'
											placeholderTextColor={Colors.mutedText}
										/>
									</View>
								</View>
								<View style={styles.timeGroup}>
									<Text style={styles.sectionLabel}>Cook Time</Text>
									<View style={styles.timePair}>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('cookTimeHour')}
											value={String(values.cookTimeHour)}
											placeholder='hr'
											keyboardType='numeric'
											placeholderTextColor={Colors.mutedText}
										/>
										<Text style={styles.timeSep}>:</Text>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('cookTimeMin')}
											value={String(values.cookTimeMin)}
											placeholder='min'
											keyboardType='numeric'
											placeholderTextColor={Colors.mutedText}
										/>
									</View>
								</View>
							</View>
						</View>

						<View style={styles.sectionCard}>
							<Text style={styles.sectionLabel}>Ingredients</Text>
							<FieldArray
								name='ingredients'
								render={(arrayHelpers) => (
									<View>
										{values.ingredients.map((ingredient, index) => (
											<View key={index} style={styles.ingredientCard}>
												<View style={styles.ingredientHeader}>
													<Text style={styles.ingredientLabel}>
														Ingredient {index + 1}
													</Text>
													{values.ingredients.length > 1 && (
														<Pressable
															onPress={() => arrayHelpers.remove(index)}
															hitSlop={8}
														>
															<FontAwesomeIcon
																icon={faTrash}
																size={16}
																color={Colors.danger}
															/>
														</Pressable>
													)}
												</View>

												<TextInput
													style={styles.input}
													onChangeText={handleChange(`ingredients[${index}].name`)}
													value={ingredient.name}
													placeholder='Ingredient name'
													placeholderTextColor={Colors.mutedText}
												/>
												{touched.ingredients?.[index]?.name &&
													errors.ingredients?.[index]?.name && (
														<Text style={styles.errorText}>
															{errors.ingredients[index].name}
														</Text>
													)}

												<View style={styles.amountRow}>
													<TextInput
														style={[styles.input, styles.amountInput]}
														onChangeText={handleChange(
															`ingredients[${index}].amount`
														)}
														value={String(ingredient.amount)}
														placeholder='Amount'
														keyboardType='numeric'
														placeholderTextColor={Colors.mutedText}
													/>
													<TextInput
														style={[styles.input, styles.unitInput]}
														onChangeText={handleChange(
															`ingredients[${index}].unit`
														)}
														value={ingredient.unit}
														placeholder='Unit (cups, tsp…)'
														placeholderTextColor={Colors.mutedText}
													/>
												</View>
											</View>
										))}
										<Pressable
											style={styles.addIngredientButton}
											onPress={() =>
												arrayHelpers.push({ name: '', amount: '', unit: '' })
											}
										>
											<FontAwesomeIcon
												icon={faPlus}
												size={14}
												color={Colors.primary}
											/>
											<Text style={styles.addIngredientText}>Add Ingredient</Text>
										</Pressable>
									</View>
								)}
							/>
						</View>

						<View style={styles.sectionCard}>
							<Text style={styles.sectionLabel}>Instructions</Text>
							<TextInput
								style={[styles.input, styles.textArea]}
								onChangeText={handleChange('instructions')}
								value={values.instructions}
								placeholder='Describe each step…'
								placeholderTextColor={Colors.mutedText}
								multiline
								textAlignVertical='top'
							/>
							{touched.instructions && errors.instructions && (
								<Text style={styles.errorText}>{errors.instructions}</Text>
							)}
						</View>

						<View style={styles.sectionCard}>
							<Text style={styles.sectionLabel}>Tags (optional)</Text>
							{TAG_GROUPS.map((group) => (
								<View key={group.label} style={styles.tagGroup}>
									<Text style={styles.tagGroupLabel}>{group.label}</Text>
									<View style={styles.tagChipRow}>
										{group.tags.map((tag) => {
											const active = values.tags.includes(tag);
											return (
												<Pressable
													key={tag}
													style={[styles.tagChip, active && styles.tagChipActive]}
													onPress={() => {
														const next = active
															? values.tags.filter((t) => t !== tag)
															: [...values.tags, tag];
														setFieldValue('tags', next);
													}}
												>
													<Text
														style={[
															styles.tagChipText,
															active && styles.tagChipTextActive,
														]}
													>
														{tag}
													</Text>
												</Pressable>
											);
										})}
									</View>
								</View>
							))}
							<View style={styles.customTagRow}>
								<TextInput
									style={[styles.input, styles.customTagInput]}
									value={customTagInput}
									onChangeText={setCustomTagInput}
									placeholder='Custom tag…'
									placeholderTextColor={Colors.mutedText}
									onSubmitEditing={() => {
										const trimmed = customTagInput.trim();
										if (trimmed && !values.tags.includes(trimmed)) {
											setFieldValue('tags', [...values.tags, trimmed]);
										}
										setCustomTagInput('');
									}}
									returnKeyType='done'
								/>
								<Pressable
									style={styles.customTagAddBtn}
									onPress={() => {
										const trimmed = customTagInput.trim();
										if (trimmed && !values.tags.includes(trimmed)) {
											setFieldValue('tags', [...values.tags, trimmed]);
										}
										setCustomTagInput('');
									}}
								>
									<FontAwesomeIcon icon={faPlus} size={14} color={Colors.white} />
								</Pressable>
							</View>
							{values.tags.filter(
								(t) => !TAG_GROUPS.flatMap((g) => g.tags).includes(t)
							).length > 0 && (
								<View style={styles.tagChipRow}>
									{values.tags
										.filter((t) => !TAG_GROUPS.flatMap((g) => g.tags).includes(t))
										.map((tag) => (
											<Pressable
												key={tag}
												style={[styles.tagChip, styles.tagChipActive]}
												onPress={() =>
													setFieldValue(
														'tags',
														values.tags.filter((t2) => t2 !== tag)
													)
												}
											>
												<Text style={styles.tagChipTextActive}>{tag} ×</Text>
											</Pressable>
										))}
								</View>
							)}
						</View>

						<View style={styles.sectionCard}>
							<Text style={styles.sectionLabel}>Recipe Photo</Text>
							<Pressable
								style={styles.photoPicker}
								onPress={() => pickImage(setFieldValue)}
							>
								<FontAwesomeIcon icon={faImage} size={20} color={Colors.primary} />
								<Text style={styles.photoPickerText}>Change Photo</Text>
							</Pressable>
							<Image
								source={{ uri: imageUri ?? recipe.recipePhotoUrl }}
								style={styles.imagePreview}
							/>
						</View>

						<Pressable
							style={({ pressed }) => [
								styles.submitButton,
								(pressed || isSubmitting) && styles.submitButtonPressed,
							]}
							onPress={handleSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator color={Colors.white} size='small' />
							) : (
								<Text style={styles.submitButtonText}>Save Changes</Text>
							)}
						</Pressable>
					</View>
				)}
			</Formik>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.background,
	},
	scrollView: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 48,
	},
	form: {
		gap: 0,
	},
	sectionCard: {
		backgroundColor: Colors.white,
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingBottom: 16,
		marginBottom: 12,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 8,
		elevation: 2,
	},
	sectionLabel: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 12,
		color: Colors.lightText,
		marginTop: 16,
		marginBottom: 6,
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	input: {
		height: 46,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 14,
		backgroundColor: Colors.white,
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.darkText,
		marginBottom: 4,
	},
	textArea: {
		height: 120,
		paddingTop: 12,
		marginBottom: 4,
	},
	timeRow: {
		flexDirection: 'row',
		gap: 24,
		marginTop: 16,
	},
	timeGroup: {
		flex: 1,
	},
	timePair: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	timeInput: {
		flex: 1,
		height: 46,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 10,
		backgroundColor: Colors.white,
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.darkText,
		textAlign: 'center',
	},
	timeSep: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 20,
		color: Colors.darkText,
	},
	ingredientCard: {
		backgroundColor: Colors.white,
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 1,
	},
	ingredientHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	ingredientLabel: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 13,
		color: Colors.mediumText,
	},
	amountRow: {
		flexDirection: 'row',
		gap: 8,
	},
	amountInput: {
		flex: 1,
		marginBottom: 0,
	},
	unitInput: {
		flex: 2,
		marginBottom: 0,
	},
	addIngredientButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 12,
		paddingHorizontal: 4,
	},
	addIngredientText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 14,
		color: Colors.primary,
	},
	photoPicker: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: Colors.surfaceAlt,
		borderRadius: 12,
		borderColor: Colors.primary,
		borderWidth: 1.5,
		padding: 14,
	},
	photoPickerText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 15,
		color: Colors.primary,
	},
	imagePreview: {
		width: '100%',
		height: 180,
		borderRadius: 10,
		marginTop: 10,
		resizeMode: 'cover',
	},
	errorText: {
		fontFamily: 'OpenSans',
		fontSize: 12,
		color: Colors.error,
		marginBottom: 4,
	},
	submitButton: {
		backgroundColor: Colors.primary,
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 28,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.20,
		shadowRadius: 8,
		elevation: 4,
	},
	submitButtonPressed: {
		opacity: 0.75,
	},
	submitButtonText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 16,
		color: Colors.white,
	},
	tagGroup: {
		marginBottom: 8,
	},
	tagGroupLabel: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 12,
		color: Colors.lightText,
		marginBottom: 6,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	tagChipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 4,
	},
	tagChip: {
		borderRadius: 24,
		paddingHorizontal: 14,
		paddingVertical: 7,
		backgroundColor: Colors.white,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
	},
	tagChipActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	tagChipText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 12,
		color: Colors.darkText,
	},
	tagChipTextActive: {
		color: Colors.white,
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 12,
	},
	customTagRow: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		marginTop: 4,
		marginBottom: 4,
	},
	customTagInput: {
		flex: 1,
		marginBottom: 0,
	},
	customTagAddBtn: {
		width: 46,
		height: 46,
		borderRadius: 10,
		backgroundColor: Colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
