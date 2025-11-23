// Common lab test names in Spanish and English with expected value ranges for validation
const LAB_TEST_PATTERNS: Record<string, {
  name: string;
  unit: string;
  normalRange?: { min: number; max: number };
  maxReasonableValue: number; // Maximum reasonable value - STRICT LIMIT
  minReasonableValue?: number; // Minimum reasonable value
}> = {
  // Hemograma
  'hemoglobina|hemoglobin|hgb|hb': { name: 'Hemoglobina', unit: 'g/dL', normalRange: { min: 12.0, max: 16.0 }, maxReasonableValue: 20.0, minReasonableValue: 8.0 },
  'hematocrito|hematocrit|hct': { name: 'Hematocrito', unit: '%', normalRange: { min: 36.0, max: 48.0 }, maxReasonableValue: 60.0, minReasonableValue: 25.0 },
  'glóbulos rojos|rbc|red blood cells|eritrocitos': { name: 'Glóbulos Rojos', unit: 'millones/μL', normalRange: { min: 4.2, max: 5.4 }, maxReasonableValue: 7.0, minReasonableValue: 3.0 },
  'glóbulos blancos|wbc|white blood cells|leucocitos': { name: 'Glóbulos Blancos', unit: '/μL', normalRange: { min: 4000, max: 11000 }, maxReasonableValue: 50000, minReasonableValue: 1000 },
  'plaquetas|platelets|plt': { name: 'Plaquetas', unit: '/μL', normalRange: { min: 150000, max: 450000 }, maxReasonableValue: 1000000, minReasonableValue: 50000 },
  
  // Bioquímica
  'glucosa|glucose|glicemia': { name: 'Glucosa', unit: 'mg/dL', normalRange: { min: 70, max: 100 }, maxReasonableValue: 500, minReasonableValue: 40 },
  'colesterol total|total cholesterol|colesterol': { name: 'Colesterol Total', unit: 'mg/dL', normalRange: { min: 0, max: 200 }, maxReasonableValue: 500, minReasonableValue: 50 },
  'colesterol hdl|hdl cholesterol|hdl': { name: 'Colesterol HDL', unit: 'mg/dL', normalRange: { min: 40, max: 100 }, maxReasonableValue: 200, minReasonableValue: 20 },
  'colesterol ldl|ldl cholesterol|ldl': { name: 'Colesterol LDL', unit: 'mg/dL', normalRange: { min: 0, max: 100 }, maxReasonableValue: 300, minReasonableValue: 0 },
  'triglicéridos|triglycerides|trigliceridos': { name: 'Triglicéridos', unit: 'mg/dL', normalRange: { min: 0, max: 150 }, maxReasonableValue: 1000, minReasonableValue: 0 },
  
  // Función Hepática
  'ast|aspartato|sgot': { name: 'AST (SGOT)', unit: 'U/L', normalRange: { min: 10, max: 40 }, maxReasonableValue: 500, minReasonableValue: 5 },
  'alt|alanina|sgpt': { name: 'ALT (SGPT)', unit: 'U/L', normalRange: { min: 10, max: 40 }, maxReasonableValue: 500, minReasonableValue: 5 },
  'bilirrubina total|total bilirubin|bilirrubina': { name: 'Bilirrubina Total', unit: 'mg/dL', normalRange: { min: 0.1, max: 1.2 }, maxReasonableValue: 10.0, minReasonableValue: 0.0 },
  'fosfatasa alcalina|alkaline phosphatase|fosfatasa': { name: 'Fosfatasa Alcalina', unit: 'U/L', normalRange: { min: 44, max: 147 }, maxReasonableValue: 500, minReasonableValue: 20 },
  
  // Función Renal
  'creatinina|creatinine': { name: 'Creatinina', unit: 'mg/dL', normalRange: { min: 0.6, max: 1.2 }, maxReasonableValue: 10.0, minReasonableValue: 0.3 },
  'urea|bun': { name: 'Urea', unit: 'mg/dL', normalRange: { min: 7, max: 20 }, maxReasonableValue: 100, minReasonableValue: 5 },
  'ácido úrico|uric acid|acido urico': { name: 'Ácido Úrico', unit: 'mg/dL', normalRange: { min: 3.5, max: 7.2 }, maxReasonableValue: 20.0, minReasonableValue: 2.0 },
  
  // Proteínas
  'proteína total|total protein|proteina total': { name: 'Proteína Total', unit: 'g/dL', normalRange: { min: 6.0, max: 8.3 }, maxReasonableValue: 15.0, minReasonableValue: 4.0 },
  'albumina|albumin': { name: 'Albumina', unit: 'g/dL', normalRange: { min: 3.5, max: 5.0 }, maxReasonableValue: 10.0, minReasonableValue: 2.0 },
  'globulina|globulin': { name: 'Globulina', unit: 'g/dL', normalRange: { min: 2.0, max: 3.5 }, maxReasonableValue: 8.0, minReasonableValue: 1.0 },
  
  // Otros
  'vitamina d|vitamin d|25-oh vitamina d': { name: 'Vitamina D', unit: 'ng/mL', normalRange: { min: 30, max: 100 }, maxReasonableValue: 200, minReasonableValue: 5 },
  'ferritina|ferritin': { name: 'Ferritina', unit: 'ng/mL', normalRange: { min: 15, max: 200 }, maxReasonableValue: 1000, minReasonableValue: 5 },
  'tsh|hormona tiroidea': { name: 'TSH', unit: 'mUI/L', normalRange: { min: 0.4, max: 4.0 }, maxReasonableValue: 20.0, minReasonableValue: 0.1 },
  't4 libre|free t4|t4l': { name: 'T4 Libre', unit: 'ng/dL', normalRange: { min: 0.8, max: 1.8 }, maxReasonableValue: 5.0, minReasonableValue: 0.3 },
};

