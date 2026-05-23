import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	ScrollView,
	Pressable,
	ActivityIndicator,
	Image,
	StyleSheet,
} from 'react-native';
import NumericInput from 'react-native-numeric-input-pure-js';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons/faLockOpen';
import { Colors } from '../../constants/colors';
import { PROTEIN_TAGS } from '../../constants/tags';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

function pickRandom(pool) {
	return pool[Math.floor(Math.random() * pool.length)];
}

export default function Randomizer() {
	const [recipes, setRecipes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [mealCount, setMealCount] = useState(5);
	const [selectedProteins, setSelectedProteins] = useState([]);
	const [slots, setSlots] = useState(null);

	const fetchRecipes = useCallback(async () => {
		try {
			const res = await axios.get(`${BASE_URL}/api/recipes`);
			setRecipes(res.data);
		} catch {
			setError('Could not load recipes. Pull down to retry.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRecipes();
	}, [fetchRecipes]);

	const getPool = useCallback(() => {
		if (selectedProteins.length === 0) return recipes;
		return recipes.filter((r) =>
			r.tags?.some((tag) => selectedProteins.includes(tag))
		);
	}, [recipes, selectedProteins]);

	const generateMenu = () => {
		const pool = getPool();
		if (pool.length === 0) return;
		setSlots(
			Array.from({ length: mealCount }, () => ({
				recipe: pickRandom(pool),
				locked: false,
			}))
		);
	};

	const rerollSlot = (index) => {
		const pool = getPool();
		if (pool.length === 0) return;
		setSlots((prev) =>
			prev.map((slot, i) =>
				i === index ? { ...slot, recipe: pickRandom(pool) } : slot
			)
		);
	};

	const toggleLock = (index) => {
		setSlots((prev) =>
			prev.map((slot, i) =>
				i === index ? { ...slot, locked: !slot.locked } : slot
			)
		);
	};

	const rerollUnlocked = () => {
		const pool = getPool();
		if (pool.length === 0) return;
		setSlots((prev) =>
			prev.map((slot) =>
				slot.locked ? slot : { ...slot, recipe: pickRandom(pool) }
			)
		);
	};

	const toggleProtein = (protein) => {
		setSelectedProteins((prev) =>
			prev.includes(protein)
				? prev.filter((p) => p !== protein)
				: [...prev, protein]
		);
		setSlots(null);
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator
					size='large'
					color={Colors.primary}
				/>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={styles.errorText}>{error}</Text>
			</View>
		);
	}

	const pool = getPool();
	const emptyPool = pool.length === 0;
	const hasUnlocked = slots?.some((s) => !s.locked);

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
		>
			<Text style={styles.sectionLabel}>How many meals?</Text>
			<NumericInput
				value={mealCount}
				onChange={(v) => {
					setMealCount(v);
					setSlots(null);
				}}
				totalWidth={200}
				totalHeight={44}
				iconSize={22}
				step={1}
				minValue={1}
				maxValue={14}
				valueType='integer'
				rounded
				textColor={Colors.darkText}
				iconStyle={{ color: Colors.white }}
				rightButtonBackgroundColor={Colors.primary}
				leftButtonBackgroundColor={Colors.primary}
			/>

			<Text style={styles.sectionLabel}>Filter by protein (optional)</Text>
			<View style={styles.chipRow}>
				{PROTEIN_TAGS.map((protein) => {
					const active = selectedProteins.includes(protein);
					return (
						<Pressable
							key={protein}
							style={[styles.chip, active && styles.chipActive]}
							onPress={() => toggleProtein(protein)}
						>
							<Text style={[styles.chipText, active && styles.chipTextActive]}>
								{protein}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{emptyPool && selectedProteins.length > 0 && (
				<Text style={styles.emptyPoolText}>
					No recipes match these proteins. Add protein tags to your recipes or
					clear the filter.
				</Text>
			)}

			<Pressable
				style={({ pressed }) => [
					styles.generateButton,
					(pressed || emptyPool) && styles.generateButtonDisabled,
				]}
				onPress={generateMenu}
				disabled={emptyPool}
			>
				<FontAwesomeIcon
					icon={faArrowsRotate}
					size={16}
					color={Colors.white}
				/>
				<Text style={styles.generateButtonText}>
					{slots ? 'Regenerate All' : 'Generate Menu'}
				</Text>
			</Pressable>

			{slots && (
				<>
					<View style={styles.slotList}>
						{slots.map((slot, index) => (
							<View
								key={index}
								style={[styles.slotCard, slot.locked && styles.slotCardLocked]}
							>
								<Image
									source={{ uri: slot.recipe.recipePhotoUrl }}
									style={styles.slotImage}
								/>
								<View style={styles.slotInfo}>
									<Text style={styles.slotMealLabel}>Meal {index + 1}</Text>
									<Text
										style={styles.slotName}
										numberOfLines={2}
									>
										{slot.recipe.recipeName}
									</Text>
									{slot.recipe.tags?.length > 0 && (
										<Text
											style={styles.slotTags}
											numberOfLines={1}
										>
											{slot.recipe.tags.slice(0, 3).join(' · ')}
										</Text>
									)}
								</View>
								<View style={styles.slotActions}>
									<Pressable
										style={[
											styles.slotBtn,
											slot.locked && styles.slotBtnLocked,
										]}
										onPress={() => toggleLock(index)}
										hitSlop={8}
									>
										<FontAwesomeIcon
											icon={slot.locked ? faLock : faLockOpen}
											size={15}
											color={slot.locked ? Colors.white : Colors.lightText}
										/>
									</Pressable>
									{!slot.locked && (
										<Pressable
											style={styles.slotBtn}
											onPress={() => rerollSlot(index)}
											hitSlop={8}
										>
											<FontAwesomeIcon
												icon={faArrowsRotate}
												size={15}
												color={Colors.lightText}
											/>
										</Pressable>
									)}
								</View>
							</View>
						))}
					</View>

					{hasUnlocked && (
						<Pressable
							style={({ pressed }) => [
								styles.rerollButton,
								pressed && styles.rerollButtonPressed,
							]}
							onPress={rerollUnlocked}
						>
							<FontAwesomeIcon
								icon={faArrowsRotate}
								size={16}
								color={Colors.white}
							/>
							<Text style={styles.rerollButtonText}>Re-roll Unlocked</Text>
						</Pressable>
					)}
				</>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	content: {
		padding: 20,
		paddingBottom: 48,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.background,
	},
	errorText: {
		fontFamily: 'OpenSans',
		fontSize: 15,
		color: Colors.error,
		textAlign: 'center',
	},
	sectionLabel: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 14,
		color: Colors.darkText,
		marginTop: 20,
		marginBottom: 10,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	chip: {
		borderRadius: 24,
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: Colors.white,
		borderColor: Colors.inputBorder,
		borderWidth: 1,
	},
	chipActive: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	chipText: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 13,
		color: Colors.darkText,
	},
	chipTextActive: {
		color: Colors.white,
	},
	emptyPoolText: {
		fontFamily: 'OpenSans',
		fontSize: 13,
		color: Colors.error,
		marginTop: 12,
		lineHeight: 20,
	},
	generateButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		backgroundColor: Colors.primary,
		borderRadius: 14,
		paddingVertical: 15,
		marginTop: 24,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.20,
		shadowRadius: 8,
		elevation: 4,
	},
	generateButtonDisabled: {
		opacity: 0.5,
	},
	generateButtonText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 16,
		color: Colors.white,
	},
	slotList: {
		marginTop: 24,
		gap: 12,
	},
	slotCard: {
		flexDirection: 'row',
		backgroundColor: Colors.cardBackground,
		borderRadius: 16,
		overflow: 'hidden',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.10,
		shadowRadius: 8,
		elevation: 3,
		alignItems: 'center',
	},
	slotCardLocked: {
		borderColor: Colors.primary,
		borderWidth: 2,
	},
	slotImage: {
		width: 80,
		height: 80,
	},
	slotInfo: {
		flex: 1,
		padding: 12,
		gap: 2,
	},
	slotMealLabel: {
		fontFamily: 'OpenSans-SemiBold',
		fontSize: 11,
		color: Colors.primary,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	slotName: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 14,
		color: Colors.darkText,
		lineHeight: 20,
	},
	slotTags: {
		fontFamily: 'OpenSans',
		fontSize: 11,
		color: Colors.lightText,
		marginTop: 2,
	},
	slotActions: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: 8,
		paddingRight: 12,
		paddingVertical: 12,
	},
	slotBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: Colors.offWhite,
		justifyContent: 'center',
		alignItems: 'center',
		borderColor: Colors.inputBorder,
		borderWidth: 1,
	},
	slotBtnLocked: {
		backgroundColor: Colors.primary,
		borderColor: Colors.primary,
	},
	rerollButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: Colors.primaryDark,
		borderRadius: 14,
		paddingVertical: 15,
		marginTop: 16,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 3,
	},
	rerollButtonPressed: {
		opacity: 0.8,
	},
	rerollButtonText: {
		fontFamily: 'OpenSans-Bold',
		fontSize: 16,
		color: Colors.white,
	},
});
