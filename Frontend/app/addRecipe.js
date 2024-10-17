import React, { useState } from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	View,
	Pressable,
	Alert,
	ScrollView,
	Image
} from 'react-native';
import NumericInput from 'react-native-numeric-input-pure-js';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// Define a validation schema for the form
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

export default function addRecipe({ onSubmit }) {
	const [imageUri, setImageUri] = useState(null);

	//Function to pick image for recipe
	const pickImage = async (setFieldValue) => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
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

	const handleSubmit = async (values, { setSubmitting, resetForm }) => {
		try {
			setSubmitting(true);

			// Upload image to Cloudinary
			const formData = new FormData();
			formData.append('file', {
				uri: values.recipePhoto,
				name: `${values.recipeName
					.toLowerCase()
					.replace(/ /g, '-')}.jpg`,
				type: 'image/jpeg',
			});
			formData.append('upload_preset', 'z3xss4hi');

			const cloudinaryResponse = await axios.post(
				'https://api.cloudinary.com/v1_1/dv7bkdy36/image/upload',
				formData
			);

			const imageUrl = cloudinaryResponse.data.secure_url;

			// Submit form data to backend, including the Cloudinary image URL
			const recipeData = {
				recipeName: values.recipeName,
				yield: values.yield,
				prepTimeHour: values.prepTimeHour,
				prepTimeMin: values.prepTimeMin,
				cookTimeHour: values.cookTimeHour,
				cookTimeMin: values.cookTimeMin,
				ingredients: values.ingredients,
				instructions: values.instructions,
				recipePhotoUrl: imageUrl,
			};
			await axios.post('http://localhost:8080/api/recipes', recipeData);

			Alert.alert('Recipe submitted successfully!');
			resetForm();
		} catch (error) {
			Alert.alert('Error submitting recipe. Please try again.');
			console.error(error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<View style={styles.container}>
				<Text style={styles.title}>Add A New Recipe</Text>
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
					}}
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
							{/* Recipe Name */}
							<Text style={styles.inputLabel}>Recipe Name</Text>
							<TextInput
								style={styles.input}
								onChangeText={handleChange('recipeName')}
								value={values.recipeName}
								placeholder='Recipe Name'
								placeholderTextColor='gray'
							/>
							{touched.recipeName && errors.recipeName && (
								<Text style={styles.errorText}>
									{errors.recipeName}
								</Text>
							)}

							{/* Yield */}
							<Text style={styles.inputLabel}>
								Yield (in servings)
							</Text>
							<NumericInput
								value={values.yield}
								onChange={(value) =>
									setFieldValue('yield', value)
								}
								totalWidth={240}
								totalHeight={40}
								iconSize={25}
								step={1}
								valueType='integer'
								minValue={0}
								rounded
								textColor='black'
								iconStyle={{ color: 'white' }}
								type='plus-minus'
								rightButtonBackgroundColor='rgba(2, 169, 157, 1.0)'
								leftButtonBackgroundColor='rgba(2, 169, 157, 1.0)'
							/>
							{touched.yield && errors.yield && (
								<Text style={styles.errorText}>
									{errors.yield}
								</Text>
							)}

							{/* Prep Time */}
							<Text style={styles.inputLabel}>Prep Time</Text>
							<View style={styles.prepTime}>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('prepTimeHour')}
									value={String(values.prepTimeHour)}
									placeholder='Hours'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
								<Text style={styles.displayDecimal}>:</Text>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('prepTimeMin')}
									value={String(values.prepTimeMin)}
									placeholder='Minutes'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
							</View>
							{touched.prepTimeHour && errors.prepTimeHour && (
								<Text style={styles.errorText}>
									{errors.prepTimeHour}
								</Text>
							)}
							{touched.prepTimeMin && errors.prepTimeMin && (
								<Text style={styles.errorText}>
									{errors.prepTimeMin}
								</Text>
							)}

							{/* Cook Time */}
							<Text style={styles.inputLabel}>Cook Time</Text>
							<View style={styles.prepTime}>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('cookTimeHour')}
									value={String(values.cookTimeHour)}
									placeholder='Hours'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
								<Text style={styles.displayDecimal}>:</Text>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('cookTimeMin')}
									value={String(values.cookTimeMin)}
									placeholder='Minutes'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
							</View>
							{touched.cookTimeHour && errors.cookTimeHour && (
								<Text style={styles.errorText}>
									{errors.cookTimeHour}
								</Text>
							)}
							{touched.cookTimeMin && errors.cookTimeMin && (
								<Text style={styles.errorText}>
									{errors.cookTimeMin}
								</Text>
							)}

							{/* Ingredients */}
							<Text style={styles.inputLabel}>Ingredients</Text>
							<FieldArray
								name='ingredients'
								render={(arrayHelpers) => (
									<View>
										{values.ingredients.map(
											(ingredient, index) => (
												<View
													key={index}
													style={
														styles.ingredientContainer
													}
												>
													<Text
														style={
															styles.ingredientLabel
														}
													>
														Ingredient {index + 1}
													</Text>

													{/* Ingredient Name */}
													<TextInput
														style={styles.input}
														onChangeText={handleChange(
															`ingredients[${index}].name`
														)}
														value={ingredient.name}
														placeholder='Ingredient Name'
														placeholderTextColor='gray'
													/>
													{touched.ingredients?.[
														index
													]?.name &&
														errors.ingredients?.[
															index
														]?.name && (
															<Text
																style={
																	styles.errorText
																}
															>
																{
																	errors
																		.ingredients[
																		index
																	].name
																}
															</Text>
														)}

													{/* Amount */}
													<TextInput
														style={styles.input}
														onChangeText={handleChange(
															`ingredients[${index}].amount`
														)}
														value={String(
															ingredient.amount
														)}
														placeholder='Amount'
														keyboardType='numeric'
														placeholderTextColor='gray'
													/>
													{touched.ingredients?.[
														index
													]?.amount &&
														errors.ingredients?.[
															index
														]?.amount && (
															<Text
																style={
																	styles.errorText
																}
															>
																{
																	errors
																		.ingredients[
																		index
																	].amount
																}
															</Text>
														)}

													{/* Unit */}
													<TextInput
														style={styles.input}
														onChangeText={handleChange(
															`ingredients[${index}].unit`
														)}
														value={ingredient.unit}
														placeholder='Unit (e.g. cups, tsp)'
														placeholderTextColor='gray'
													/>
													{touched.ingredients?.[
														index
													]?.unit &&
														errors.ingredients?.[
															index
														]?.unit && (
															<Text
																style={
																	styles.errorText
																}
															>
																{
																	errors
																		.ingredients[
																		index
																	].unit
																}
															</Text>
														)}

													{/* Remove Button */}
													<Pressable
														style={
															styles.removeButton
														}
														onPress={() =>
															arrayHelpers.remove(
																index
															)
														}
													>
														<Text
															style={
																styles.removeButtonText
															}
														>
															Remove Ingredient
														</Text>
													</Pressable>
												</View>
											)
										)}
										<Pressable
											style={styles.addButton}
											onPress={() =>
												arrayHelpers.push({
													name: '',
													amount: '',
													unit: '',
												})
											}
										>
											<Text style={styles.addButtonText}>
												Add Ingredient
											</Text>
										</Pressable>
									</View>
								)}
							/>

							{/* Instructions */}
							<Text style={styles.inputLabel}>Instructions</Text>
							<TextInput
								style={styles.input}
								onChangeText={handleChange('instructions')}
								value={values.instructions}
								placeholder='Instructions'
								placeholderTextColor='gray'
								multiline
							/>
							{touched.instructions && errors.instructions && (
								<Text style={styles.errorText}>
									{errors.instructions}
								</Text>
							)}

							{/* Photo Picker */}
							<Text style={styles.inputLabel}>Recipe Photo</Text>
							<Pressable
								style={styles.photoPicker}
								onPress={() => pickImage(setFieldValue)}
							>
								<Text style={styles.photoPickerText}>
									{values.recipePhoto
										? 'Change Photo'
										: 'Pick a Photo'}
								</Text>
							</Pressable>

							{/* Image Preview */}
							{imageUri && (
								<Image
									source={{ uri: imageUri }}
									style={styles.imagePreview}
								/>
							)}

							{touched.recipePhoto && errors.recipePhoto && (
								<Text style={styles.errorText}>
									{errors.recipePhoto}
								</Text>
							)}

							{/* Submit Button */}
							<Pressable
								style={styles.submitButton}
								onPress={handleSubmit}
								disabled={isSubmitting}
							>
								<Text style={styles.submitButtonText}>
									Submit Recipe
								</Text>
							</Pressable>
						</View>
					)}
				</Formik>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		padding: 16,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
	},
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 20,
		color: '#2B2B2B',
	},
	form: {
		marginTop: 10,
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#2B2B2B',
	},
	input: {
		height: 40,
		borderColor: '#CED4DA',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 12,
		backgroundColor: '#F2F2F2',
		color: '#2B2B2B',
	},
	prepTime: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	inputTime: {
		height: 40,
		width: 80,
		borderColor: '#CED4DA',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 12,
		backgroundColor: '#F2F2F2',
		color: '#2B2B2B',
		textAlign: 'center',
	},
	displayDecimal: {
		fontSize: 24,
		marginHorizontal: 5,
		color: '#2B2B2B',
	},
	ingredientContainer: {
		borderBottomColor: '#CED4DA',
		borderBottomWidth: 1,
		paddingBottom: 10,
		marginBottom: 10,
	},
	ingredientLabel: {
		fontWeight: 'bold',
		marginBottom: 5,
		color: '#2B2B2B',
	},
	removeButton: {
		backgroundColor: '#FF6347',
		borderRadius: 5,
		padding: 8,
		marginTop: 8,
	},
	removeButtonText: {
		color: 'white',
		textAlign: 'center',
	},
	addButton: {
		backgroundColor: '#2DAA6E',
		borderRadius: 5,
		padding: 8,
		marginTop: 12,
	},
	addButtonText: {
		color: 'white',
		textAlign: 'center',
	},
	errorText: {
		color: 'red',
		marginBottom: 10,
	},
	photoPicker: {
		backgroundColor: '#E9ECEF',
		borderRadius: 5,
		padding: 10,
		alignItems: 'center',
		marginBottom: 10,
	},
	photoPickerText: {
		color: '#495057',
	},
	imagePreview: {
		width: 100,
		height: 100,
		borderRadius: 8,
		marginTop: 10,
	},
	submitButton: {
		backgroundColor: '#007BFF',
		borderRadius: 5,
		paddingVertical: 12,
		alignItems: 'center',
		marginTop: 20,
	},
	submitButtonText: {
		color: 'white',
		fontSize: 18,
	},
});
