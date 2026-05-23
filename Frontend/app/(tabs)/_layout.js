import { Tabs } from 'expo-router';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons/faBookOpen';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons/faCirclePlus';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons/faCartShopping';
import { faShuffle } from '@fortawesome/free-solid-svg-icons/faShuffle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingList } from '../../components/ShoppingListProvider';
import { Colors } from '../../constants/colors';

const logoSrc = require('../../assets/islandRecipes.png');

function LogoHeader({ title }) {
	return (
		<View style={{ alignItems: 'center', gap: 1 }}>
			<Image
				source={logoSrc}
				style={{ width: 90, height: 38, resizeMode: 'contain' }}
				accessibilityLabel='Island Recipes'
			/>
			<Text
				style={{
					color: Colors.white,
					fontFamily: 'OpenSans-SemiBold',
					fontSize: 12,
					letterSpacing: 0.5,
					opacity: 0.9,
				}}
			>
				{title}
			</Text>
		</View>
	);
}

function TabIcon({ icon, color, size, badge }) {
	return (
		<View>
			<FontAwesomeIcon
				icon={icon}
				size={size}
				color={color}
			/>
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
				tabBarActiveTintColor: Colors.primary,
				tabBarInactiveTintColor: Colors.lightText,
				tabBarStyle: {
					backgroundColor: Colors.white,
					borderTopWidth: 0,
					paddingBottom: insets.bottom + 4,
					paddingTop: 6,
					height: 62 + insets.bottom,
					shadowColor: Colors.shadow,
					shadowOffset: { width: 0, height: -3 },
					shadowOpacity: 0.10,
					shadowRadius: 10,
					elevation: 8,
				},
				tabBarLabelStyle: {
					fontFamily: 'OpenSans-SemiBold',
					fontSize: 11,
				},
				headerStyle: {
					backgroundColor: Colors.primary,
					shadowColor: Colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.15,
					shadowRadius: 8,
					elevation: 4,
				},
				headerTintColor: Colors.white,
				headerTitleAlign: 'center',
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					headerTitle: () => (
						<Image
							source={logoSrc}
							style={{ width: 130, height: 55, resizeMode: 'contain' }}
							accessibilityLabel='Island Recipes'
						/>
					),
					tabBarLabel: 'Recipes',
					tabBarIcon: ({ color, size }) => (
						<TabIcon
							icon={faBookOpen}
							color={color}
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='addRecipe'
				options={{
					headerTitle: () => <LogoHeader title='Add A Recipe' />,
					tabBarLabel: 'Add',
					tabBarIcon: ({ color, size }) => (
						<TabIcon
							icon={faCirclePlus}
							color={color}
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='search'
				options={{
					headerTitle: () => <LogoHeader title='Search' />,
					tabBarLabel: 'Search',
					tabBarIcon: ({ color, size }) => (
						<TabIcon
							icon={faMagnifyingGlass}
							color={color}
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='shoppingList'
				options={{
					headerTitle: () => <LogoHeader title='Shopping List' />,
					tabBarLabel: 'Cart',
					tabBarIcon: ({ color, size }) => (
						<TabIcon
							icon={faCartShopping}
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
					headerTitle: () => <LogoHeader title='Menu Randomizer' />,
					tabBarLabel: 'Menu',
					tabBarIcon: ({ color, size }) => (
						<TabIcon
							icon={faShuffle}
							color={color}
							size={size}
						/>
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	badge: {
		position: 'absolute',
		right: -8,
		top: -4,
		backgroundColor: Colors.danger,
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
		fontFamily: 'OpenSans-Bold',
	},
});
