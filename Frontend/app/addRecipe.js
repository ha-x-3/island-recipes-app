import React from 'react';
import { StyleSheet, Text, TextInput, View, Button, Alert } from 'react-native';
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
					<View style={styles.inputContainer}>
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
	inputContainer: {
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
});
