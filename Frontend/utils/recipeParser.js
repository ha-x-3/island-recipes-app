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

// No spaces here — spaces in mixed numbers like "1 1/2" are handled by parseFraction
const NUM_CHARS = '[\\d½¼¾⅓⅔⅛⅜⅝⅞\\/\\.]';

// Containers that commonly appear after a size descriptor ("1 28 oz. can")
const CONTAINER_RE = /^(cans?|packages?|pkg|jars?|bags?|boxes?|bottles?|bunches?|pouches?)$/i;

const SECTION_RE = /^(ingredients?|instructions?|directions?|method|preparation|steps?|notes?|for the\b)/i;

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

	// Pattern 0: count + size-spec + container  ("1 28 oz. can of petite diced tomatoes")
	// Handles the case where a size descriptor precedes the actual container unit.
	const sizeUnitRe = /oz\.?|ounces?|g|grams?|ml|milliliters?|lbs?|pounds?/i;
	const countSizeContainer = line.match(
		new RegExp(
			`^(\\d+)\\s+(${NUM_CHARS}+)\\s*(${sizeUnitRe.source})\\.?\\s*(cans?|packages?|pkg|jars?|bags?|boxes?|bottles?|bunches?|pouches?)\\s+(?:of\\s+)?(.+)$`,
			'i'
		)
	);
	if (countSizeContainer) {
		const sizeLabel = `${countSizeContainer[2].trim()} ${countSizeContainer[3].replace(/\.$/, '')}`;
		const rawName = countSizeContainer[5].replace(/\s*[,;(].*$/, '').trim();
		if (rawName) {
			return {
				amount: parseInt(countSizeContainer[1]),
				unit: countSizeContainer[4].toLowerCase(),
				name: `${sizeLabel} ${rawName}`,
			};
		}
	}

	// Pattern A: number + unit + name  ("2 cups flour", "1½ tsp salt")
	const withUnit = line.match(
		new RegExp(`^(${NUM_CHARS}+(?:\\s+\\d+\\s*\\/\\s*\\d+)?)\\s+(${UNIT_PATTERN})\\.?[\\s,]+(.*?)\\s*$`, 'i')
	);
	if (withUnit) {
		const name = withUnit[3].replace(/\s*[,;(].*$/, '').trim();
		if (name) {
			return { amount: parseFraction(withUnit[1]), unit: withUnit[2].toLowerCase(), name };
		}
	}

	// Pattern B: number + name, no unit  ("2 eggs", "3 large onions", "4 chicken thighs")
	const noUnit = line.match(new RegExp(`^(${NUM_CHARS}+(?:\\s+\\d+\\s*\\/\\s*\\d+)?)\\s+(?!${UNIT_PATTERN}\\b)(.+)$`, 'i'));
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

// Splits and re-numbers instruction steps so each step is on its own line.
// Handles OCR output that collapses multiple steps onto a single line.
function formatInstructions(lines) {
	const expanded = [];
	for (const line of lines) {
		// Split on embedded step markers like "2. " or "2) " appearing mid-sentence
		const parts = line.split(/\s+(?=\d+[\.\)]\s)/);
		expanded.push(...parts.map(s => s.trim()).filter(Boolean));
	}

	const steps = expanded
		.map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[\-•*·–—○◦▸►✓✗]\s*/, '').trim())
		.filter(Boolean);

	return steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
}

function parseRecipeText(text) {
	const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

	const recipeName =
		lines.find(l => l.length > 3 && !SECTION_RE.test(l) && !/^\d/.test(l)) ??
		'Imported Recipe';

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

	const ingIdx = lines.findIndex(l => /^ingredients?/i.test(l));
	const dirIdx = lines.findIndex(l => /^(instructions?|directions?|method|steps?)/i.test(l));
	const inSection = ingIdx >= 0;

	const ingLines = inSection
		? lines.slice(ingIdx + 1, dirIdx > ingIdx ? dirIdx : undefined)
		: lines;

	const ingredients = extractIngredients(ingLines, inSection);

	const instructionLines = dirIdx >= 0 ? lines.slice(dirIdx + 1) : [];
	const instructions = formatInstructions(instructionLines);

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
