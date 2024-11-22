// Rounds a number to two decimal places
export const roundToTwoDecimalPlaces = (number) => {
	return Number.isNaN(number) ? 'N/A' : Number(number).toFixed(2);
};
