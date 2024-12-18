import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { roundToTwoDecimalPlaces } from '../utils/utlityFunctions';

const RecipeDetailPDF = {
	generate: async (recipe) => {
		try {
			// Create HTML content for the PDF
			const htmlContent = `
                <html>
                    <head>
                        <style>
                            body { font-family: Helvetica; padding: 20px; }
                            h1 { color: #333333; font-size: 24px; }
                            h2 { color: #666666; font-size: 18px; margin-top: 20px; }
							img { height: 200px; width: '100%' }
                            p { font-size: 14px; line-height: 1.5; }
							.description-info { display: flex; align-items: center; justify-content: space-between; gap: 15px; }
                            .ingredient { margin: 5px 0; }
                            .nutritional-info { margin-top: 20px; }
                        </style>
                    </head>
                    <body>
						<div class="description-info">
							<h1>${recipe.recipeName}</h1>
							<img src=${recipe.recipePhotoUrl} alt="Recipe Image"></img>
						</div>
                        <p>Servings: ${recipe.yield}</p>
                        <p>Prep Time: ${recipe.prepTimeHour} hr ${
				recipe.prepTimeMin
			} min</p>
                        <p>Cook Time: ${recipe.cookTimeHour} hr ${
				recipe.cookTimeMin
			} min</p>
                        
                        <h2>Ingredients:</h2>
                        ${recipe.ingredients
							.map(
								(ingredient) => `
                            <p class="ingredient">• ${ingredient.amount} ${ingredient.unit} - ${ingredient.name}</p>
                        `
							)
							.join('')}
                        
                        <h2>Instructions:</h2>
                        <p>${recipe.instructions}</p>
                        
                        ${
							recipe.nutritionalData
								? `
                            <h2>Nutritional Information:</h2>
                            <div class="nutritional-info">
                                <p>Calories: ${
									recipe.nutritionalData.calories || 'N/A'
								}</p>
                                ${
									recipe.nutritionalData.totalNutrients
										? `
                                    <p>Fat: ${roundToTwoDecimalPlaces(
										recipe.nutritionalData.totalNutrients
											.FAT?.quantity || 0
									)} ${
												recipe.nutritionalData
													.totalNutrients.FAT?.unit ||
												''
										  }</p>
                                    <p>Protein: ${roundToTwoDecimalPlaces(
										recipe.nutritionalData.totalNutrients
											.PROCNT?.quantity || 0
									)} ${
												recipe.nutritionalData
													.totalNutrients.PROCNT
													?.unit || ''
										  }</p>
                                    <p>Cholesterol: ${roundToTwoDecimalPlaces(
										recipe.nutritionalData.totalNutrients
											.CHOLE?.quantity || 0
									)} ${
												recipe.nutritionalData
													.totalNutrients.CHOLE
													?.unit || ''
										  }</p>
                                    <p>Sodium: ${roundToTwoDecimalPlaces(
										recipe.nutritionalData.totalNutrients.NA
											?.quantity || 0
									)} ${
												recipe.nutritionalData
													.totalNutrients.NA?.unit ||
												''
										  }</p>
                                `
										: ''
								}
                            </div>
                        `
								: ''
						}
                    </body>
                </html>
            `;

			// Generate the PDF using expo-print
			const { uri } = await Print.printToFileAsync({
				html: htmlContent,
			});

			// Share the PDF file if sharing is available
			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(uri, {
					mimeType: 'application/pdf',
					dialogTitle: `${recipe.recipeName} Recipe`,
					UTI: 'com.adobe.pdf',
				});
			} else {
				throw new Error('Sharing is not available on this device');
			}

			// Return the PDF URI and file name
			return {
				filePath: uri,
				fileName: `${recipe.recipeName} Recipe`,
			};
		} catch (error) {
			throw new Error(`Failed to generate PDF: ${error.message}`);
		}
	},
};

export default RecipeDetailPDF;
