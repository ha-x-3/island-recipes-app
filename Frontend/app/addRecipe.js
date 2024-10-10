import React from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, Alert } from 'react-native';
import NumericInput from 'react-native-numeric-input-pure-js';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';

export default function addRecipe() {
	return (
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
							onChange={(value) => setFieldValue('yield', value)}
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
							/>
							{touched.prepTimeHour && errors.prepTimeHour && (
								<Text>{errors.prepTimeHour}</Text>
							)}
							<Text style={styles.displayDecimal}>:</Text>
							<TextInput
								style={styles.inputTime}
								onChangeText={handleChange('prepTimeMin')}
								value={values.prepTimeMin}
								placeholder='00'
								keyboardType='numeric'
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
							/>
							{touched.cookTimeHour && errors.cookTimeHour && (
								<Text>{errors.cookTimeHour}</Text>
							)}
							<Text style={styles.displayDecimal}>:</Text>
							<TextInput
								style={styles.inputTime}
								onChangeText={handleChange('cookTimeMin')}
								value={values.cookTimeMin}
								placeholder='00'
								keyboardType='numeric'
							/>
							{touched.cookTimeMin && errors.cookTimeMin && (
								<Text>{errors.cookTimeMin}</Text>
							)}
						</View>

						{/* Ingredients */}
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
														'ingredients[${index}].name'
													)}
													value={ingredient.name}
													placeholder='Ingredient Name'
												/>
												{touched.ingredients?.[index]
													?.name &&
													errors.ingredients?.[index]
														?.name && (
														<Text>
															errors.ingredients[index].name
														</Text>
													)}

												{/* Ingredient Amount */}
												<TextInput
													style={styles.input}
													onChangeText={handleChange(
														'ingredients[${index}].amount'
													)}
													value={ingredient.amount}
													placeholder='Amount'
													keyboardType='numeric'
												/>
												{touched.ingredients?.[index]
													?.amount &&
													errors.ingredients?.[index]
														?.amount && (
														<Text>
															errors.ingredients[index].amount
														</Text>
													)}

												{/* Ingredient Unit */}
												<TextInput
													style={styles.input}
													onChangeText={handleChange(
														'ingredients[${index}].unit'
													)}
													value={ingredient.unit}
													placeholder='Unit (e.g. cups, tsp)'
												/>
												{touched.ingredients?.[index]
													?.unit &&
													errors.ingredients?.[index]
														?.unit && (
														<Text>
															errors.ingredients[index].unit
														</Text>
													)}

												{/* Remove Ingredient Button */}
												<Pressable
													style={styles.button}
													title='Remove Ingredient'
													onPress={() =>
														arrayHelpers.remove(
															index
														)
													}
												>
													<Text>Remove Ingredient</Text>
												</Pressable>
											</View>
										)
									)}

									{/* Add Ingredient Button */}
									<Pressable
										style={styles.button}
										title='Add Ingredient'
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
					</View>
				)}
			</Formik>
		</View>
	);
}

const styles = StyleSheet.create({
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
		placeholderTextColor: 'gray',
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
	}
});