interface ParsedLabValue {
  testName: string;
  value: number;
  unit: string;
  referenceRange?: string;
  status?: 'NORMAL' | 'ALTO' | 'BAJO' | 'CRÍTICO';
}

// Strict value validation
function isValidValue(value: number, config: typeof LAB_TEST_PATTERNS[string]): boolean {
  // Must be positive
  if (value <= 0) return false;
  
  // Must be within reasonable bounds
  if (value > config.maxReasonableValue) {
    console.log(`Rejected ${value} for ${config.name} (max: ${config.maxReasonableValue})`);
    return false;
  }
  
  if (config.minReasonableValue && value < config.minReasonableValue) {
    console.log(`Rejected ${value} for ${config.name} (min: ${config.minReasonableValue})`);
    return false;
  }
  
  // Reject values that look like IDs, dates, or other non-lab values
  if (value > 100000) return false; // Too large for any lab value
  if (value > 1900 && value < 2100) return false; // Looks like a year
  if (value === Math.floor(value) && value > 10000 && value < 1000000) {
    // Large whole numbers are likely IDs, not lab values
    return false;
  }
  
  return true;
}

// Extract value that appears right after test name, with strict validation
function extractValueFromLine(line: string, testPattern: string, config: typeof LAB_TEST_PATTERNS[string]): number | null {
  const cleanLine = line.trim();
  
  // Find where the test name appears (allow it to be immediately followed by units with no space)
  const testMatch = cleanLine.match(new RegExp(`(${testPattern})`, 'i'));
  if (!testMatch) return null;

  const testEndIndex = testMatch.index! + testMatch[1].length;
  const afterTest = cleanLine.substring(testEndIndex).trim();

  // Look for value immediately after test name (within first 80 chars)
  const searchArea = afterTest.substring(0, 80);
  
  // Pattern: number followed by optional unit
  const valuePatterns = [
    // "Test: 12.5" or "Test 12.5" or "Test\t12.5"
    /^[\s:|\t]+(\d+[.,]\d+|\d+)\s*(g\/dl|mg\/dl|ng\/ml|u\/l|mui\/l|%|\/μl|millones\/μl|mcg\/dl)?/i,
    // In table: "Test | 12.5 |"
    /\|\s*(\d+[.,]\d+|\d+)\s*\|/,
    // Direct number after test name
    /^[\s:|\t]+(\d+[.,]\d+|\d+)\s*$/,
    // Unit immediately followed by value e.g. "mg/dL93"
    /[a-z/%]+\s*(\d+[.,]\d+|\d+)/i,
    // Fallback: first number after the test name
    /(\d+[.,]\d+)/,
  ];
  
  for (const pattern of valuePatterns) {
    const match = searchArea.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(',', '.'));
      
      // STRICT validation - only accept if within reasonable bounds
      if (isValidValue(value, config)) {
        return value;
      }
    }
  }
  
  return null;
}

