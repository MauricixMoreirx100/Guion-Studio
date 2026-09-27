import { ScriptBlock, ElementType, CharacterProfile, LocationItem } from '../types';

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

/**
 * Validates that a string is a legitimate character name (not punctuation, scene headings, or structural keywords)
 */
export function isValidCharacterName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim().toUpperCase();
  // Must not start with hyphens, periods, or punctuation
  if (/^[-–—./#@!?:;()_]/.test(trimmed)) return false;
  // Must not be or start with a scene heading keyword or camera/transition/act keyword
  if (/^(INT|EXT|INT\/EXT|I\/E|PLANO|TOMA|ANGULO|P\.O\.V\.|CAMARA|CORTE|FUNDIDO|DISOLVENCIA|FADE|CUT|ACTO|ACT)\b/i.test(trimmed)) {
    return false;
  }
  // Must contain at least two letters (not just symbols or digits)
  const letters = trimmed.replace(/[^A-ZÁÉÍÓÚÑ]/g, '');
  if (letters.length < 2) return false;
  return true;
}

/**
 * Prunes intermediate typing fragments and corrupt entries from character list.
 * e.g., if 'MAURICIO' is present, removes partial typing artifacts like 'MAUR', 'MAURI', 'MAURIC', 'MAURICI'.
 */
export function pruneIncompleteCharacterNames(characters: CharacterProfile[]): CharacterProfile[] {
  if (!characters || characters.length === 0) return [];

  // 1. Keep only entries with valid names
  const valid = characters.filter((c) => c && c.name && isValidCharacterName(c.name));

  // 2. Identify all character names in uppercase
  const upperNames = Array.from(new Set(valid.map((c) => c.name.trim().toUpperCase())));

  // 3. For any entry without custom notes/actor, check if it's a strict prefix of another name in the list
  return valid.filter((c) => {
    const name = c.name.trim().toUpperCase();
    // If the user entered custom notes, actor or description, preserve it
    if ((c.description && c.description.trim().length > 0) || (c.actorName && c.actorName.trim().length > 0) || (c.notes && c.notes.trim().length > 0)) {
      return true;
    }
    // If another name strictly longer starts with this name (e.g. 'MAUR' vs 'MAURICIO')
    const hasLongerVersion = upperNames.some(
      (other) => other.length > name.length && other.startsWith(name)
    );
    if (hasLongerVersion) {
      return false; // Prune incomplete prefix artifact
    }
    return true;
  });
}

/**
 * Checks if a string is a valid location name (not a placeholder, technical label, or incomplete symbol)
 */
export function isValidLocationName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim().toUpperCase();
  // Minimum length for a real location is 3 characters (e.g. BAR, RIO, MAR, PUB, SPA)
  if (trimmed.length < 3) return false;

  // Ban placeholder keywords (LUGAR, LOCATION, etc.) anywhere as words or prefixes
  if (/\b(LUGAR|LOCATION|LOCACION|LOCACIÓN|PLACE)\b/i.test(trimmed)) return false;

  // Ban partial typing artifacts that leaked into past sessions
  if (trimmed === 'LUA' || trimmed === 'LU' || trimmed === 'LUG' || trimmed === 'LUGA') return false;

  // Ban placeholder template phrases
  if (/\b(NUEVA LOCACIÓN|NUEVO LUGAR|MOMENTO DEL DÍA|MOMENTO DESPUÉS|TIEMPO)\b/i.test(trimmed)) return false;

  // Ban pure structural prefixes
  if (/^(INT|EXT|INT\/EXT|I\/E|\.INT|\.EXT)$/i.test(trimmed)) return false;

  // Ban pure time of day words
  const timeWords = ['DÍA', 'NOCHE', 'TARDE', 'AMANECER', 'ATARDECER', 'CONTINUO', 'DAY', 'NIGHT', 'MAÑANA', 'MOMENTO'];
  if (timeWords.includes(trimmed)) return false;

  // Cannot end with incomplete dashes, hyphens or punctuation
  if (/[-–—/\\:,;]$/.test(trimmed)) return false;

  // Must contain at least two alphanumeric characters
  const alphanumCount = (trimmed.match(/[A-Z0-9ÁÉÍÓÚÑ]/g) || []).length;
  if (alphanumCount < 2) return false;

  return true;
}

