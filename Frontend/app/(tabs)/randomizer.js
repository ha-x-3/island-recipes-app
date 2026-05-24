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
import { Svg, Path, Circle } from 'react-native-svg';
import axios from 'axios';
import { Colors } from '../../constants/colors';
import { PROTEIN_TAGS } from '../../constants/tags';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function pickRandom(pool) {
	return pool[Math.floor(Math.random() * pool.length)];
}

function LockIcon({ locked }) {
	return (
		<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
			stroke={locked ? '#fff' : Colors.ink700}
			strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
			{locked ? (
				<>
					<Rect x='5' y='11' width='14' height='9' rx='2' />
					<Path d='M8 11V8a4 4 0 0 1 8 0v3' />
				</>
			) : (
				<>
					<Rect x='5' y='11' width='14' height='9' rx='2' />
					<Path d='M8 11V8a4 4 0 0 1 8 0' />
				</>
			)}
		</Svg>
	);
}

function Rect({ x, y, width, height, rx }) {
	// SVG Rect via Path approximation (react-native-svg exports Rect natively)
	return null;
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
			prev.includes(protein) ? prev.filter((p) => p !== protein) : [...prev, protein]
		);
		setSlots(null);
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size='large' color={Colors.blue600} />
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
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			{/* Controls panel */}
			<View style={styles.controlPanel}>
				{/* Meal count */}
				<View style={styles.countSection}>
					<Text style={styles.controlLabel}>Meals</Text>
					<View style={styles.stepper}>
						<Pressable
							style={[styles.stepperBtn, mealCount <= 1 && styles.stepperBtnDisabled]}
							onPress={() => { if (mealCount > 1) { setMealCount(mealCount - 1); setSlots(null); } }}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={Colors.blue700} strokeWidth='2.4' strokeLinecap='round'>
								<Path d='M5 12h14' />
							</Svg>
						</Pressable>
						<Text style={styles.stepperValue}>{mealCount}</Text>
						<Pressable
							style={[styles.stepperBtn, mealCount >= 14 && styles.stepperBtnDisabled]}
							onPress={() => { if (mealCount < 14) { setMealCount(mealCount + 1); setSlots(null); } }}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke={Colors.blue700} strokeWidth='2.4' strokeLinecap='round'>
								<Path d='M12 5v14M5 12h14' />
							</Svg>
						</Pressable>
					</View>
				</View>

				<View style={styles.controlDivider} />

				{/* Protein filter */}
				<View style={styles.proteinSection}>
					<Text style={styles.controlLabel}>
						Filter by protein{' '}
						<Text style={styles.controlLabelOptional}>(optional)</Text>
					</Text>
					<View style={styles.chipRow}>
						{PROTEIN_TAGS.map((p) => {
							const active = selectedProteins.includes(p);
							return (
								<Pressable
									key={p}
									style={[styles.chip, active && styles.chipActive]}
									onPress={() => toggleProtein(p)}
								>
									<Text style={[styles.chipText, active && styles.chipTextActive]}>
										{p}
									</Text>
								</Pressable>
							);
						})}
					</View>
					{emptyPool && selectedProteins.length > 0 && (
						<Text style={styles.emptyPool}>
							No recipes match these proteins. Add protein tags to your recipes or clear the filter.
						</Text>
					)}
				</View>
			</View>

			{/* Generate button */}
			<Pressable
				style={({ pressed }) => [
					styles.generateBtn,
					(pressed || emptyPool) && { opacity: 0.6 },
				]}
				onPress={generateMenu}
				disabled={emptyPool}
			>
				<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
					stroke='#fff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
					<Path d='M3 7h3.5l4 5 4 5H18M3 17h3.5l4-5M14.5 7H18m0 0-2.5-2.5M18 7l-2.5 2.5M18 17l-2.5-2.5M18 17l-2.5 2.5' />
				</Svg>
				<Text style={styles.generateBtnText}>
					{slots ? 'Regenerate All' : 'Generate Menu'}
				</Text>
			</Pressable>

			{/* Slots */}
			{slots && (
				<>
					<View style={styles.slotList}>
						{slots.map((slot, i) => (
							<View
								key={i}
								style={[styles.slotCard, slot.locked && styles.slotCardLocked]}
							>
								<Image
									source={{ uri: slot.recipe.recipePhotoUrl }}
									style={styles.slotImage}
								/>
								<View style={styles.slotInfo}>
									<Text style={[styles.slotDay, slot.locked && styles.slotDayLocked]}>
										{DAYS[i % DAYS.length]}
									</Text>
									<Text style={styles.slotName} numberOfLines={2}>
										{slot.recipe.recipeName}
									</Text>
									{slot.recipe.tags?.length > 0 && (
										<Text style={styles.slotTags} numberOfLines={1}>
											{slot.recipe.tags.slice(0, 2).join(' · ')}
										</Text>
									)}
								</View>
								<View style={styles.slotActions}>
									<Pressable
										style={[styles.slotBtn, slot.locked && styles.slotBtnLocked]}
										onPress={() => toggleLock(i)}
										hitSlop={8}
									>
										<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
											stroke={slot.locked ? '#fff' : Colors.blue700}
											strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
											{slot.locked ? (
												<>
													<Path d='M5 11h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V11z' />
													<Path d='M8 11V8a4 4 0 0 1 8 0v3' />
												</>
											) : (
												<>
													<Path d='M5 11h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V11z' />
													<Path d='M8 11V8a4 4 0 0 1 8 0' />
												</>
											)}
										</Svg>
									</Pressable>
									{!slot.locked && (
										<Pressable
											style={styles.slotRerollBtn}
											onPress={() => rerollSlot(i)}
											hitSlop={8}
										>
											<Svg width={16} height={16} viewBox='0 0 24 24' fill='none'
												stroke={Colors.ink700} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
												<Path d='M21 12a9 9 0 1 1-3.6-7.2' />
												<Path d='M21 4v5h-5' />
											</Svg>
										</Pressable>
									)}
								</View>
							</View>
						))}
					</View>

					{hasUnlocked && (
						<Pressable
							style={({ pressed }) => [styles.rerollBtn, pressed && { opacity: 0.8 }]}
							onPress={rerollUnlocked}
						>
							<Svg width={18} height={18} viewBox='0 0 24 24' fill='none'
								stroke='#fff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
								<Path d='M21 12a9 9 0 1 1-3.6-7.2' />
								<Path d='M21 4v5h-5' />
							</Svg>
							<Text style={styles.rerollBtnText}>Re-roll unlocked</Text>
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
		backgroundColor: Colors.bg,
	},
	content: {
		padding: 16,
		paddingBottom: 48,
		gap: 14,
	},
	center: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Colors.bg,
	},
	errorText: {
		fontFamily: 'Nunito-Regular',
		fontSize: 15,
		color: Colors.error,
		textAlign: 'center',
	},

	// Controls panel
	controlPanel: {
		backgroundColor: Colors.paper,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: Colors.ink200,
		padding: 18,
		gap: 16,
	},
	countSection: {
		gap: 10,
	},
	proteinSection: {
		gap: 10,
	},
	controlLabel: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 11.5,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		color: Colors.ink500,
	},
	controlLabelOptional: {
		fontFamily: 'Nunito-Medium',
		fontWeight: '400',
		textTransform: 'none',
		letterSpacing: 0,
		color: Colors.ink400,
		fontSize: 11.5,
	},
	controlDivider: {
		height: 1,
		backgroundColor: Colors.ink200,
	},

	// Stepper
	stepper: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	stepperBtn: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: Colors.blue100,
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepperBtnDisabled: {
		opacity: 0.4,
	},
	stepperValue: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 34,
		color: Colors.ink900,
		width: 60,
		textAlign: 'center',
		letterSpacing: -0.5,
	},

	// Protein chips
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 7,
	},
	chip: {
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 8,
		backgroundColor: Colors.paper,
		borderWidth: 1,
		borderColor: Colors.ink300,
	},
	chipActive: {
		backgroundColor: Colors.blue700,
		borderColor: Colors.blue700,
	},
	chipText: {
		fontFamily: 'Nunito-Bold',
		fontSize: 13,
		color: Colors.ink700,
	},
	chipTextActive: {
		color: Colors.white,
	},
	emptyPool: {
		fontFamily: 'Nunito-Regular',
		fontSize: 13,
		color: Colors.error,
		lineHeight: 20,
	},

	// Generate button
	generateBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		backgroundColor: Colors.blue600,
		borderRadius: 999,
		paddingVertical: 16,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
	},
	generateBtnText: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 16,
		color: Colors.white,
		letterSpacing: -0.2,
	},

	// Slot list
	slotList: {
		gap: 12,
	},
	slotCard: {
		flexDirection: 'row',
		backgroundColor: Colors.paper,
		borderRadius: 22,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: Colors.ink200,
		alignItems: 'stretch',
		shadowColor: Colors.shadow,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 2,
	},
	slotCardLocked: {
		borderColor: Colors.blue700,
		borderWidth: 2,
	},
	slotImage: {
		width: 100,
		height: 100,
		backgroundColor: Colors.blue100,
	},
	slotInfo: {
		flex: 1,
		padding: 14,
		gap: 3,
		justifyContent: 'center',
	},
	slotDay: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 11,
		letterSpacing: 0.7,
		textTransform: 'uppercase',
		color: Colors.sage700,
	},
	slotDayLocked: {
		color: Colors.blue700,
	},
	slotName: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 15,
		color: Colors.ink900,
		lineHeight: 20,
		letterSpacing: -0.2,
	},
	slotTags: {
		fontFamily: 'Nunito-SemiBold',
		fontSize: 12,
		color: Colors.ink500,
	},
	slotActions: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: 8,
		paddingRight: 12,
		paddingVertical: 14,
		justifyContent: 'center',
	},
	slotBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: Colors.blue100,
		alignItems: 'center',
		justifyContent: 'center',
	},
	slotBtnLocked: {
		backgroundColor: Colors.blue700,
	},
	slotRerollBtn: {
		width: 40,
		height: 40,
		borderRadius: 12,
		backgroundColor: Colors.ink100,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Re-roll button
	rerollBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		backgroundColor: Colors.blue700,
		borderRadius: 999,
		paddingVertical: 15,
	},
	rerollBtnText: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 15,
		color: Colors.white,
		letterSpacing: -0.2,
	},
});