// Extract reference range from line
function extractReferenceRange(line: string): { min: number; max: number } | null {
  const rangePatterns = [
    /\(?(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)\)?/,
    /(\d+[.,]?\d*)\s*-\s*(\d+[.,]?\d*)/,
  ];
  
  for (const pattern of rangePatterns) {
    const match = line.match(pattern);
    if (match && match[1] && match[2]) {
      const min = parseFloat(match[1].replace(',', '.'));
      const max = parseFloat(match[2].replace(',', '.'));
      if (min < max && min >= 0 && max < 100000) {
        return { min, max };
      }
    }
  }
  
  return null;
}

export function parseLabResults(text: string): ParsedLabValue[] {
  const results: ParsedLabValue[] = [];
  // Split by lines and also by common separators (tabs, multiple spaces)
  const lines = text
    .split(/\n|\r\n/)
    .map(line => line.trim())
    .filter(line => line.length > 3);
  
  const foundTests = new Set<string>();
  
  // Look for patterns in each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const originalLine = lines[i];
    
    // Try to match each lab test pattern
    for (const [pattern, config] of Object.entries(LAB_TEST_PATTERNS)) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i'); // Word boundary to avoid partial matches
      if (regex.test(line) && !foundTests.has(config.name)) {
        let value: number | null = null;
        let referenceRange: { min: number; max: number } | null = null;
        
        // Try current line first
        value = extractValueFromLine(originalLine, pattern, config);
        referenceRange = extractReferenceRange(originalLine);
        
        // If not found in current line, try next line (common in table format)
        if (!value && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          // Only check next line if it looks like it contains a value (has numbers but not too many)
          const numberCount = (nextLine.match(/\d/g) || []).length;
          if (numberCount > 0 && numberCount < 20) { // Not a line full of numbers
            value = extractValueFromLine(nextLine, pattern, config);
            if (!referenceRange) {
              referenceRange = extractReferenceRange(nextLine);
            }
          }
        }
        
        // Only add if we found a valid, reasonable value
        if (value !== null) {
          const range = referenceRange || config.normalRange;
          
          // Extract unit
          let unit = config.unit;
          const unitMatch = originalLine.match(/(g\/dl|mg\/dl|ng\/ml|u\/l|mui\/l|%|\/μl|millones\/μl|mcg\/dl)/i);
          if (unitMatch) {
            unit = unitMatch[1];
          }
          
          // Determine status
          let status: 'NORMAL' | 'ALTO' | 'BAJO' | 'CRÍTICO' | undefined;
          if (range) {
            const margin = (range.max - range.min) * 0.1;
            const criticalThreshold = (range.max - range.min) * 0.5;
            
            if (value < range.min - criticalThreshold || value > range.max + criticalThreshold) {
              status = 'CRÍTICO';
            } else if (value < range.min - margin) {
              status = 'BAJO';
            } else if (value > range.max + margin) {
              status = 'ALTO';
            } else {
              status = 'NORMAL';
            }
          }
          
          const referenceRangeStr = range ? `${range.min}-${range.max} ${unit}` : undefined;
          
          results.push({
            testName: config.name,
            value,
            unit,
            referenceRange: referenceRangeStr,
            status,
          });
          
          foundTests.add(config.name);
          break;
        }
      }
    }
  }
  
  return results;
}

export function getLabTestInfo(testName: string) {
  const normalized = testName.toLowerCase();
  for (const [pattern, config] of Object.entries(LAB_TEST_PATTERNS)) {
    if (new RegExp(`\\b${pattern}\\b`, 'i').test(normalized)) {
      return config;
    }
  }
  return null;
}
