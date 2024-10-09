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
					prepTime: '',
					cookTime: '',
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
		marginBottom: 5,
	},
	input: {
		backgroundColor: 'white',
		placeholderTextColor: 'gray',
		color: 'black',
		borderColor: 'gray',
		borderWidth: 1,
		marginBottom: 10,
		padding: 10,
	},
	button: {
		backgroundColor: 'blue',
		color: 'white',
		padding: 10,
		marginTop: 10,
		borderRadius: 5,
	},
	buttonText: {
		fontSize: 18,
	},
});