/**
 * Cleans a location name removing leading scene numbers, INT./EXT., and anything after the time separator '-'
 */
export function cleanLocationName(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toUpperCase();
  // Strip leading scene numbers (e.g., '1.', '12.')
  cleaned = cleaned.replace(/^\d+[\.\)]\s*/, '');
  // Strip leading INT./EXT. prefixes
  cleaned = cleaned.replace(/^[-–—]?\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.INT|\.EXT|\.I\/E|INT\s+|EXT\s+)\s*/i, '');
  // Strip everything after the first dash/hyphen (time of day or continuation)
  cleaned = cleaned.replace(/\s*[-–—].*$/, '');
  // Strip trailing time of day words even if typed without hyphen (e.g. 'LUGAR DÍA' -> 'LUGAR', 'GARDEN DÍA' -> 'GARDEN')
  cleaned = cleaned.replace(/\s+(DÍA|NOCHE|TARDE|AMANECER|ATARDECER|CONTINUO|MOMENTO DESPUÉS|MOMENTO DEL DÍA|DAY|NIGHT|MAÑANA)$/i, '');
  // Strip trailing punctuation
  cleaned = cleaned.replace(/[-–—.,:;/\\]+$/, '').trim();
  return cleaned;
}

/**
 * Prunes incomplete location name artifacts (e.g. 'LUG', 'LUGA' if 'LUGAR' exists, or 'MORELI' if 'MORELIA' exists),
 * purges unreferenced orphaned typing ghosts, and deduplicates entries.
 */
export function pruneIncompleteLocationNames(
  locations: LocationItem[],
  blocks?: ScriptBlock[]
): LocationItem[] {
  if (!locations || locations.length === 0) return [];

  // If script blocks are supplied, index all location names that actively exist in complete scene headings
  const referencedNames = new Set<string>();
  if (blocks && blocks.length > 0) {
    for (const b of blocks) {
      if (b.type === 'scene_heading' && b.content) {
        const raw = b.content.trim().toUpperCase();
        const isComplete = raw.includes(' - ') || raw.includes(' – ') || raw.includes(' — ') ||
          /(DÍA|NOCHE|TARDE|AMANECER|ATARDECER|CONTINUO|DAY|NIGHT)/i.test(raw);
        if (isComplete) {
          const clean = cleanLocationName(raw);
          if (clean && isValidLocationName(clean)) {
            referencedNames.add(clean.toUpperCase());
          }
        }
      }
    }
  }

  // 1. Clean names and filter invalid entries
  const cleanedMap = new Map<string, LocationItem>();
  for (const loc of locations) {
    if (!loc) continue;
    const cleanName = cleanLocationName(loc.name || '');
    if (!isValidLocationName(cleanName)) continue;

    const upper = cleanName.toUpperCase();

    // If blocks are provided: drop unreferenced location artifacts that have no custom user notes or filming details
    if (blocks && blocks.length > 0) {
      const hasCustomData = (loc.description && loc.description.trim().length > 0) ||
        (loc.realFilmingPlace && loc.realFilmingPlace.trim().length > 0) ||
        (loc.propsNeeded && loc.propsNeeded.length > 0);
      const isReferenced = referencedNames.has(upper);
      if (!hasCustomData && !isReferenced) {
        // Drop unreferenced orphaned typing ghost
        continue;
      }
    }

    if (!cleanedMap.has(upper)) {
      cleanedMap.set(upper, { ...loc, name: cleanName });
    } else {
      // If duplicate has richer custom user metadata, prefer it
      const existing = cleanedMap.get(upper)!;
      const hasMoreDetails = (loc.description && !existing.description) ||
        (loc.realFilmingPlace && !existing.realFilmingPlace);
      if (hasMoreDetails) {
        cleanedMap.set(upper, { ...loc, name: cleanName });
      }
    }
  }

  const list = Array.from(cleanedMap.values());
  const allNames = list.map((l) => l.name.toUpperCase());

  // 2. Prune prefix artifacts that do not have custom filming notes
  return list.filter((l) => {
    const name = l.name.toUpperCase();
    const hasCustomData = (l.description && l.description.trim().length > 0) ||
      (l.realFilmingPlace && l.realFilmingPlace.trim().length > 0) ||
      (l.propsNeeded && l.propsNeeded.length > 0);

    if (hasCustomData) return true;

    // If another name strictly starts with this name (e.g. 'LUGA' vs 'LUGAR')
    const hasLongerVersion = allNames.some(
      (other) => other.length > name.length && other.startsWith(name)
    );
    if (hasLongerVersion) {
      return false;
    }
    return true;
  });
}

