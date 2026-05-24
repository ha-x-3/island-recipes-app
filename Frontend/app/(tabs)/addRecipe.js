import React, { useState } from 'react';
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
import { Svg, Path, Circle } from 'react-native-svg';
import axios from 'axios';
import { Colors } from '../../constants/colors';
import { TAG_GROUPS } from '../../constants/tags';
import { parseRecipeFromImage } from '../../utils/geminiRecipeParser';

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

function FieldLabel({ children }) {
	return <Text style={styles.fieldLabel}>{children}</Text>;
}

function FormCard({ children }) {
	return <View style={styles.formCard}>{children}</View>;
}

export default function AddRecipe() {
	const [imageUri, setImageUri] = useState(null);
	const [customTagInput, setCustomTagInput] = useState('');
	const [isScanning, setIsScanning] = useState(false);

	const pickImage = async (setFieldValue) => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission Denied', 'Please allow access to photos.');
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: 'images',
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		});
		if (!result.canceled && result.assets?.length > 0) {
			setImageUri(result.assets[0].uri);
			setFieldValue('recipePhoto', result.assets[0].uri);
		}
	};

	const importFromPhoto = (setValues, setFieldValue, currentValues) => {
		Alert.alert('Import Recipe', 'Choose a source', [
			{
				text: 'Camera',
				onPress: () => launchImport(setValues, setFieldValue, currentValues, 'camera'),
			},
			{
				text: 'Photo Library',
				onPress: () => launchImport(setValues, setFieldValue, currentValues, 'library'),
			},
			{ text: 'Cancel', style: 'cancel' },
		]);
	};

	const applyRecipePhoto = async (uri, setFieldValue) => {
		setImageUri(uri);
		setFieldValue('recipePhoto', uri);
	};

	const promptForPhoto = (scannedUri, setFieldValue) => {
		Alert.alert(
			'Recipe Imported!',
			'Fields have been filled in. How would you like to set the recipe photo?',
			[
				{
					text: 'Crop from scan',
					onPress: async () => {
						const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
						if (status !== 'granted') return;
						const result = await ImagePicker.launchImageLibraryAsync({
							mediaTypes: 'images',
							allowsEditing: true,
							aspect: [4, 3],
							quality: 1,
						});
						if (!result.canceled && result.assets?.length > 0) {
							applyRecipePhoto(result.assets[0].uri, setFieldValue);
						}
					},
				},
				{
					text: 'Use full scan',
					onPress: () => applyRecipePhoto(scannedUri, setFieldValue),
				},
				{ text: 'Skip for now', style: 'cancel' },
			]
		);
	};

	const launchImport = async (setValues, setFieldValue, currentValues, source) => {
		const launcher =
			source === 'camera'
				? ImagePicker.launchCameraAsync
				: ImagePicker.launchImageLibraryAsync;

		if (source === 'camera') {
			const { status } = await ImagePicker.requestCameraPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission Denied', 'Please allow camera access.');
				return;
			}
		} else {
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert('Permission Denied', 'Please allow access to photos.');
				return;
			}
		}

		const result = await launcher({
			mediaTypes: 'images',
			allowsEditing: false,
			quality: 0.8,
			base64: true,
		});

		if (result.canceled || !result.assets?.length) return;

		const asset = result.assets[0];
		setIsScanning(true);
		try {
			const parsed = await parseRecipeFromImage(asset.base64, asset.mimeType ?? 'image/jpeg');
			setValues({
				...currentValues,
				recipeName: parsed.recipeName ?? currentValues.recipeName,
				yield: parsed.yield ?? currentValues.yield,
				prepTimeHour: parsed.prepTimeHour ?? currentValues.prepTimeHour,
				prepTimeMin: parsed.prepTimeMin ?? currentValues.prepTimeMin,
				cookTimeHour: parsed.cookTimeHour ?? currentValues.cookTimeHour,
				cookTimeMin: parsed.cookTimeMin ?? currentValues.cookTimeMin,
				ingredients: parsed.ingredients?.length ? parsed.ingredients : currentValues.ingredients,
				instructions: parsed.instructions ?? currentValues.instructions,
			});
			promptForPhoto(asset.uri, setFieldValue);
		} catch (err) {
			console.error('Recipe import error', err);
			const status = err?.response?.status;
			const message =
				status === 429
					? 'Too many requests. Wait a moment and try again.'
					: 'Could not read the recipe. Try a clearer photo.';
			Alert.alert('Import Failed', message);
		} finally {
			setIsScanning(false);
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

	const handleSubmit = async (values, { setSubmitting, resetForm }) => {
		try {
			setSubmitting(true);

			const formData = new FormData();
			formData.append('file', {
				uri: values.recipePhoto,
				name: `${values.recipeName.toLowerCase().replace(/ /g, '-')}.jpg`,
				type: 'image/jpeg',
			});
			formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

			const cloudinaryResponse = await fetch(
				`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
				{ method: 'POST', body: formData }
			);
			const cloudinaryData = await cloudinaryResponse.json();
			if (!cloudinaryData.secure_url) throw new Error('Cloudinary upload failed');

			const imageUrl = cloudinaryData.secure_url;
			const nutritionalData = await fetchNutrition(values.ingredients);

			await axios.post(`${BASE_URL}/api/recipes`, {
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

			Alert.alert('Success', 'Recipe saved!');
			setImageUri(null);
			setCustomTagInput('');
			resetForm();
		} catch (error) {
			console.error('[submit] failed:', error.message);
			Alert.alert('Error', 'Could not submit recipe. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.scrollContent}
			keyboardShouldPersistTaps='handled'
		>
			<Formik
				initialValues={{
					recipeName: '',
					yield: 4,
					prepTimeHour: '',
					prepTimeMin: '',
					cookTimeHour: '',
					cookTimeMin: '',
					ingredients: [{ name: '', amount: '', unit: '' }],
					instructions: '',
					recipePhoto: '',
					tags: [],
				}}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
			>
				{({
					values,
					handleChange,
					handleSubmit,
					setFieldValue,
					setValues,
					isSubmitting,
					errors,
					touched,
				}) => (
					<View style={styles.form}>
						{/* AI import banner */}
						<Pressable
							style={({ pressed }) => [
								styles.importBanner,
								(pressed || isScanning) && { opacity: 0.75 },
							]}
							onPress={() => importFromPhoto(setValues, setFieldValue, values)}
							disabled={isScanning}
						>
							<View style={styles.importIcon}>
								{isScanning ? (
									<ActivityIndicator color={Colors.blue700} size='small' />
								) : (
									<Svg width={22} height={22} viewBox='0 0 24 24' fill='none'
										stroke={Colors.blue700} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
										<Path d='M4 8a2 2 0 0 1 2-2h2.5l1.5-2h4l1.5 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z' />
										<Circle cx='12' cy='13' r='3.5' />
									</Svg>
								)}
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.importTitle}>
									{isScanning ? 'Scanning recipe…' : 'Import from Photo'}
								</Text>
								<Text style={styles.importSub}>
									Point at a printed or on-screen recipe
								</Text>
							</View>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={Colors.blue400} strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='m9 6 6 6-6 6' />
							</Svg>
						</Pressable>

						{/* Name + yield */}
						<FormCard>
							<FieldLabel>Recipe Name</FieldLabel>
							<TextInput
								style={styles.input}
								onChangeText={handleChange('recipeName')}
								value={values.recipeName}
								placeholder='e.g. Jerk Chicken'
								placeholderTextColor={Colors.ink400}
							/>
							{touched.recipeName && errors.recipeName && (
								<Text style={styles.err}>{errors.recipeName}</Text>
							)}

							<FieldLabel>Yield (servings)</FieldLabel>
							<NumericInput
								value={values.yield}
								onChange={(value) => setFieldValue('yield', value)}
								totalWidth={200}
								totalHeight={46}
								iconSize={22}
								step={1}
								valueType='integer'
								minValue={1}
								rounded
								textColor={Colors.ink900}
								iconStyle={{ color: Colors.white }}
								rightButtonBackgroundColor={Colors.blue600}
								leftButtonBackgroundColor={Colors.blue600}
							/>
							{touched.yield && errors.yield && (
								<Text style={styles.err}>{errors.yield}</Text>
							)}
						</FormCard>

						{/* Times */}
						<FormCard>
							<View style={styles.timeRow}>
								<View style={styles.timeGroup}>
									<FieldLabel>Prep Time</FieldLabel>
									<View style={styles.timePair}>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('prepTimeHour')}
											value={String(values.prepTimeHour)}
											placeholder='hr'
											keyboardType='numeric'
											placeholderTextColor={Colors.ink400}
										/>
										<Text style={styles.timeSep}>:</Text>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('prepTimeMin')}
											value={String(values.prepTimeMin)}
											placeholder='min'
											keyboardType='numeric'
											placeholderTextColor={Colors.ink400}
										/>
									</View>
								</View>
								<View style={styles.timeGroup}>
									<FieldLabel>Cook Time</FieldLabel>
									<View style={styles.timePair}>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('cookTimeHour')}
											value={String(values.cookTimeHour)}
											placeholder='hr'
											keyboardType='numeric'
											placeholderTextColor={Colors.ink400}
										/>
										<Text style={styles.timeSep}>:</Text>
										<TextInput
											style={styles.timeInput}
											onChangeText={handleChange('cookTimeMin')}
											value={String(values.cookTimeMin)}
											placeholder='min'
											keyboardType='numeric'
											placeholderTextColor={Colors.ink400}
										/>
									</View>
								</View>
							</View>
						</FormCard>

						{/* Ingredients */}
						<FormCard>
							<View style={styles.sectionHeaderRow}>
								<FieldLabel>Ingredients</FieldLabel>
								<Text style={styles.countBadge}>{values.ingredients.length} added</Text>
							</View>
							<FieldArray
								name='ingredients'
								render={(arrayHelpers) => (
									<View>
										{values.ingredients.map((ingredient, index) => (
											<View key={index} style={styles.ingredientRow}>
												<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
													stroke={Colors.ink400} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
													<Circle cx='9' cy='6' r='1.3' />
													<Circle cx='15' cy='6' r='1.3' />
													<Circle cx='9' cy='12' r='1.3' />
													<Circle cx='15' cy='12' r='1.3' />
													<Circle cx='9' cy='18' r='1.3' />
													<Circle cx='15' cy='18' r='1.3' />
												</Svg>
												<TextInput
													style={[styles.input, styles.amtInput]}
													onChangeText={handleChange(`ingredients[${index}].amount`)}
													value={String(ingredient.amount)}
													placeholder='Qty'
													keyboardType='numeric'
													placeholderTextColor={Colors.ink400}
												/>
												<TextInput
													style={[styles.input, styles.unitInput]}
													onChangeText={handleChange(`ingredients[${index}].unit`)}
													value={ingredient.unit}
													placeholder='Unit'
													placeholderTextColor={Colors.ink400}
												/>
												<TextInput
													style={[styles.input, styles.nameInput]}
													onChangeText={handleChange(`ingredients[${index}].name`)}
													value={ingredient.name}
													placeholder='Ingredient'
													placeholderTextColor={Colors.ink400}
												/>
												{values.ingredients.length > 1 && (
													<Pressable hitSlop={8} onPress={() => arrayHelpers.remove(index)}>
														<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
															stroke={Colors.ink400} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
															<Path d='m6 6 12 12M18 6 6 18' />
														</Svg>
													</Pressable>
												)}
											</View>
										))}
										<Pressable
											style={styles.addIngredientBtn}
											onPress={() => arrayHelpers.push({ name: '', amount: '', unit: '' })}
										>
											<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
												stroke={Colors.ink500} strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
												<Path d='M12 5v14M5 12h14' />
											</Svg>
											<Text style={styles.addIngredientText}>Add another ingredient</Text>
										</Pressable>
									</View>
								)}
							/>
						</FormCard>

						{/* Instructions */}
						<FormCard>
							<FieldLabel>Method</FieldLabel>
							<TextInput
								style={[styles.input, styles.textArea]}
								onChangeText={handleChange('instructions')}
								value={values.instructions}
								placeholder='Describe each step, separated by blank lines…'
								placeholderTextColor={Colors.ink400}
								multiline
								textAlignVertical='top'
							/>
							{touched.instructions && errors.instructions && (
								<Text style={styles.err}>{errors.instructions}</Text>
							)}
						</FormCard>

						{/* Tags */}
						<FormCard>
							<FieldLabel>Tags</FieldLabel>
							{TAG_GROUPS.map((group) => (
								<View key={group.label} style={styles.tagGroup}>
									<Text style={styles.tagGroupLabel}>{group.label}</Text>
									<View style={styles.chipRow}>
										{group.tags.map((tag) => {
											const active = values.tags.includes(tag);
											return (
												<Pressable
													key={tag}
													style={[styles.chip, active && styles.chipActive]}
													onPress={() => {
														const next = active
															? values.tags.filter((t) => t !== tag)
															: [...values.tags, tag];
														setFieldValue('tags', next);
													}}
												>
													<Text style={[styles.chipText, active && styles.chipTextActive]}>
														{tag}
													</Text>
												</Pressable>
											);
										})}
									</View>
								</View>
							))}

							{/* Custom tag input */}
							<View style={styles.customTagRow}>
								<TextInput
									style={[styles.input, styles.customTagInput]}
									value={customTagInput}
									onChangeText={setCustomTagInput}
									placeholder='Custom tag…'
									placeholderTextColor={Colors.ink400}
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
									<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
										stroke='#fff' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
										<Path d='M12 5v14M5 12h14' />
									</Svg>
								</Pressable>
							</View>

							{/* Custom tags */}
							{values.tags
								.filter((t) => !TAG_GROUPS.flatMap((g) => g.tags).includes(t))
								.length > 0 && (
								<View style={styles.chipRow}>
									{values.tags
										.filter((t) => !TAG_GROUPS.flatMap((g) => g.tags).includes(t))
										.map((tag) => (
											<Pressable
												key={tag}
												style={[styles.chip, styles.chipActive]}
												onPress={() =>
													setFieldValue('tags', values.tags.filter((t2) => t2 !== tag))
												}
											>
												<Text style={styles.chipTextActive}>{tag} ×</Text>
											</Pressable>
										))}
								</View>
							)}
						</FormCard>

						{/* Photo */}
						<FormCard>
							<FieldLabel>Cover photo</FieldLabel>
							<Pressable style={styles.photoPicker} onPress={() => pickImage(setFieldValue)}>
								<Svg width={24} height={24} viewBox='0 0 24 24' fill='none'
									stroke={Colors.blue700} strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
									<Path d='M4 8a2 2 0 0 1 2-2h2.5l1.5-2h4l1.5 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z' />
									<Circle cx='12' cy='13' r='3.5' />
								</Svg>
								<Text style={styles.photoPickerText}>
									{values.recipePhoto ? 'Change photo' : 'Drop a photo or tap to choose'}
								</Text>
							</Pressable>
							{imageUri && (
								<Image source={{ uri: imageUri }} style={styles.photoPreview} />
							)}
							{touched.recipePhoto && errors.recipePhoto && (
								<Text style={styles.err}>{errors.recipePhoto}</Text>
							)}
						</FormCard>

						{/* Submit */}
						<Pressable
							style={({ pressed }) => [
								styles.submitBtn,
								(pressed || isSubmitting) && { opacity: 0.75 },
							]}
							onPress={handleSubmit}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<ActivityIndicator color={Colors.white} size='small' />
							) : (
								<Text style={styles.submitBtnText}>Save recipe</Text>
							)}
						</Pressable>
					</View>
				)}
			</Formik>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
		backgroundColor: Colors.bg,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 48,
	},
	form: {
		gap: 12,
	},

	// Import banner
	importBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		backgroundColor: Colors.blue100,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: Colors.blue100,
		padding: 16,
	},
	importIcon: {
		width: 46,
		height: 46,
		borderRadius: 14,
		backgroundColor: Colors.paper,
		alignItems: 'center',
		justifyContent: 'center',
	},
	importTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 15,
		color: Colors.ink900,
		marginBottom: 2,
	},
	importSub: {
		fontFamily: 'Nunito-Medium',
		fontSize: 13,
		color: Colors.ink700,
	},

	// Form card
	formCard: {
		backgroundColor: Colors.paper,
		borderRadius: 22,
		padding: 18,
		paddingTop: 14,
		borderWidth: 1,
		borderColor: Colors.ink200,
		gap: 4,
	},

	// Field label
	fieldLabel: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 11.5,
		color: Colors.ink500,
		textTransform: 'uppercase',
		letterSpacing: 0.7,
		marginBottom: 6,
		marginTop: 10,
	},

	// Inputs
	input: {
		height: 46,
		borderWidth: 1,
		borderColor: Colors.ink200,
		borderRadius: 14,
		paddingHorizontal: 14,
		backgroundColor: Colors.bg,
		fontFamily: 'Nunito-Medium',
		fontSize: 15,
		color: Colors.ink900,
	},
	textArea: {
		height: 140,
		paddingTop: 12,
	},

	// Times
	timeRow: {
		flexDirection: 'row',
		gap: 20,
		marginTop: 4,
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
		borderWidth: 1,
		borderColor: Colors.ink200,
		borderRadius: 14,
		paddingHorizontal: 10,
		backgroundColor: Colors.bg,
		fontFamily: 'Nunito-Medium',
		fontSize: 15,
		color: Colors.ink900,
		textAlign: 'center',
	},
	timeSep: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 20,
		color: Colors.ink700,
	},

	// Ingredient rows
	sectionHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	countBadge: {
		fontFamily: 'Nunito-Bold',
		fontSize: 12,
		color: Colors.ink500,
	},
	ingredientRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: Colors.bg,
		borderWidth: 1,
		borderColor: Colors.ink200,
		borderRadius: 14,
		padding: 8,
		marginBottom: 8,
	},
	amtInput: {
		flex: 1,
		height: 36,
		borderRadius: 10,
		paddingHorizontal: 8,
		marginBottom: 0,
		fontSize: 14,
		minWidth: 44,
	},
	unitInput: {
		flex: 1.2,
		height: 36,
		borderRadius: 10,
		paddingHorizontal: 8,
		marginBottom: 0,
		fontSize: 14,
	},
	nameInput: {
		flex: 2.5,
		height: 36,
		borderRadius: 10,
		paddingHorizontal: 8,
		marginBottom: 0,
		fontSize: 14,
	},
	addIngredientBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		padding: 13,
		borderRadius: 14,
		borderWidth: 1.5,
		borderColor: Colors.ink300,
		borderStyle: 'dashed',
	},
	addIngredientText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13.5,
		color: Colors.ink500,
	},

	// Tags
	tagGroup: {
		marginBottom: 10,
	},
	tagGroupLabel: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 11,
		color: Colors.ink500,
		textTransform: 'uppercase',
		letterSpacing: 0.7,
		marginBottom: 8,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 7,
	},
	chip: {
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 8,
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
		fontSize: 13,
		color: Colors.ink700,
	},
	chipTextActive: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13,
		color: Colors.white,
	},
	customTagRow: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		marginTop: 6,
		marginBottom: 6,
	},
	customTagInput: {
		flex: 1,
		marginBottom: 0,
		height: 44,
	},
	customTagAddBtn: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: Colors.blue600,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Photo
	photoPicker: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		borderRadius: 18,
		paddingVertical: 30,
		backgroundColor: Colors.blue50,
		borderWidth: 1.5,
		borderColor: Colors.blue300,
		borderStyle: 'dashed',
	},
	photoPickerText: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 14.5,
		color: Colors.blue800,
	},
	photoPreview: {
		width: '100%',
		height: 200,
		borderRadius: 14,
		marginTop: 10,
		resizeMode: 'cover',
	},

	// Submit
	submitBtn: {
		backgroundColor: Colors.blue600,
		borderRadius: 999,
		paddingVertical: 16,
		alignItems: 'center',
		marginTop: 8,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	submitBtnText: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 16,
		color: Colors.white,
		letterSpacing: -0.2,
	},

	err: {
		fontFamily: 'Nunito-Regular',
		fontSize: 12,
		color: Colors.error,
		marginBottom: 4,
	},
});
