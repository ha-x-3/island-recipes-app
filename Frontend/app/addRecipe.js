import React from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	View,
	Pressable,
	Button,
	Alert,
	ScrollView,
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
	prepTimeHour: Yup.number()
		.required('Prep time is required')
		.moreThan(0)
		.integer(),
	prepTimeMin: Yup.number()
		.required('Prep time is required')
		.moreThan(0)
		.integer(),
	cookTimeHour: Yup.number()
		.required('Cook time is required')
		.moreThan(0)
		.integer(),
	cookTimeMin: Yup.number()
		.required('Cook time is required')
		.moreThan(0)
		.integer(),
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

			// Success feedback and reset form
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
						yield: 0,
						prepTimeHour: 0,
						prepTimeMin: 0,
						cookTimeHour: 0,
						cookTimeMin: 0,
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
								inputMode='text'
								placeholderTextColor='gray'
							/>
							{touched.recipeName && errors.recipeName && (
								<Text>{errors.recipeName}</Text>
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
								<Text>{errors.yield}</Text>
							)}

							{/* Prep Time */}
							<Text style={styles.inputLabel}>Prep Time</Text>
							<View style={styles.prepTime}>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('prepTimeHour')}
									value={values.prepTimeHour}
									placeholder='00'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
								{touched.prepTimeHour &&
									errors.prepTimeHour && (
										<Text>{errors.prepTimeHour}</Text>
									)}
								<Text style={styles.displayDecimal}>:</Text>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('prepTimeMin')}
									value={values.prepTimeMin}
									placeholder='00'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
								{touched.prepTimeMin && errors.prepTimeMin && (
									<Text>{errors.prepTimeMin}</Text>
								)}
							</View>

							{/* Cook Time */}
							<Text style={styles.inputLabel}>Cook Time</Text>
							<View style={styles.prepTime}>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('cookTimeHour')}
									value={values.cookTimeHour}
									placeholder='00'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
								{touched.cookTimeHour &&
									errors.cookTimeHour && (
										<Text>{errors.cookTimeHour}</Text>
									)}
								<Text style={styles.displayDecimal}>:</Text>
								<TextInput
									style={styles.inputTime}
									onChangeText={handleChange('cookTimeMin')}
									value={values.cookTimeMin}
									placeholder='00'
									keyboardType='numeric'
									placeholderTextColor='gray'
								/>
								{touched.cookTimeMin && errors.cookTimeMin && (
									<Text>{errors.cookTimeMin}</Text>
								)}
							</View>

							{/* Ingredients */}
							<Text style={styles.inputLabel}>Ingredients</Text>
							<FieldArray
								name='ingredients'
								render={(arrayHelpers) => (
									<View>
										{values.ingredients.map(
											(ingredient, index) => (
												<View key={index}>
													<Text>
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
															<Text>
																errors.ingredients[index].name
															</Text>
														)}

													{/* Ingredient Amount */}
													<TextInput
														style={styles.input}
														onChangeText={handleChange(
															`ingredients[${index}].amount`
														)}
														value={
															ingredient.amount
														}
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
															<Text>
																errors.ingredients[index].amount
															</Text>
														)}

													{/* Ingredient Unit */}
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
															<Text>
																errors.ingredients[index].unit
															</Text>
														)}

													{/* Remove Ingredient Button */}
													<Pressable
														style={styles.button}
														onPress={() =>
															arrayHelpers.remove(
																index
															)
														}
													>
														<Text>
															Remove Ingredient
														</Text>
													</Pressable>
												</View>
											)
										)}

										{/* Add Ingredient Button */}
										<Pressable
											style={styles.button}
											onPress={() =>
												arrayHelpers.push({
													name: '',
													amount: '',
													unit: '',
												})
											}
										>
											<Text>Add Ingredient</Text>
										</Pressable>
									</View>
								)}
							/>

							{/* Instructions */}
							<Text style={styles.inputLabel}>Instructions</Text>
							<TextInput
								style={styles.inputMulti}
								onChangeText={handleChange('instructions')}
								value={values.instructions}
								placeholder='Instructions'
								multiline
								placeholderTextColor='gray'
							/>
							{touched.instructions && errors.instructions && (
								<Text>{errors.instructions}</Text>
							)}

							{/* Recipe Photo */}
							<Button
								title='Pick a recipe photo'
								onPress={() => pickImage(setFieldValue)}
							/>
							{values.recipePhoto ? (
								<Text key='selected'>Photo selected</Text>
							) : (
								<Text key='not-selected'>
									No photo selected
								</Text>
							)}
							{touched.recipePhoto && errors.recipePhoto && (
								<Text>{errors.recipePhoto}</Text>
							)}

							{/* Submit Button */}
							<Button
								title='Submit'
								onPress={handleSubmit}
								disabled={isSubmitting}
							/>
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
		justifyContent: 'center',
		paddingBottom: 20,
	},
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		padding: 20,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginVertical: 20,
		alignSelf: 'center',
	},
	form: {
		width: '80%',
	},
	inputLabel: {
		fontSize: 16,
		marginVertical: 10,
	},
	input: {
		backgroundColor: 'white',
		color: 'black',
		borderColor: 'gray',
		borderWidth: 1,
		padding: 10,
	},
	inputTime: {
		fontSize: 24,
		width: 75,
		backgroundColor: 'white',
	},
	inputMulti: {
		backgroundColor: 'white',
		height: 250,
	},
	prepTime: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
	},
	displayDecimal: {
		fontSize: 24,
		marginHorizontal: 5,
	},
	button: {
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
		padding: 15,
		marginVertical: 20,
		width: '100%',
		alignSelf: 'center',
		borderRadius: 5,
		borderWidth: 1,
		borderColor: 'white',
		color: 'white',
	},
});