/**
 * Parses raw text/Fountain into structured ScriptBlock elements
 */
export function parseFountainToBlocks(rawText: string): ScriptBlock[] {
  const lines = rawText.split('\n');
  const blocks: ScriptBlock[] = [];
  let sceneCounter = 1;
  let prevType: ElementType | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      prevType = null;
      continue;
    }

    // 0. Act Heading (ACTO I, ACT ONE, ACT 1, ACTO PRIMERO)
    const actRegex = /^(ACTO\s+[0-9IVXLCDM]+|ACT\s+[0-9IVXLCDM]+|ACT\s+ONE|ACT\s+TWO|ACT\s+THREE|ACT\s+FOUR|ACT\s+FIVE|ACTO\s+PRIMERO|ACTO\s+SEGUNDO|ACTO\s+TERCERO|ACTO\s+CUARTO|ACTO\s+QUINTO)$/i;
    if (actRegex.test(trimmed) || (trimmed.startsWith('#') && !trimmed.startsWith('##'))) {
      const actContent = trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed;
      blocks.push({
        id: generateId(),
        type: 'act',
        content: actContent.toUpperCase(),
      });
      prevType = 'act';
      continue;
    }

    // 1. Scene Heading / Locación (INT., EXT., INT/EXT., I/E., ., or -INT.)
    const sceneHeadingRegex = /^[-–—]?\s*(INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.INT|\.EXT|\.I\/E|[0-9]+\.\s*(INT|EXT)|INT\s|EXT\s|INT$|EXT$|INT\/EXT$|I\/E$)/i;
    if (sceneHeadingRegex.test(trimmed) || (trimmed.startsWith('.') && !trimmed.startsWith('..'))) {
      let content = trimmed.replace(/^[-–—]\s*/, '');
      if (content.startsWith('.')) {
        content = content.substring(1).trim();
      }
      blocks.push({
        id: generateId(),
        type: 'scene_heading',
        content: content.toUpperCase(),
        sceneNumber: sceneCounter++,
      });
      prevType = 'scene_heading';
      continue;
    }

    // 2. Transition (CORTE A:, FUNDIDO A:, FADE IN:, FADE OUT:, > text)
    const transitionRegex = /(CORTE A:|FUNDIDO A NEGRO:|FUNDIDO A BLANCO:|DISOLVENCIA A:|FADE IN:|FADE OUT:|FADE TO BLACK:|CUT TO:|DISSOLVE TO:)$/i;
    if (trimmed.startsWith('>') && trimmed.endsWith('<')) {
      blocks.push({
        id: generateId(),
        type: 'transition',
        content: trimmed.slice(1, -1).trim().toUpperCase(),
      });
      prevType = 'transition';
      continue;
    }
    if (trimmed.startsWith('>') && !trimmed.endsWith('<')) {
      blocks.push({
        id: generateId(),
        type: 'transition',
        content: trimmed.substring(1).trim().toUpperCase(),
      });
      prevType = 'transition';
      continue;
    }
    if (transitionRegex.test(trimmed)) {
      blocks.push({
        id: generateId(),
        type: 'transition',
        content: trimmed.toUpperCase(),
      });
      prevType = 'transition';
      continue;
    }

    // 3. Parenthetical / Acotación ((susurrando), (al teléfono))
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      blocks.push({
        id: generateId(),
        type: 'parenthetical',
        content: trimmed,
      });
      prevType = 'parenthetical';
      continue;
    }

    // 4. Character / Personaje (Explicit with @ or all caps short line or previous was not character/parenthetical and next is dialogue)
    const isExplicitChar = trimmed.startsWith('@');
    const isUpper = trimmed === trimmed.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(trimmed) && trimmed.length < 35 && !trimmed.endsWith('.');
    const isSceneOrStructural = /^(INT|EXT|INT\/EXT|I\/E|PLANO|TOMA|ANGULO|P\.O\.V\.|CAMARA|CORTE|FUNDIDO|DISOLVENCIA|FADE|CUT|ACTO|ACT)\b/i.test(trimmed);
    
    // Check if character candidates
    if (!isSceneOrStructural && (isExplicitChar || (isUpper && prevType !== 'character' && !trimmed.includes(' - ')))) {
      // If it looks like a shot
      if (trimmed.startsWith('PLANO ') || trimmed.startsWith('INSERT ') || trimmed.startsWith('ANGULO ')) {
        blocks.push({
          id: generateId(),
          type: 'shot',
          content: trimmed.toUpperCase(),
        });
        prevType = 'shot';
        continue;
      }

      const charName = isExplicitChar ? trimmed.substring(1).trim() : trimmed;
      if (isValidCharacterName(charName)) {
        blocks.push({
          id: generateId(),
          type: 'character',
          content: charName.toUpperCase(),
        });
        prevType = 'character';
        continue;
      }
    }

    // 5. Dialogue (comes right after character or parenthetical)
    if (prevType === 'character' || prevType === 'parenthetical') {
      blocks.push({
        id: generateId(),
        type: 'dialogue',
        content: trimmed,
      });
      prevType = 'dialogue';
      continue;
    }

    // 6. Default to Action
    blocks.push({
      id: generateId(),
      type: 'action',
      content: trimmed,
    });
    prevType = 'action';
  }

  // Renumber scenes sequentially
  let sc = 1;
  blocks.forEach(b => {
    if (b.type === 'scene_heading') {
      b.sceneNumber = sc++;
    }
  });

  return blocks;
}

