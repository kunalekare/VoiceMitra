export interface SkillDefinition {
  canonical: string;
  category: 'construction' | 'maintenance' | 'automotive' | 'household' | 'specialized';
  hindiName: string;
  marathiName: string;
  tamilName: string;
  synonyms: string[];
  baseDailyWageInr: number;
  iconName: string;
  description: string;
}

export const CANONICAL_SKILLS: SkillDefinition[] = [
  {
    canonical: 'Electrician',
    category: 'maintenance',
    hindiName: 'इलेक्ट्रीशियन / बिजली मिस्त्री',
    marathiName: 'इलेक्ट्रिशियन / वीज मिस्त्री',
    tamilName: 'எலக்ட்ரீஷியன்',
    synonyms: ['bijli mistri', 'bijliwala', 'wireman', 'electrical', 'wiring', 'fuse', 'electric', 'inverter repair', 'light fitting'],
    baseDailyWageInr: 850,
    iconName: 'Zap',
    description: 'Home wiring, switchboards, MCB, inverter setup, appliances and safety earthing'
  },
  {
    canonical: 'Plumber',
    category: 'maintenance',
    hindiName: 'प्लंबर / नल मिस्त्री',
    marathiName: 'प्लंबर / नळ कामगार',
    tamilName: 'பிளம்பர் / குழாய் வேலை',
    synonyms: ['nal mistri', 'plumbing', 'pipe fitter', 'pipe line', 'tap repair', 'sanitary fitting', 'water tank', 'leakage repair'],
    baseDailyWageInr: 800,
    iconName: 'Droplet',
    description: 'Pipe fittings, water leakages, bathroom fixtures, overhead tanks and pumps'
  },
  {
    canonical: 'Mason',
    category: 'construction',
    hindiName: 'राजमिस्त्री / चुनाई कामगार',
    marathiName: 'गवंडी / राजमिस्त्री',
    tamilName: 'கொத்தனார் / மேசன்',
    synonyms: ['raj mistri', 'rajmistri', 'bricklayer', 'cement worker', 'plaster', 'gavandi', 'concrete', 'construction karigar'],
    baseDailyWageInr: 950,
    iconName: 'Hammer',
    description: 'Brickwork, cement plastering, boundary walls, foundation and structural repairs'
  },
  {
    canonical: 'Painter',
    category: 'construction',
    hindiName: 'पेंटर / रंगाई मिस्त्री',
    marathiName: 'रंगारी / पेंटर',
    tamilName: 'பெயிண்டர் / வர்ண வேலை',
    synonyms: ['rangari', 'paint mistri', 'wall painting', 'putty', 'primer', 'distemper', 'wood polish', 'texture paint', 'colouring'],
    baseDailyWageInr: 750,
    iconName: 'Paintbrush',
    description: 'Interior & exterior wall painting, POP putty, waterproof coating and wood polish'
  },
  {
    canonical: 'Carpenter',
    category: 'construction',
    hindiName: 'बढ़ई / सुथार',
    marathiName: 'सुतार / लाकूड कामगार',
    tamilName: 'தச்சர் / கார்பெண்டர்',
    synonyms: ['badhai', 'sutar', 'sutradhar', 'woodworker', 'furniture maker', 'door fitting', 'cupboard repair', 'plywood'],
    baseDailyWageInr: 900,
    iconName: 'Axe',
    description: 'Custom furniture, door & window hinges, modular kitchen repairs and woodwork'
  },
  {
    canonical: 'Welder',
    category: 'construction',
    hindiName: 'वेल्डर / फैब्रिकेशन',
    marathiName: 'वेल्डर / फॅब्रिकेशन कामगार',
    tamilName: 'வெல்டர் / இரும்பு வேலை',
    synonyms: ['fabrication', 'loha mistri', 'iron grill', 'arc welding', 'gate repair', 'steel fabrication', 'tin shed'],
    baseDailyWageInr: 850,
    iconName: 'Flame',
    description: 'Iron gates, balcony grills, tin sheds, steel frames and structural arc welding'
  },
  {
    canonical: 'Driver',
    category: 'automotive',
    hindiName: 'ड्राइवर / गाड़ी चालक',
    marathiName: 'ड्रायव्हर / चालक',
    tamilName: 'டிரைவர் / ஓட்டுநர்',
    synonyms: ['gaadi chalak', 'chauffeur', 'car driver', 'truck driver', 'tempo driver', 'auto driver', 'heavy vehicle'],
    baseDailyWageInr: 750,
    iconName: 'Car',
    description: 'Personal car, tempo transport, outstation trips, manual & automatic vehicles'
  },
  {
    canonical: 'Domestic Help',
    category: 'household',
    hindiName: 'घरेलू सहायिका / कामवाली',
    marathiName: 'घरकामगार / कामवाली बाई',
    tamilName: 'வீட்டு வேலை / சமையல்',
    synonyms: ['kamwali', 'kamwali bai', 'housekeeper', 'safai kamgar', 'maid', 'cook', 'sweeper', ' बर्तन सफाई'],
    baseDailyWageInr: 600,
    iconName: 'Home',
    description: 'Home deep cleaning, dusting, dishwashing, laundry, and daily cooking assistance'
  },
  {
    canonical: 'AC Technician',
    category: 'specialized',
    hindiName: 'एसी मैकेनिक / कूलिंग तकनीशियन',
    marathiName: 'एसी मेकॅनिक / शीतकरण तंत्रज्ञ',
    tamilName: 'ஏசி மெக்கானிக்',
    synonyms: ['ac repair', 'air conditioner', 'gas charging', 'split ac', 'window ac', 'fridge repair', 'refrigerator'],
    baseDailyWageInr: 1000,
    iconName: 'Wind',
    description: 'AC gas refill, compressor inspection, filter deep jet cleaning and split install'
  },
  {
    canonical: 'Tile & Marble Setter',
    category: 'construction',
    hindiName: 'टाइल व मार्बल मिस्त्री',
    marathiName: 'टाइल व मार्बल कारागीर',
    tamilName: 'டைல்ஸ் / மார்பிள் வேலை',
    synonyms: ['tile mistri', 'marble worker', 'granite fitting', 'flooring', 'grouting', 'stone polishing'],
    baseDailyWageInr: 950,
    iconName: 'Grid',
    description: 'Ceramic tiles, vitrified flooring, kitchen granite counter, and marble polish'
  },
  {
    canonical: 'Gardener',
    category: 'household',
    hindiName: 'माली / बागवानी कामगार',
    marathiName: 'माळी / बागकामगार',
    tamilName: 'தோட்டக்காரர் / மாலி',
    synonyms: ['mali', 'bagwan', 'gardening', 'lawn trimming', 'plant nursery', 'tree pruning'],
    baseDailyWageInr: 650,
    iconName: 'Sprout',
    description: 'Lawn maintenance, terrace garden setup, pruning, fertilizers and seasonal flowers'
  },
  {
    canonical: 'Appliance Repair',
    category: 'maintenance',
    hindiName: 'होम अप्लायंस रिपेयर',
    marathiName: 'घरगुती उपकरणे दुरुस्ती',
    tamilName: 'மின்சாதன பழுதுபார்ப்பு',
    synonyms: ['washing machine', 'geyser repair', 'microwave', 'tv repair', 'water purifier', 'ro repair'],
    baseDailyWageInr: 800,
    iconName: 'Cpu',
    description: 'Geyser elements, washing machine motor, RO membrane and microwave servicing'
  }
];

