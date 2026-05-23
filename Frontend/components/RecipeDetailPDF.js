import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { roundToTwoDecimalPlaces } from '../utils/utlityFunctions';

const PRIMARY = '#02A99D';
const PRIMARY_LIGHT = '#EBF4F3';
const PRIMARY_BORDER = '#B2DDD9';
const DARK_TEXT = '#232B2A';
const MEDIUM_TEXT = '#4A5250';
const LIGHT_TEXT = '#6B7775';
const SURFACE = '#F2F8F7';

const buildHtml = (recipe) => {
	const servings = recipe.yield || 1;

	const totalMinutes =
		recipe.prepTimeHour * 60 +
		recipe.prepTimeMin +
		recipe.cookTimeHour * 60 +
		recipe.cookTimeMin;
	const timeLabel =
		totalMinutes >= 60
			? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
			: `${totalMinutes}m`;

	const tagsHtml =
		recipe.tags?.length > 0
			? `<div class="tags">${recipe.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>`
			: '';

	const nutritionHtml = recipe.nutritionalData
		? `
		<p class="section-title">Nutrition per Serving</p>
		<div class="nutrition-grid">
			<div class="nutrition-card">
				<span class="nutrition-value">${
					recipe.nutritionalData.calories
						? Math.round(recipe.nutritionalData.calories / servings)
						: '—'
				}</span>
				<span class="nutrition-label">Calories</span>
			</div>
			${
				recipe.nutritionalData.totalNutrients
					? `
			<div class="nutrition-card">
				<span class="nutrition-value">${roundToTwoDecimalPlaces(
					(recipe.nutritionalData.totalNutrients.FAT?.quantity || 0) / servings
				)}${recipe.nutritionalData.totalNutrients.FAT?.unit || ''}</span>
				<span class="nutrition-label">Fat</span>
			</div>
			<div class="nutrition-card">
				<span class="nutrition-value">${roundToTwoDecimalPlaces(
					(recipe.nutritionalData.totalNutrients.PROCNT?.quantity || 0) / servings
				)}${recipe.nutritionalData.totalNutrients.PROCNT?.unit || ''}</span>
				<span class="nutrition-label">Protein</span>
			</div>
			<div class="nutrition-card">
				<span class="nutrition-value">${roundToTwoDecimalPlaces(
					(recipe.nutritionalData.totalNutrients.CHOLE?.quantity || 0) / servings
				)}${recipe.nutritionalData.totalNutrients.CHOLE?.unit || ''}</span>
				<span class="nutrition-label">Cholesterol</span>
			</div>
			<div class="nutrition-card">
				<span class="nutrition-value">${roundToTwoDecimalPlaces(
					(recipe.nutritionalData.totalNutrients.NA?.quantity || 0) / servings
				)}${recipe.nutritionalData.totalNutrients.NA?.unit || ''}</span>
				<span class="nutrition-label">Sodium</span>
			</div>`
					: ''
			}
		</div>`
		: '';

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>${recipe.recipeName} — Island Recipes</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body { font-family: Helvetica, Arial, sans-serif; background: #fff; color: ${DARK_TEXT}; }

		.hero { position: relative; width: 100%; height: 260px; }
		.hero img { width: 100%; height: 260px; object-fit: cover; display: block; }
		.hero-overlay {
			position: absolute; bottom: 0; left: 0; right: 0;
			background: linear-gradient(transparent, rgba(0,0,0,0.65));
			padding: 32px 28px 22px;
		}
		.hero-overlay h1 { color: #fff; font-size: 26px; font-weight: 700; line-height: 1.2; }

		.tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 28px 0; }
		.tag {
			background: ${PRIMARY}; color: #fff;
			border-radius: 20px; padding: 4px 14px;
			font-size: 11px; font-weight: 600;
		}

		.meta-bar {
			display: flex; justify-content: space-around; align-items: center;
			margin: 20px 28px; background: ${SURFACE}; border-radius: 14px; padding: 16px 8px;
		}
		.meta-item { text-align: center; flex: 1; }
		.meta-value { font-size: 17px; font-weight: 700; color: ${PRIMARY}; display: block; }
		.meta-label { font-size: 10px; color: ${LIGHT_TEXT}; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 2px; }
		.meta-divider { width: 1px; height: 36px; background: #DDE8E7; }

		.section-title {
			font-size: 15px; font-weight: 700; color: ${DARK_TEXT};
			border-left: 4px solid ${PRIMARY}; padding-left: 10px;
			margin: 24px 28px 12px;
		}

		.ingredients { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 28px; }
		.ingredient-chip {
			background: ${PRIMARY_LIGHT}; border: 1px solid ${PRIMARY_BORDER};
			border-radius: 20px; padding: 6px 14px;
			font-size: 13px; color: ${DARK_TEXT};
		}

		.instructions {
			font-size: 14px; line-height: 1.8; color: ${MEDIUM_TEXT};
			margin: 0 28px; white-space: pre-line;
		}

		.nutrition-grid { display: flex; gap: 10px; padding: 0 28px; flex-wrap: wrap; }
		.nutrition-card {
			background: ${PRIMARY_LIGHT}; border-radius: 12px; padding: 14px 16px;
			text-align: center; flex: 1; min-width: 80px;
		}
		.nutrition-value { font-size: 17px; font-weight: 700; color: ${PRIMARY}; display: block; }
		.nutrition-label { font-size: 10px; color: ${LIGHT_TEXT}; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }

		.footer {
			text-align: center; margin: 36px 28px 28px;
			font-size: 11px; color: #bbb;
			border-top: 1px solid #eee; padding-top: 16px;
		}
	</style>
</head>
<body>
	<div class="hero">
		<img src="${recipe.recipePhotoUrl}" alt="${recipe.recipeName}">
		<div class="hero-overlay">
			<h1>${recipe.recipeName}</h1>
		</div>
	</div>

	${tagsHtml}

	<div class="meta-bar">
		<div class="meta-item">
			<span class="meta-value">${servings}</span>
			<span class="meta-label">Servings</span>
		</div>
		<div class="meta-divider"></div>
		<div class="meta-item">
			<span class="meta-value">${timeLabel}</span>
			<span class="meta-label">Total Time</span>
		</div>
		<div class="meta-divider"></div>
		<div class="meta-item">
			<span class="meta-value">${recipe.prepTimeHour}h ${recipe.prepTimeMin}m</span>
			<span class="meta-label">Prep</span>
		</div>
		<div class="meta-divider"></div>
		<div class="meta-item">
			<span class="meta-value">${recipe.cookTimeHour}h ${recipe.cookTimeMin}m</span>
			<span class="meta-label">Cook</span>
		</div>
	</div>

	<p class="section-title">Ingredients</p>
	<div class="ingredients">
		${recipe.ingredients.map((i) => `<span class="ingredient-chip">${i.amount} ${i.unit} ${i.name}</span>`).join('')}
	</div>

	<p class="section-title">Instructions</p>
	<p class="instructions">${recipe.instructions}</p>

	${nutritionHtml}

	<div class="footer">Island Recipes</div>
</body>
</html>`;
};

const RecipeDetailPDF = {
	preview: async (recipe) => {
		await Print.printAsync({ html: buildHtml(recipe) });
	},

	generate: async (recipe) => {
		try {
			const { uri } = await Print.printToFileAsync({ html: buildHtml(recipe) });
			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(uri, {
					mimeType: 'application/pdf',
					dialogTitle: `${recipe.recipeName} — Island Recipes`,
					UTI: 'com.adobe.pdf',
				});
			} else {
				throw new Error('Sharing is not available on this device');
			}
			return { filePath: uri, fileName: `${recipe.recipeName} — Island Recipes` };
		} catch (error) {
			throw new Error(`Failed to generate PDF: ${error.message}`);
		}
	},
};

export default RecipeDetailPDF;
