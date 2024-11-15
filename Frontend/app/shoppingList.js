import React, { useState } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	Modal,
	Button,
} from 'react-native';
import { useShoppingList } from '../components/ShoppingListProvider'; 

export default function ShoppingList() {
	const { shoppingList, removeItem, updateItem } = useShoppingList();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [currentItem, setCurrentItem] = useState(null);
	const [updatedAmount, setUpdatedAmount] = useState('');
	const [updatedUnit, setUpdatedUnit] = useState('');
	const [updatedName, setUpdatedName] = useState('');

	// Open edit modal and populate current item data
	const handleEdit = (item) => {
		setCurrentItem(item);
		setUpdatedAmount(item.amount.toString());
		setUpdatedUnit(item.unit);
		setUpdatedName(item.name);
		setEditModalVisible(true);
	};

	// Save the edited item
	const handleSave = () => {
		updateItem(currentItem.name, {
			amount: updatedAmount,
			unit: updatedUnit,
			name: updatedName,
		});
		setEditModalVisible(false);
	};

	const renderShoppingListItem = ({ item }) => (
		<View style={styles.listItem}>
			<Text style={styles.itemText}>
				{item.amount} {item.unit} - {item.name}
			</Text>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={styles.editButton}
					onPress={() => handleEdit(item)}
				>
					<Text style={styles.buttonText}>Edit</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.deleteButton}
					onPress={() => removeItem(item.name)}
				>
					<Text style={styles.buttonText}>Delete</Text>
				</TouchableOpacity>
			</View>
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

			{/* Edit Modal */}
			<Modal
				visible={editModalVisible}
				animationType='slide'
				transparent={true}
			>
				<View style={styles.modalContainer}>
					<Text style={styles.modalTitle}>Edit Item</Text>
					<TextInput
						style={styles.input}
						placeholder='Amount'
						keyboardType='numeric'
						value={updatedAmount}
						onChangeText={setUpdatedAmount}
					/>
					<TextInput
						style={styles.input}
						placeholder='Unit'
						value={updatedUnit}
						onChangeText={setUpdatedUnit}
					/>
					<TextInput
						style={styles.input}
						placeholder='Name'
						value={updatedName}
						onChangeText={setUpdatedName}
					/>
					<Button
						title='Save'
						onPress={handleSave}
					/>
					<Button
						title='Cancel'
						onPress={() => setEditModalVisible(false)}
					/>
				</View>
			</Modal>
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
	buttonContainer: {
		flexDirection: 'row',
	},
	editButton: {
		backgroundColor: 'dodgerblue',
		padding: 5,
		marginRight: 5,
		borderRadius: 5,
	},
	deleteButton: {
		backgroundColor: 'lightcoral',
		padding: 5,
		borderRadius: 5,
	},
	buttonText: {
		color: 'white',
		fontSize: 14,
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		padding: 20,
	},
	modalTitle: {
		fontSize: 20,
		marginBottom: 15,
		color: 'white',
	},
	input: {
		width: '80%',
		padding: 10,
		backgroundColor: 'white',
		marginBottom: 10,
		borderRadius: 5,
	},
});
