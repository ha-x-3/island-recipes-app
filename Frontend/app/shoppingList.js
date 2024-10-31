import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useShoppingList } from '../components/ShoppingListProvider'; 

export default function ShoppingList() {
	const { shoppingList } = useShoppingList();

	const renderShoppingListItem = ({ item }) => (
		<View style={styles.listItem}>
			<Text style={styles.itemText}>
				{item.amount} {item.unit} - {item.name}
			</Text>
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
		marginBottom: 8,
        textAlign: 'center',
	},
	listItem: {
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
	itemText: {
		fontSize: 16,
	},
});
