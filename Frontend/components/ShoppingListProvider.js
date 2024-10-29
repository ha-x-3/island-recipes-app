import React, { createContext, useState, useContext } from 'react';

const ShoppingListContext = createContext();

export const useShoppingList = () => useContext(ShoppingListContext);

export const ShoppingListProvider = ({ children }) => {
	const [shoppingList, setShoppingList] = useState([]);

	const addItem = (item) => {
		setShoppingList((prevList) => [...prevList, item]);
	};

	const removeItem = (itemName) => {
		setShoppingList((prevList) =>
			prevList.filter((item) => item.name !== itemName)
		);
	};

	return (
		<ShoppingListContext.Provider
			value={{ shoppingList, addItem, removeItem }}
		>
			{children}
		</ShoppingListContext.Provider>
	);
};
