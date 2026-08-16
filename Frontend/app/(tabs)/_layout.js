import { Slot, usePathname, useRouter } from 'expo-router';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingList } from '../../components/ShoppingListProvider';
import { Colors } from '../../constants/colors';

function SvgIcon({ name, color, size = 22 }) {
	const p = {
		width: size, height: size,
		viewBox: '0 0 24 24', fill: 'none',
		stroke: color, strokeWidth: '1.9',
		strokeLinecap: 'round', strokeLinejoin: 'round',
	};
	switch (name) {
		case 'book':
			return (
				<Svg {...p}>
					<Path d='M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21' />
					<Path d='M4 5.5V21' />
					<Path d='M20 18.5V21H6.5' />
				</Svg>
			);
		case 'search':
			return (
				<Svg {...p}>
					<Circle cx='11' cy='11' r='7' />
					<Path d='m20 20-3.5-3.5' />
				</Svg>
			);
		case 'cart':
			return (
				<Svg {...p}>
					<Path d='M3 4h2.5l2.4 11.2a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-2l1-7H6.5' />
					<Circle cx='10' cy='20' r='1.6' />
					<Circle cx='17' cy='20' r='1.6' />
				</Svg>
			);
		case 'shuffle':
			return (
				<Svg {...p}>
					<Path d='M3 7h3.5l4 5 4 5H18M3 17h3.5l4-5M14.5 7H18m0 0-2.5-2.5M18 7l-2.5 2.5M18 17l-2.5-2.5M18 17l-2.5 2.5' />
				</Svg>
			);
		case 'plus':
			return (
				<Svg {...p} strokeWidth='2.4'>
					<Path d='M12 5v14M5 12h14' />
				</Svg>
			);
		default:
			return null;
	}
}

function NavItem({ icon, active, onPress, badge }) {
	return (
		<Pressable
			style={[styles.navItem, active && styles.navItemActive]}
			onPress={onPress}
			hitSlop={6}
		>
			<SvgIcon name={icon} color={active ? Colors.white : Colors.ink500} size={21} />
			{badge > 0 && (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
				</View>
			)}
		</Pressable>
	);
}

export default function SidebarLayout() {
	const insets = useSafeAreaInsets();
	const { shoppingList } = useShoppingList();
	const pathname = usePathname();
	const router = useRouter();

	const go = (path) => router.navigate(path);

	const isActive = (path) => {
		if (path === '/') return pathname === '/' || pathname === '/index';
		return pathname === path || pathname.startsWith(path + '/');
	};

	const navItems = [
		{ icon: 'book',    path: '/' },
		{ icon: 'search',  path: '/search' },
		{ icon: 'cart',    path: '/shoppingList', badge: shoppingList.length },
		{ icon: 'shuffle', path: '/randomizer' },
	];

	return (
		<View style={styles.root}>
			{/* ── Left sidebar ── */}
			<View style={[
				styles.sidebar,
				{
					paddingTop: insets.top + 10,
					paddingBottom: insets.bottom + 12,
					paddingLeft: insets.left,
				},
			]}>
				{/* App logo */}
				<View style={styles.appLogo}>
					<Image source={require('../../assets/icon.png')} style={styles.appLogoImage} />
				</View>

				{/* Nav items */}
				<View style={styles.navGroup}>
					{navItems.map(({ icon, path, badge }) => (
						<NavItem
							key={path}
							icon={icon}
							active={isActive(path)}
							onPress={() => go(path)}
							badge={badge}
						/>
					))}
				</View>

				<View style={styles.spacer} />

				{/* Add recipe */}
				<Pressable
					style={[styles.addBtn, isActive('/addRecipe') && styles.addBtnActive]}
					onPress={() => go('/addRecipe')}
					hitSlop={4}
				>
					<SvgIcon
						name='plus'
						color={isActive('/addRecipe') ? Colors.white : Colors.ink700}
						size={18}
					/>
				</Pressable>

			</View>

			{/* ── Content area ── */}
			<View style={[styles.content, { paddingTop: insets.top }]}>
				<Slot />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		flexDirection: 'row',
		backgroundColor: Colors.bg,
	},

	// Sidebar
	sidebar: {
		width: 64,
		backgroundColor: Colors.paper,
		borderRightWidth: 1,
		borderRightColor: Colors.ink200,
		alignItems: 'center',
		gap: 14,
		shadowColor: Colors.shadow,
		shadowOffset: { width: 2, height: 0 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 4,
	},
	appLogo: {
		width: 40,
		height: 40,
		borderRadius: 20,
		overflow: 'hidden',
		shadowColor: Colors.ink900,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 6,
		elevation: 4,
	},
	appLogoImage: {
		width: 40,
		height: 40,
	},
	addBtn: {
		width: 36,
		height: 36,
		borderRadius: 999,
		backgroundColor: Colors.bg,
		borderWidth: 1.5,
		borderColor: Colors.ink300,
		alignItems: 'center',
		justifyContent: 'center',
	},
	addBtnActive: {
		backgroundColor: Colors.blue600,
		borderColor: Colors.blue600,
	},
	spacer: {
		flex: 1,
	},
	navGroup: {
		alignItems: 'center',
		gap: 6,
	},
	navItem: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	navItemActive: {
		backgroundColor: Colors.blue700,
	},
	badge: {
		position: 'absolute',
		right: 4,
		top: 4,
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
	// Content
	content: {
		flex: 1,
		backgroundColor: Colors.bg,
	},
});
