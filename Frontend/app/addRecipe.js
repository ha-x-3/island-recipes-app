import React from 'react';
import { StyleSheet, Text, TextInput, View, Button, Alert } from 'react-native';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';

export default function addRecipe() {
	return (
		<View style={styles.container}>
			<Formik
				initialValues={{
					recipeName: '',
					yield: '',
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
				}) => 
				<View>
					{/* Recipe Name */}
					<Text>Recipe Name</Text>
					<TextInput
						onChangeText={handleChange('recipeName')}
						value={values.recipeName}
						placeholder='Recipe Name'
					></TextInput>
					{touched.recipeName && errors.recipeName && <Text>{errors.recipeName}</Text>}
				</View>}
			</Formik>
		</View>
	);
}

const styles = StyleSheet.create({});
