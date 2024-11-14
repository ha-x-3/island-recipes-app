import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useShoppingList } from '../components/ShoppingListProvider'; 

export default function ShoppingList() {
	const { shoppingList, removeItem } = useShoppingList();

	const renderShoppingListItem = ({ item }) => (
		<View style={styles.listItem}>
			<Text style={styles.itemText}>
				{item.amount} {item.unit} - {item.name}
			</Text>
			<TouchableOpacity
				style={styles.deleteButton}
				onPress={() => removeItem(item.name)}
			>
				<Text style={styles.deleteButtonText}>Delete</Text>
			</TouchableOpacity>
		</View>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Shopping List</Text>
			<FlatList
				data={shoppingList}
				renderItem={renderShoppingListItem}
				keyExtractor={(item, index) => `${item.name}-${index}`}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'rgba(2, 169, 157, 1.0)',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginVertical: 15,
		textAlign: 'center',
	},
	listItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	itemText: {
		fontSize: 16,
	},
	deleteButton: {
		backgroundColor: 'lightcoral',
		padding: 5,
		borderRadius: 5,
	},
	deleteButtonText: {
		color: 'white',
		fontSize: 14,
	},
});
