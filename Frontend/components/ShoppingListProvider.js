import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ShoppingListContext = createContext();

export const useShoppingList = () => useContext(ShoppingListContext);

export const ShoppingListProvider = ({ children }) => {
	const [shoppingList, setShoppingList] = useState([]);

	useEffect(() => {
		const loadShoppingList = async () => {
			try {
				const storedList = await AsyncStorage.getItem('shoppingList');
				if (storedList) setShoppingList(JSON.parse(storedList));
			} catch (error) {
				console.error('Failed to load shopping list:', error);
			}
		};

		loadShoppingList();
	}, []);

	const saveShoppingList = async (list) => {
		try {
			await AsyncStorage.setItem('shoppingList', JSON.stringify(list));
		} catch (error) {
			console.error('Failed to save shopping list:', error);
		}
	};

	const addItem = (item) => {
		const updatedList = [...shoppingList, item];
		setShoppingList(updatedList);
		saveShoppingList(updatedList);
	};

	const removeItem = (itemName) => {
		const updatedList = shoppingList.filter(
			(item) => item.name !== itemName
		);
		setShoppingList(updatedList);
		saveShoppingList(updatedList);
	};

	return (
		<ShoppingListContext.Provider
			value={{ shoppingList, addItem, removeItem }}
		>
			{children}
		</ShoppingListContext.Provider>
	);
};