/**
 * Serializes ScriptBlocks to standard Fountain text format
 */
export function blocksToFountain(blocks: ScriptBlock[], titlePage?: { title: string; writtenBy: string }): string {
  let output = '';

  if (titlePage && titlePage.title) {
    output += `Title: ${titlePage.title}\n`;
    if (titlePage.writtenBy) output += `Credit: Escrito por\nAuthor: ${titlePage.writtenBy}\n`;
    output += `Draft date: ${new Date().toLocaleDateString('es-ES')}\n\n`;
  }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    switch (b.type) {
      case 'act':
        output += `\n# ${b.content}\n\n`;
        break;
      case 'scene_heading':
        output += `\n${b.content}\n\n`;
        break;
      case 'character':
        output += `\n${b.content}\n`;
        break;
      case 'parenthetical':
        output += `${b.content}\n`;
        break;
      case 'dialogue':
        output += `${b.content}\n\n`;
        break;
      case 'transition':
        output += `\n> ${b.content}\n\n`;
        break;
      case 'shot':
        output += `\n.${b.content}\n\n`;
        break;
      case 'text':
        output += `${b.content}\n\n`;
        break;
      case 'note':
        output += `\n[[ ${b.content} ]]\n\n`;
        break;
      case 'action':
      default:
        output += `${b.content}\n\n`;
        break;
    }
  }

  return output.trim();
}

/**
 * Serializes ScriptBlocks to formatted Plain Text with explicit BOLD markers for characters and locations
 */
