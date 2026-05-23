import axios from 'axios';

const OCR_URL = 'https://api.ocr.space/parse/image';

const FRACTION_MAP = {
	'½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3,
	'⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

const UNIT_PATTERN = [
	'cups?', 'tbsp', 'tablespoons?', 'tsp', 'teaspoons?',
	'fluid oz', 'fl\\.? oz', 'oz', 'ounces?',
	'lbs?', 'pounds?', 'grams?', 'g', 'kg',
	'ml', 'milliliters?', 'liters?', 'l',
	'cloves?', 'bunches?', 'slices?', 'pieces?',
	'pinch(?:es)?', 'dash(?:es)?', 'handfuls?',
	'cans?', 'packages?', 'pkg', 'sticks?', 'heads?', 'sprigs?',
	'stalks?', 'links?', 'fillets?', 'strips?',
].join('|');

const NUM_CHARS = '[\\d½¼¾⅓⅔⅛⅜⅝⅞\\/\\.\\s]';

const SECTION_RE = /^(ingredients?|instructions?|directions?|method|preparation|steps?|notes?|for the\b)/i;

// Verbs that signal we've crossed into instructions territory
const VERB_RE = /^(preheat|combine|mix|stir|add|heat|cook|bake|boil|simmer|chop|dice|slice|pour|place|set|bring|remove|let|allow|season|serve|transfer|spread|whisk|beat|fold|drain|rinse|crush|mince|grate|shred|coat|cover|refrigerate|freeze|toast|roast|sauté|saute|fry|grill)/i;

function cleanLine(line) {
	return line
		.replace(/^[\-\•\*\·\–\—○◦▸►✓✗]\s*/, '')  // bullets
		.replace(/^\d+[\.\)]\s+/, '')                 // numbered list markers
		.replace(/\s+/g, ' ')
		.trim();
}

function parseFraction(str) {
	str = str.trim();
	for (const [char, val] of Object.entries(FRACTION_MAP)) {
		str = str.replace(char, String(val));
	}
	const mixed = str.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
	if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
	const simple = str.match(/^(\d+)\s*\/\s*(\d+)$/);
	if (simple) return parseInt(simple[1]) / parseInt(simple[2]);
	return parseFloat(str) || 0;
}

function extractTime(text, patterns) {
	for (const re of patterns) {
		const m = text.match(re);
		if (!m) continue;
		const hours = parseInt(m[1] || 0);
		const minutes = parseInt(m[2] || m[3] || 0);
		if (hours > 0 || minutes > 0) return { hours, minutes };
	}
	return { hours: 0, minutes: 0 };
}

function extractServings(text) {
	const m = text.match(/(?:serves|servings?|yields?|makes|portions?)[:\s]+(\d+)/i);
	return m ? parseInt(m[1]) : 4;
}

