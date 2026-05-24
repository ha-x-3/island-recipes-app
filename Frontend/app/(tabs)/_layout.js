import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingList } from '../../components/ShoppingListProvider';
import { Colors } from '../../constants/colors';

// Inline SVG icon set — matches design system (rounded, 24×24)
function TabIcon({ name, color, size, badge }) {
	const s = size ?? 22;
	const sw = '1.8';
	const props = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
	const icons = {
		book: (
			<Svg {...props}>
				<Path d='M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21' />
				<Path d='M4 5.5V21' />
				<Path d='M20 18.5V21H6.5' />
			</Svg>
		),
		plus: (
			<Svg {...props}>
				<Path d='M12 5v14M5 12h14' strokeWidth='2.4' />
			</Svg>
		),
		search: (
			<Svg {...props}>
				<Circle cx='11' cy='11' r='7' />
				<Path d='m20 20-3.5-3.5' />
			</Svg>
		),
		cart: (
			<Svg {...props}>
				<Path d='M3 4h2.5l2.4 11.2a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-2l1-7H6.5' />
				<Circle cx='10' cy='20' r='1.6' />
				<Circle cx='17' cy='20' r='1.6' />
			</Svg>
		),
		shuffle: (
			<Svg {...props}>
				<Path d='M3 7h3.5l4 5 4 5H18M3 17h3.5l4-5M14.5 7H18m0 0-2.5-2.5M18 7l-2.5 2.5M18 17l-2.5-2.5M18 17l-2.5 2.5' />
			</Svg>
		),
	};
	return (
		<View>
			{icons[name]}
			{badge > 0 && (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
				</View>
			)}
		</View>
	);
}

export default function TabsLayout() {
	const { shoppingList } = useShoppingList();
	const insets = useSafeAreaInsets();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors.blue600,
				tabBarInactiveTintColor: Colors.ink500,
				tabBarStyle: {
					backgroundColor: Colors.paper,
					borderTopWidth: 1,
					borderTopColor: Colors.ink200,
					paddingBottom: insets.bottom + 4,
					paddingTop: 8,
					height: 64 + insets.bottom,
					shadowColor: Colors.shadow,
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.06,
					shadowRadius: 12,
					elevation: 8,
				},
				tabBarLabelStyle: {
					fontFamily: 'Nunito-Bold',
					fontSize: 11,
					letterSpacing: -0.1,
				},
				headerStyle: {
					backgroundColor: Colors.bg,
					shadowColor: 'transparent',
					elevation: 0,
				},
				headerTintColor: Colors.ink900,
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Nunito-ExtraBold',
					fontSize: 20,
					color: Colors.ink900,
					letterSpacing: -0.4,
				},
				headerShadowVisible: false,
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Recipes',
					headerTitle: () => (
						<Text style={styles.headerWordmark}>Island Recipes</Text>
					),
					tabBarLabel: 'Recipes',
					tabBarIcon: ({ color, size }) => (
						<TabIcon name='book' color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name='addRecipe'
				options={{
					title: 'Add Recipe',
					tabBarLabel: 'Add',
					tabBarIcon: ({ color, size }) => (
						<TabIcon name='plus' color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name='search'
				options={{
					title: 'Search',
					tabBarLabel: 'Search',
					tabBarIcon: ({ color, size }) => (
						<TabIcon name='search' color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name='shoppingList'
				options={{
					title: 'Shopping List',
					tabBarLabel: 'Cart',
					tabBarIcon: ({ color, size }) => (
						<TabIcon
							name='cart'
							color={color}
							size={size}
							badge={shoppingList.length}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='randomizer'
				options={{
					title: 'Menu Randomizer',
					tabBarLabel: 'Menu',
					tabBarIcon: ({ color, size }) => (
						<TabIcon name='shuffle' color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	headerWordmark: {
		fontFamily: 'Nunito-ExtraBold',
		fontSize: 20,
		color: Colors.ink900,
		letterSpacing: -0.5,
	},
	badge: {
		position: 'absolute',
		right: -8,
		top: -4,
		backgroundColor: Colors.sage600,
		borderRadius: 8,
		minWidth: 16,
		height: 16,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 2,
	},
	badgeText: {
		color: Colors.white,
		fontSize: 9,
		fontFamily: 'Nunito-Bold',
	},
});