// Levenshtein distance for fuzzy matching
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

// Similarity ratio 0.0 to 1.0
export function stringSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1.includes(str2) || str2.includes(str1)) {
    const longer = Math.max(str1.length, str2.length);
    const shorter = Math.min(str1.length, str2.length);
    return Math.max(0.75, shorter / longer);
  }
  const maxLen = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);
  return Math.max(0, 1 - distance / maxLen);
}

// Normalize any user-spoken or typed skill input against canonical taxonomy
export function normalizeSkill(rawInput: string): {
  canonical: string;
  confidence: number;
  matchedVia: 'exact' | 'synonym' | 'fuzzy' | 'fallback';
} {
  if (!rawInput || !rawInput.trim()) {
    return { canonical: 'General Maintenance', confidence: 0.5, matchedVia: 'fallback' };
  }
  const clean = rawInput.trim().toLowerCase();

  // 1. Exact match against canonical
  for (const s of CANONICAL_SKILLS) {
    if (s.canonical.toLowerCase() === clean) {
      return { canonical: s.canonical, confidence: 1.0, matchedVia: 'exact' };
    }
  }

  // 2. Direct match in synonyms
  for (const s of CANONICAL_SKILLS) {
    for (const syn of s.synonyms) {
      if (syn.toLowerCase() === clean || clean.includes(syn.toLowerCase()) || syn.toLowerCase().includes(clean)) {
        return { canonical: s.canonical, confidence: 0.95, matchedVia: 'synonym' };
      }
    }
  }

  // 3. Multilingual native name substring check
  for (const s of CANONICAL_SKILLS) {
    if (
      s.hindiName.includes(rawInput) ||
      s.marathiName.includes(rawInput) ||
      s.tamilName.includes(rawInput)
    ) {
      return { canonical: s.canonical, confidence: 0.92, matchedVia: 'synonym' };
    }
  }

  // 4. Fuzzy Levenshtein match across canonical and synonyms
  let bestCanonical = CANONICAL_SKILLS[0].canonical;
  let bestScore = 0;

  for (const s of CANONICAL_SKILLS) {
    const canonicalScore = stringSimilarity(clean, s.canonical);
    if (canonicalScore > bestScore) {
      bestScore = canonicalScore;
      bestCanonical = s.canonical;
    }
    for (const syn of s.synonyms) {
      const synScore = stringSimilarity(clean, syn);
      if (synScore > bestScore) {
        bestScore = synScore;
        bestCanonical = s.canonical;
      }
    }
  }

  if (bestScore >= 0.55) {
    return {
      canonical: bestCanonical,
      confidence: Math.round(bestScore * 100) / 100,
      matchedVia: 'fuzzy'
    };
  }

  // Capitalize raw input as fallback
  const fallback = rawInput.charAt(0).toUpperCase() + rawInput.slice(1);
  return { canonical: fallback, confidence: 0.5, matchedVia: 'fallback' };
}