function parseIngredientLine(line, inSection) {
	line = cleanLine(line);
	if (!line || line.length < 2) return null;

	// Pattern A: number + unit + name  ("2 cups flour", "1½ tsp salt")
	const withUnit = line.match(
		new RegExp(`^(${NUM_CHARS}+?)\\s+(${UNIT_PATTERN})\\.?[\\s,]+(.*?)\\s*$`, 'i')
	);
	if (withUnit) {
		const name = withUnit[3].replace(/\s*[,;(].*$/, '').trim();
		if (name) {
			return { amount: parseFraction(withUnit[1]), unit: withUnit[2].toLowerCase(), name };
		}
	}

	// Pattern B: number + name, no unit  ("2 eggs", "3 large onions", "4 chicken thighs")
	const noUnit = line.match(new RegExp(`^(${NUM_CHARS}+?)\\s+(?!${UNIT_PATTERN}\\b)(.+)$`, 'i'));
	if (noUnit) {
		const amount = parseFraction(noUnit[1]);
		if (amount > 0) {
			const name = noUnit[2].replace(/\s*[,;(].*$/, '').trim();
			if (name && !VERB_RE.test(name)) {
				return { amount, unit: 'whole', name };
			}
		}
	}

	// Pattern C: no number  ("salt to taste", "fresh parsley, for garnish")
	// Only apply confidently inside the ingredients section and for short lines
	if (inSection && line.length < 60 && !SECTION_RE.test(line) && !VERB_RE.test(line)) {
		return { amount: 1, unit: 'to taste', name: line.replace(/\s*[,;(].*$/, '').trim() };
	}

	return null;
}

function extractIngredients(lines, inSection) {
	const results = [];
	for (const line of lines) {
		if (!line.trim() || SECTION_RE.test(line.trim())) continue;
		const ingredient = parseIngredientLine(line, inSection);
		if (ingredient?.name) results.push(ingredient);
	}
	return results;
}

function parseRecipeText(text) {
	const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

	// Recipe name: first meaningful non-header line
	const recipeName =
		lines.find(l => l.length > 3 && !SECTION_RE.test(l) && !/^\d/.test(l)) ??
		'Imported Recipe';

	// Times — try multiple keyword variations
	const prepTime = extractTime(text, [
		/prep(?:aration)?\s*time[:\s]+(?:(\d+)\s*(?:hr?s?|hours?)[\s,]*)?(?:(\d+)\s*(?:mins?|minutes?))?/i,
		/prep(?:aration)?\s*time[:\s]+(\d+)\s*(?:hr?s?|hours?)/i,
		/prep(?:aration)?[:\s]+(?:(\d+)\s*(?:hr?s?|hours?)[\s,]*)?(?:(\d+)\s*(?:mins?|minutes?))/i,
	]);

	const cookTime = extractTime(text, [
		/cook(?:ing)?\s*time[:\s]+(?:(\d+)\s*(?:hr?s?|hours?)[\s,]*)?(?:(\d+)\s*(?:mins?|minutes?))?/i,
		/cook(?:ing)?\s*time[:\s]+(\d+)\s*(?:hr?s?|hours?)/i,
		/bak(?:e|ing)\s*time[:\s]+(?:(\d+)\s*(?:hr?s?|hours?)[\s,]*)?(?:(\d+)\s*(?:mins?|minutes?))?/i,
		/cook(?:ing)?[:\s]+(?:(\d+)\s*(?:hr?s?|hours?)[\s,]*)?(?:(\d+)\s*(?:mins?|minutes?))/i,
	]);

	// Find section boundaries
	const ingIdx = lines.findIndex(l => /^ingredients?/i.test(l));
	const dirIdx = lines.findIndex(l => /^(instructions?|directions?|method|steps?)/i.test(l));
	const inSection = ingIdx >= 0;

	const ingLines = inSection
		? lines.slice(ingIdx + 1, dirIdx > ingIdx ? dirIdx : undefined)
		: lines;

	const ingredients = extractIngredients(ingLines, inSection);

	// Instructions: join numbered steps with newlines, preserving step numbers
	const instructionLines = dirIdx >= 0 ? lines.slice(dirIdx + 1) : [];
	const instructions = instructionLines.join('\n');

	return {
		recipeName,
		yield: extractServings(text),
		prepTimeHour: prepTime.hours,
		prepTimeMin: prepTime.minutes,
		cookTimeHour: cookTime.hours,
		cookTimeMin: cookTime.minutes,
		ingredients: ingredients.length > 0 ? ingredients : [{ name: '', amount: '', unit: '' }],
		instructions,
	};
}

export async function parseRecipeFromImage(base64Image, mimeType = 'image/jpeg') {
	const formData = new FormData();
	formData.append('apikey', process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY);
	formData.append('base64Image', `data:${mimeType};base64,${base64Image}`);
	formData.append('language', 'eng');
	formData.append('isOverlayRequired', 'false');
	formData.append('detectOrientation', 'true');
	formData.append('scale', 'true');
	formData.append('OCREngine', '2');

	const response = await axios.post(OCR_URL, formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});

	if (response.data.IsErroredOnProcessing) {
		throw new Error(response.data.ParsedResults?.[0]?.ErrorMessage ?? 'OCR failed');
	}

	const text = response.data.ParsedResults?.[0]?.ParsedText ?? '';
	if (!text.trim()) throw new Error('No text found in image');

	return parseRecipeText(text);
}