export function blocksToFormattedPlainText(blocks: ScriptBlock[]): string {
  let output = '';

  for (const b of blocks) {
    switch (b.type) {
      case 'act':
        output += `\n                        **${b.content}**\n\n`;
        break;
      case 'scene_heading':
        output += `\n**${b.content}**\n\n`;
        break;
      case 'character':
        output += `\n                   **${b.content}**\n`;
        break;
      case 'parenthetical':
        output += `                ${b.content}\n`;
        break;
      case 'dialogue':
        output += `          ${b.content}\n\n`;
        break;
      case 'transition':
        output += `\n                                                 **${b.content}**\n\n`;
        break;
      case 'shot':
        output += `\n**${b.content}**\n\n`;
        break;
      case 'text':
        output += `${b.content}\n\n`;
        break;
      case 'action':
      default:
        output += `${b.content}\n\n`;
        break;
    }
  }

  return output.trim();
}

/**
 * Automatically extracts unique Characters and Locations from script blocks
 */
export function extractMetadataFromBlocks(
  blocks: ScriptBlock[],
  existingCharacters: CharacterProfile[] = [],
  existingLocations: LocationItem[] = []
): { characters: CharacterProfile[]; locations: LocationItem[] } {
  const charMap = new Map<string, CharacterProfile>();
  const locMap = new Map<string, LocationItem>();

  // Identify all characters currently referenced in the blocks
  const currentBlockCharNames = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'character') {
      const rawName = b.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
      if (rawName && isValidCharacterName(rawName)) {
        currentBlockCharNames.add(rawName);
      }
    }
  }

  // Retain valid existing custom profile data only if it is still present in blocks or has explicit custom notes/actor
  const cleanedExisting = pruneIncompleteCharacterNames(existingCharacters);
  cleanedExisting.forEach(c => {
    const upper = c.name.trim().toUpperCase();
    const hasCustomDetails = Boolean(
      (c.description && c.description.trim().length > 0) ||
      (c.actorName && c.actorName.trim().length > 0) ||
      (c.notes && c.notes.trim().length > 0)
    );
    if (currentBlockCharNames.has(upper) || hasCustomDetails) {
      charMap.set(upper, c);
    }
  });

  // Retain valid existing custom location data (prunes any incomplete typing prefixes and duplicates, purges unreferenced artifacts)
  const cleanedExistingLocs = pruneIncompleteLocationNames(existingLocations, blocks);
  cleanedExistingLocs.forEach(l => {
    locMap.set(l.name.trim().toUpperCase(), l);
  });

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'character') {
      // Must be followed by dialogue or parenthetical+dialogue with non-empty text, OR already exist in charMap
      const nextBlock = blocks[i + 1];
      const hasDialogue = nextBlock && (
        (nextBlock.type === 'dialogue' && nextBlock.content.trim().length > 0) ||
        (nextBlock.type === 'parenthetical' && blocks[i + 2]?.type === 'dialogue' && blocks[i + 2]?.content.trim().length > 0)
      );

      // Clean character name from (V.O.), (O.S.), etc.
      const rawName = b.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
      if (rawName && isValidCharacterName(rawName)) {
        // Only add to charMap if it actually has dialogue or was already saved
        if (hasDialogue && !charMap.has(rawName)) {
          charMap.set(rawName, {
            id: generateId(),
            name: rawName,
            role: 'supporting',
            description: '',
            colorTag: getRandomTagColor(rawName),
          });
        }
      }
    }

    if (b.type === 'scene_heading') {
      // Parse INT./EXT., Location Name, Time of day
      const raw = b.content.trim().toUpperCase();
      let type: 'INT' | 'EXT' | 'INT/EXT' = 'INT';
      if (raw.startsWith('EXT.') || raw.startsWith('EXT ')) type = 'EXT';
      else if (raw.startsWith('INT/EXT.') || raw.startsWith('I/E.')) type = 'INT/EXT';

      let timeOfDay: 'DÍA' | 'NOCHE' | 'ATARDECER' | 'AMANECER' | 'CONTINUO' = 'DÍA';
      if (raw.includes('NOCHE')) timeOfDay = 'NOCHE';
      else if (raw.includes('ATARDECER')) timeOfDay = 'ATARDECER';
      else if (raw.includes('AMANECER')) timeOfDay = 'AMANECER';
      else if (raw.includes('CONTINUO')) timeOfDay = 'CONTINUO';

      // Extract cleaned place name
      const placeName = cleanLocationName(raw);

      // Only extract if it's a complete scene heading (contains a separator dash or time of day)
      // and is a valid location name (not an unfinished prefix or placeholder)
      const isCompleteHeading = raw.includes(' - ') || raw.includes(' – ') || raw.includes(' — ') ||
        raw.includes(' -') || raw.includes('- ') ||
        /(DÍA|NOCHE|TARDE|AMANECER|ATARDECER|CONTINUO|DAY|NIGHT)/i.test(raw);

      if (isCompleteHeading && isValidLocationName(placeName) && !locMap.has(placeName)) {
        locMap.set(placeName, {
          id: generateId(),
          name: placeName,
          type,
          timeOfDay,
          description: '',
          realFilmingPlace: '',
          propsNeeded: [],
        });
      }
    }
  }

  // Final prune pass to guarantee no lingering prefix artifacts for characters and locations
  const finalCharacters = pruneIncompleteCharacterNames(Array.from(charMap.values()));
  const finalLocations = pruneIncompleteLocationNames(Array.from(locMap.values()), blocks);

  return {
    characters: finalCharacters,
    locations: finalLocations,
  };
}

