export const PROTEIN_TAGS = ['Chicken', 'Beef', 'Pork', 'Seafood', 'Lamb', 'Turkey', 'Vegetarian'];
export const MEAL_TYPE_TAGS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Appetizer'];
export const DIET_TAGS = ['Vegan', 'Gluten-Free'];
export const STYLE_TAGS = ['Quick', 'Grilled', 'Baked', 'Slow Cooker'];

export const TAG_GROUPS = [
	{ label: 'Protein', tags: PROTEIN_TAGS },
	{ label: 'Meal Type', tags: MEAL_TYPE_TAGS },
	{ label: 'Diet', tags: DIET_TAGS },
	{ label: 'Style', tags: STYLE_TAGS },
];

export const ALL_PRESET_TAGS = [...PROTEIN_TAGS, ...MEAL_TYPE_TAGS, ...DIET_TAGS, ...STYLE_TAGS];
