import React, { useState } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	Pressable,
	TextInput,
	Modal,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons/faPencil';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons/faCartShopping';
import { useShoppingList } from '../../components/ShoppingListProvider';
import { Colors } from '../../constants/colors';

export default function ShoppingList() {
	const { shoppingList, removeItem, updateItem } = useShoppingList();
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [currentItem, setCurrentItem] = useState(null);
	const [updatedAmount, setUpdatedAmount] = useState('');
	const [updatedUnit, setUpdatedUnit] = useState('');
	const [updatedName, setUpdatedName] = useState('');

	const handleEdit = (item) => {
		setCurrentItem(item);
		setUpdatedAmount(item.amount.toString());
		setUpdatedUnit(item.unit);
		setUpdatedName(item.name);
		setEditModalVisible(true);
	};

	const handleSave = () => {
		updateItem(currentItem.name, {
			amount: updatedAmount,
			unit: updatedUnit,
			name: updatedName,
		});
		setEditModalVisible(false);
	};

	const renderItem = ({ item, index }) => (
		<View style={[styles.listItem, index === 0 && styles.listItemFirst]}>
			<View style={styles.itemDot} />
			<Text style={styles.itemText}>
				{item.amount} {item.unit} {item.name}
			</Text>
			<View style={styles.itemActions}>
				<Pressable
					style={styles.iconButton}
					onPress={() => handleEdit(item)}
					hitSlop={8}
				>
					<FontAwesomeIcon
						icon={faPencil}
						size={16}
						color={Colors.info}
					/>
				</Pressable>
				<Pressable
					style={styles.iconButton}
					onPress={() => removeItem(item.name)}
					hitSlop={8}
				>
					<FontAwesomeIcon
						icon={faTrash}
						size={16}
						color={Colors.danger}
					/>
				</Pressable>
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			{shoppingList.length === 0 ? (
				<View style={styles.emptyContainer}>
					<View style={styles.emptyIconCircle}>
						<FontAwesomeIcon
							icon={faCartShopping}
							size={44}
							color={Colors.primary}
						/>
					</View>
					<Text style={styles.emptyText}>Your cart is empty</Text>
					<Text style={styles.emptySubText}>
						Tap any ingredient in a recipe to add it here.
					</Text>
				</View>
			) : (
				<FlatList
					data={shoppingList}
					renderItem={renderItem}
					keyExtractor={(item, index) => `${item.name}-${index}`}
					contentContainerStyle={styles.listContent}
				/>
			)}

			<Modal
				visible={editModalVisible}
				animationType='slide'
				transparent
				onRequestClose={() => setEditModalVisible(false)}
			>
				<Pressable
					style={styles.modalBackdrop}
					onPress={() => setEditModalVisible(false)}
				>
					<Pressable style={styles.modalSheet}>
						<Text style={styles.modalTitle}>Edit Item</Text>

						<Text style={styles.modalLabel}>Name</Text>
						<TextInput
							style={styles.modalInput}
							value={updatedName}
							onChangeText={setUpdatedName}
							placeholder='Item name'
							placeholderTextColor={Colors.mutedText}
						/>

						<View style={styles.modalRow}>
							<View style={styles.modalHalf}>
								<Text style={styles.modalLabel}>Amount</Text>
								<TextInput
									style={styles.modalInput}
									keyboardType='numeric'
									value={updatedAmount}
									onChangeText={setUpdatedAmount}
									placeholder='0'
									placeholderTextColor={Colors.mutedText}
								/>
							</View>
							<View style={styles.modalHalf}>
								<Text style={styles.modalLabel}>Unit</Text>
								<TextInput
									style={styles.modalInput}
									value={updatedUnit}
									onChangeText={setUpdatedUnit}
									placeholder='cups, tsp…'
									placeholderTextColor={Colors.mutedText}
								/>
							</View>
						</View>

						<View style={styles.modalButtons}>
							<Pressable
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setEditModalVisible(false)}
							>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</Pressable>
							<Pressable
								style={[styles.modalButton, styles.saveButton]}
								onPress={handleSave}
							>
								<Text style={styles.saveButtonText}>Save</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: 16,
		padding: 32,
	},
	emptyIconCircle: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: Colors.primaryLight,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 4,
	},
	emptyText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 18,
		color: Colors.darkText,
	},
	emptySubText: {
		fontFamily: 'OpenSans',
		fontSize: 14,
		color: Colors.lightText,
		textAlign: 'center',
	},
	listContent: {
		padding: 16,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.white,
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 14,
		marginBottom: 10,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 2,
		gap: 12,
	},
	listItemFirst: {
		marginTop: 0,
	},
	itemDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: Colors.primary,
	},
	itemText: {
		flex: 1,
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.darkText,
	},
	itemActions: {
		flexDirection: 'row',
		gap: 16,
	},
	iconButton: {
		padding: 4,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'flex-end',
	},
	modalSheet: {
		backgroundColor: Colors.white,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		padding: 28,
		paddingBottom: 40,
		gap: 4,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 8,
	},
	modalTitle: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 18,
		color: Colors.darkText,
		marginBottom: 12,
		textAlign: 'center',
	},
	modalLabel: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 13,
		color: Colors.mediumText,
		marginTop: 10,
		marginBottom: 4,
	},
	modalInput: {
		height: 44,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.darkText,
		backgroundColor: Colors.inputBackground,
	},
	modalRow: {
		flexDirection: 'row',
		gap: 12,
	},
	modalHalf: {
		flex: 1,
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 24,
	},
	modalButton: {
		flex: 1,
		height: 48,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cancelButton: {
		backgroundColor: Colors.inputBackground,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
	},
	cancelButtonText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 15,
		color: Colors.mediumText,
	},
	saveButton: {
		backgroundColor: Colors.primary,
	},
	saveButtonText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 15,
		color: Colors.white,
	},
});