/**
 * Calculates script statistics (page count, estimated runtime, dialogue vs action ratio)
 */
export function calculateScriptStats(blocks: ScriptBlock[]): {
  pageCount: number;
  estimatedMinutes: number;
  totalWords: number;
  sceneCount: number;
  dialogueLines: number;
  characterLineCounts: Record<string, number>;
  locationSceneCounts: Record<string, number>;
  actionPercentage: number;
  dialoguePercentage: number;
} {
  let sceneCount = 0;
  let dialogueLines = 0;
  let actionLines = 0;
  let totalWords = 0;
  const characterLineCounts: Record<string, number> = {};
  const locationSceneCounts: Record<string, number> = {};

  let approximateLines = 0;

  for (const b of blocks) {
    const words = b.content.split(/\s+/).filter(Boolean).length;
    totalWords += words;

    switch (b.type) {
      case 'act':
        approximateLines += 4;
        break;
      case 'scene_heading':
        sceneCount++;
        approximateLines += 3;
        // Count location
        const loc = b.content.replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*/, '').split('-')[0].trim().toUpperCase();
        locationSceneCounts[loc] = (locationSceneCounts[loc] || 0) + 1;
        break;
      case 'text':
        approximateLines += Math.max(1, Math.ceil(b.content.length / 60)) + 1;
        break;
      case 'action':
        actionLines++;
        approximateLines += Math.max(1, Math.ceil(b.content.length / 60)) + 1;
        break;
      case 'character':
        const charName = b.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
        characterLineCounts[charName] = (characterLineCounts[charName] || 0) + 1;
        approximateLines += 1;
        break;
      case 'parenthetical':
        approximateLines += 1;
        break;
      case 'dialogue':
        dialogueLines++;
        approximateLines += Math.max(1, Math.ceil(b.content.length / 35)) + 1;
        break;
      case 'transition':
      case 'shot':
        approximateLines += 2;
        break;
      default:
        approximateLines += 1;
        break;
    }
  }

  // Standard Screenplay format has ~54-56 lines per page (1 page = 1 minute of screen time)
  const pageCount = Math.max(1, Math.ceil(approximateLines / 54));
  const estimatedMinutes = pageCount; // 1 page ≈ 1 minute

  const totalLines = (actionLines + dialogueLines) || 1;
  const actionPercentage = Math.round((actionLines / totalLines) * 100);
  const dialoguePercentage = Math.round((dialogueLines / totalLines) * 100);

  return {
    pageCount,
    estimatedMinutes,
    totalWords,
    sceneCount,
    dialogueLines,
    characterLineCounts,
    locationSceneCounts,
    actionPercentage,
    dialoguePercentage,
  };
}

function getRandomTagColor(str: string): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6366f1', // indigo
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
