import React, { useState, useMemo } from 'react';
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
	Pressable,
	TextInput,
	Modal,
} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useShoppingList } from '../../components/ShoppingListProvider';
import { Colors } from '../../constants/colors';

function CheckCircle({ checked }) {
	return (
		<View style={[styles.check, checked && styles.checkDone]}>
			{checked && (
				<Svg width={14} height={14} viewBox='0 0 24 24' fill='none'
					stroke='#fff' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round'>
					<Path d='m4 12 5 5L20 6' />
				</Svg>
			)}
		</View>
	);
}

export default function ShoppingList() {
	const { shoppingList, removeItem, updateItem, addItem } = useShoppingList();
	const [checked, setChecked] = useState(new Set());
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [currentItem, setCurrentItem] = useState(null);
	const [updatedAmount, setUpdatedAmount] = useState('');
	const [updatedUnit, setUpdatedUnit] = useState('');
	const [updatedName, setUpdatedName] = useState('');

	const handleEdit = (item) => {
		setCurrentItem(item);
		setUpdatedAmount(item.amount?.toString() ?? '');
		setUpdatedUnit(item.unit ?? '');
		setUpdatedName(item.name ?? '');
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

	const toggleCheck = (key) => {
		setChecked((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const total = shoppingList.length;
	const done = checked.size;
	const pct = total > 0 ? Math.round((done / total) * 100) : 0;

	// Group items by their "from" recipe if available, else put in "Other"
	const groups = useMemo(() => {
		const map = {};
		shoppingList.forEach((item, idx) => {
			const group = item.from || 'Other items';
			if (!map[group]) map[group] = [];
			map[group].push({ item, idx });
		});
		return Object.entries(map);
	}, [shoppingList]);

	if (total === 0) {
		return (
			<View style={styles.empty}>
				<View style={styles.emptyIconWrap}>
					<Svg width={44} height={44} viewBox='0 0 24 24' fill='none'
						stroke={Colors.blue600} strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'>
						<Path d='M3 4h2.5l2.4 11.2a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-2l1-7H6.5' />
						<Circle cx='10' cy='20' r='1.6' />
						<Circle cx='17' cy='20' r='1.6' />
					</Svg>
				</View>
				<Text style={styles.emptyTitle}>Your cart is empty</Text>
				<Text style={styles.emptyBody}>
					Tap any ingredient in a recipe to add it here.
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* Progress strip */}
				{total > 0 && (
					<View style={styles.progressStrip}>
						<Text style={styles.progressPct}>{pct}%</Text>
						<View style={{ flex: 1 }}>
							<Text style={styles.progressLabel}>
								{done === total ? 'All done!' : `${total - done} left to gather`}
							</Text>
							<View style={styles.progressTrack}>
								<View style={[styles.progressFill, { width: `${pct}%` }]} />
							</View>
						</View>
						<Text style={styles.progressFraction}>{done}/{total}</Text>
					</View>
				)}

				{/* Groups */}
				{groups.map(([groupName, entries]) => {
					const groupDone = entries.filter(({ idx }) => checked.has(idx)).length;
					return (
						<View key={groupName} style={styles.group}>
							<View style={styles.groupHeader}>
								<Text style={styles.groupTitle}>{groupName}</Text>
								<Text style={styles.groupCount}>
									{entries.length - groupDone} to gather
								</Text>
							</View>
							{entries.map(({ item, idx }, i) => {
								const key = idx;
								const isChecked = checked.has(key);
								return (
									<Pressable
										key={key}
										style={[
											styles.row,
											i === 0 && styles.rowFirst,
											isChecked && styles.rowChecked,
										]}
										onPress={() => toggleCheck(key)}
									>
										<CheckCircle checked={isChecked} />
										<Text
											style={[styles.rowText, isChecked && styles.rowTextDone]}
										>
											<Text style={styles.rowAmount}>
												{item.amount} {item.unit}{' '}
											</Text>
											{item.name}
										</Text>
										<View style={styles.rowActions}>
											<Pressable
												hitSlop={8}
												onPress={() => handleEdit(item)}
											>
												<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
													stroke={Colors.ink400} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
													<Path d='M16 3.5 20.5 8 8 20.5H3.5V16Z' />
													<Path d='m13.5 6 4.5 4.5' />
												</Svg>
											</Pressable>
											<Pressable
												hitSlop={8}
												onPress={() => removeItem(item.name)}
											>
												<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
													stroke={Colors.danger} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
													<Path d='M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13' />
												</Svg>
											</Pressable>
										</View>
									</Pressable>
								);
							})}
						</View>
					);
				})}

				{/* Add item by hand */}
				<Pressable
					style={styles.addBtn}
					onPress={() => {
						setCurrentItem(null);
						setUpdatedAmount('');
						setUpdatedUnit('');
						setUpdatedName('');
						setEditModalVisible(true);
					}}
				>
					<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
						stroke={Colors.ink500} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<Path d='M12 5v14M5 12h14' />
					</Svg>
					<Text style={styles.addBtnText}>Add an item by hand</Text>
				</Pressable>
			</ScrollView>

			{/* Edit modal */}
			<Modal
				visible={editModalVisible}
				animationType='slide'
				transparent
				onRequestClose={() => setEditModalVisible(false)}
			>
				<Pressable
					style={styles.backdrop}
					onPress={() => setEditModalVisible(false)}
				>
					<Pressable style={styles.sheet}>
						<Text style={styles.sheetTitle}>
							{currentItem ? 'Edit item' : 'Add item'}
						</Text>

						<Text style={styles.fieldLabel}>Name</Text>
						<TextInput
							style={styles.fieldInput}
							value={updatedName}
							onChangeText={setUpdatedName}
							placeholder='Item name'
							placeholderTextColor={Colors.ink400}
						/>

						<View style={styles.fieldRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.fieldLabel}>Amount</Text>
								<TextInput
									style={styles.fieldInput}
									keyboardType='numeric'
									value={updatedAmount}
									onChangeText={setUpdatedAmount}
									placeholder='0'
									placeholderTextColor={Colors.ink400}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.fieldLabel}>Unit</Text>
								<TextInput
									style={styles.fieldInput}
									value={updatedUnit}
									onChangeText={setUpdatedUnit}
									placeholder='cups, tsp…'
									placeholderTextColor={Colors.ink400}
								/>
							</View>
						</View>

						<View style={styles.sheetActions}>
							<Pressable
								style={styles.cancelBtn}
								onPress={() => setEditModalVisible(false)}
							>
								<Text style={styles.cancelBtnText}>Cancel</Text>
							</Pressable>
							<Pressable
								style={styles.saveBtn}
								onPress={() => {
									if (currentItem) {
										handleSave();
									} else if (updatedName.trim()) {
										addItem({ amount: updatedAmount, unit: updatedUnit, name: updatedName.trim() });
										setEditModalVisible(false);
									}
								}}
							>
								<Text style={styles.saveBtnText}>Save</Text>
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
		backgroundColor: Colors.bg,
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 32,
		gap: 14,
	},

	// Empty state
	empty: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
		backgroundColor: Colors.bg,
		gap: 14,
	},
	emptyIconWrap: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: Colors.blue100,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 18,
		color: Colors.ink900,
	},
	emptyBody: {
		fontFamily: 'Nunito-Regular',
		fontSize: 14,
		color: Colors.ink500,
		textAlign: 'center',
	},

	// Progress
	progressStrip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		backgroundColor: Colors.sage50,
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		borderColor: Colors.sage100,
	},
	progressPct: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 26,
		color: Colors.sage800,
		minWidth: 56,
		letterSpacing: -0.5,
	},
	progressLabel: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13,
		color: Colors.ink900,
		marginBottom: 6,
	},
	progressTrack: {
		height: 6,
		borderRadius: 99,
		backgroundColor: Colors.ink200,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: Colors.sage600,
		borderRadius: 99,
	},
	progressFraction: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13,
		color: Colors.ink700,
		minWidth: 36,
		textAlign: 'right',
	},

	// Groups
	group: {
		backgroundColor: Colors.paper,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: Colors.ink200,
		paddingHorizontal: 18,
		paddingBottom: 4,
		paddingTop: 16,
	},
	groupHeader: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	groupTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 18,
		color: Colors.ink900,
		letterSpacing: -0.2,
	},
	groupCount: {
		fontFamily: 'Nunito-Bold',
		fontSize: 12,
		color: Colors.ink500,
	},

	// Rows
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: Colors.ink200,
	},
	rowFirst: {
		borderTopWidth: 0,
	},
	rowChecked: {
		opacity: 0.55,
	},
	check: {
		width: 24,
		height: 24,
		borderRadius: 999,
		borderWidth: 1.5,
		borderColor: Colors.ink300,
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	},
	checkDone: {
		backgroundColor: Colors.sage600,
		borderWidth: 0,
	},
	rowText: {
		flex: 1,
		fontFamily: 'Nunito-Medium',
		fontSize: 14.5,
		color: Colors.ink900,
	},
	rowTextDone: {
		textDecorationLine: 'line-through',
		color: Colors.ink500,
	},
	rowAmount: {
		fontFamily: 'Nunito-Bold',
		color: Colors.ink700,
	},
	rowActions: {
		flexDirection: 'row',
		gap: 16,
	},

	// Add button
	addBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingVertical: 16,
		borderRadius: 18,
		borderWidth: 1.5,
		borderColor: Colors.ink300,
		borderStyle: 'dashed',
	},
	addBtnText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 14.5,
		color: Colors.ink500,
	},

	// Modal
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'flex-end',
	},
	sheet: {
		backgroundColor: Colors.paper,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		padding: 26,
		paddingBottom: 40,
	},
	sheetTitle: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 20,
		color: Colors.ink900,
		textAlign: 'center',
		marginBottom: 16,
		letterSpacing: -0.3,
	},
	fieldLabel: {
		fontFamily: 'Nunito-Bold',
		fontSize: 11.5,
		color: Colors.ink500,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
		marginBottom: 6,
		marginTop: 12,
	},
	fieldInput: {
		height: 46,
		borderWidth: 1,
		borderColor: Colors.ink200,
		borderRadius: 12,
		paddingHorizontal: 14,
		fontFamily: 'Nunito-Medium',
		fontSize: 15,
		color: Colors.ink900,
		backgroundColor: Colors.bg,
	},
	fieldRow: {
		flexDirection: 'row',
		gap: 12,
	},
	sheetActions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 24,
	},
	cancelBtn: {
		flex: 1,
		height: 50,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: Colors.ink200,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelBtnText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 15,
		color: Colors.ink700,
	},
	saveBtn: {
		flex: 1,
		height: 50,
		borderRadius: 999,
		backgroundColor: Colors.blue600,
		alignItems: 'center',
		justifyContent: 'center',
	},
	saveBtnText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 15,
		color: Colors.white,
	},
});
