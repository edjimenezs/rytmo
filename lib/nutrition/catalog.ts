export type FoodMoment = 'preWorkout' | 'intraWorkout' | 'postWorkout' | 'snack' | 'dinner';

export type FoodOption = {
  name: string;
  description: string;
  moment: FoodMoment;
  focus: string[];
  carbs: number;
  protein: number;
  fat: number;
  kcal: number;
  portion: string;
};

const buildFood = (overrides: Partial<FoodOption> & Pick<FoodOption, 'name' | 'description' | 'moment' | 'focus'>): FoodOption => ({
  carbs: 35,
  protein: 12,
  fat: 6,
  kcal: 300,
  portion: '1 porción',
  ...overrides,
});

export const foodCatalog: FoodOption[] = [
  // ============================================================
  // PRE-WORKOUT (10 items)
  // ============================================================

  // Existing 3 preWorkout items
  buildFood({
    name: 'Marraqueta + palta + huevo duro',
    description: 'Carbohidratos suaves y grasas chilenas para cargar antes de salir en rodados Z2.',
    moment: 'preWorkout',
    focus: ['energy availability', 'performance + recovery'],
    carbs: 45,
    protein: 14,
    fat: 15,
    kcal: 420,
    portion: '2 rebanadas de marraqueta + 1 palta y 1 huevo',
  }),
  buildFood({
    name: 'Barquete de avena con mote',
    description: 'Avena, mote y miel para mantener la energía en sesión larga. La avena aporta beta-glucano anti-inflamatorio.',
    moment: 'preWorkout',
    focus: ['energy availability', 'maintenance', 'recovery'],
    carbs: 62,
    protein: 10,
    fat: 5,
    kcal: 380,
    portion: '1 taza cocida',
  }),
  buildFood({
    name: 'Sándwich integral de ave y palta',
    description: 'Alternativa rápida para viaje en bici. Proteína magra y grasas saludables para performance.',
    moment: 'preWorkout',
    focus: ['energy availability', 'performance + recovery'],
    carbs: 48,
    protein: 22,
    fat: 14,
    kcal: 450,
    portion: '1 sándwich mediano',
  }),

  // 7 new preWorkout items
  buildFood({
    name: 'Tostadas integrales con requesón y miel',
    description: 'Carbohidratos de digestión media con proteína láctea. Macros balanceados para sesiones moderadas.',
    moment: 'preWorkout',
    focus: ['energy availability', 'maintenance'],
    carbs: 38,
    protein: 10,
    fat: 4,
    kcal: 240,
    portion: '2 tostadas + 2 cdas requesón',
  }),
  buildFood({
    name: 'Plátano con mantequilla de maní',
    description: 'Carbohidratos rápidos y grasas para energía sostenida antes del entrenamiento.',
    moment: 'preWorkout',
    focus: ['energy availability'],
    carbs: 30,
    protein: 7,
    fat: 10,
    kcal: 240,
    portion: '1 plátano mediano + 1 cda mantequilla de maní',
  }),
  buildFood({
    name: 'Arroz con leche bajo en azúcar',
    description: 'Carbohidratos complejos con digestión suave, buena tolerancia gastrointestinal y calcio.',
    moment: 'preWorkout',
    focus: ['energy availability', 'maintenance', 'recovery'],
    carbs: 52,
    protein: 8,
    fat: 3,
    kcal: 280,
    portion: '1 taza (250 ml)',
  }),
  buildFood({
    name: 'Mote con huesillos (reducir syrup)',
    description: 'Clásico chileno: mote de trigo con frutas deshidratadas, carbohidratos lentos y sabor local.',
    moment: 'preWorkout',
    focus: ['energy availability'],
    carbs: 45,
    protein: 3,
    fat: 0,
    kcal: 200,
    portion: '1 taza mote + 3-4 huesillos',
  }),
  buildFood({
    name: 'Batido de plátano, avena y leche',
    description: 'Batido pre-entrenamiento con carbohidratos, proteína y energía para sesiones de alta carga.',
    moment: 'preWorkout',
    focus: ['energy availability', 'performance + recovery'],
    carbs: 55,
    protein: 12,
    fat: 5,
    kcal: 340,
    portion: '400 ml',
  }),
  buildFood({
    name: 'Yogurt griego con granola y miel',
    description: 'Proteína y carbohidratos de liberación gradual. Ratio CHO:PRO 2.7:1 para rendimiento y recuperación.',
    moment: 'preWorkout',
    focus: ['maintenance', 'recovery', 'performance + recovery'],
    carbs: 40,
    protein: 15,
    fat: 6,
    kcal: 320,
    portion: '200g yogurt + 3 cdas granola',
  }),
  buildFood({
    name: 'Pan de molde integral con pavo y tomate',
    description: 'Pre-entrenamiento ligero con proteína magra y carbohidratos para recuperación activa.',
    moment: 'preWorkout',
    focus: ['recovery'],
    carbs: 34,
    protein: 18,
    fat: 5,
    kcal: 280,
    portion: '2 rebanadas + 60g pavo',
  }),

  // ============================================================
  // INTRA-WORKOUT (8 items)
  // ============================================================

  // Existing 2 intraWorkout items
  buildFood({
    name: 'Geles isotónicos Fogg + agua con sal',
    description: 'Hidratos rápidos con electrolitos. Formulación para mantener rendimiento en sesiones de alta intensidad.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'performance + recovery'],
    carbs: 28,
    protein: 0,
    fat: 0,
    kcal: 110,
    portion: '1 gel + 500 ml bebida isotónica',
  }),
  buildFood({
    name: 'Pan amasado con manjar y plátano',
    description: 'Recarga dulce para sesiones largas de ciclismo. Pan con potasio del plátano para prevenir calambres.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'maintenance'],
    carbs: 50,
    protein: 6,
    fat: 12,
    kcal: 420,
    portion: '1 pan pequeño con 1 cda de manjar + 1/2 plátano',
  }),

  // 6 new intraWorkout items
  buildFood({
    name: 'Dátiles con sal de mar',
    description: 'Azúcares naturales, sodio y antioxidantes naturales. Múltiple cobertura de fueles intra-sesión.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'performance + recovery', 'recovery'],
    carbs: 45,
    protein: 1,
    fat: 0,
    kcal: 180,
    portion: '6-8 dátiles (~60g)',
  }),
  buildFood({
    name: 'Bebida isotónica casera (agua, azúcar, sal, limón)',
    description: 'Electrolitos y carbohidratos simples para rehidratación y energía durante la sesión.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'maintenance'],
    carbs: 30,
    protein: 0,
    fat: 0,
    kcal: 120,
    portion: '500 ml',
  }),
  buildFood({
    name: 'Plátano entero con pizca de sal',
    description: 'Carbohidratos naturales y potasio para prevenir calambres en sesiones largas.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'maintenance', 'recovery'],
    carbs: 27,
    protein: 1,
    fat: 0,
    kcal: 115,
    portion: '1 plátano mediano',
  }),
  buildFood({
    name: 'Galletas de arroz con manjar',
    description: 'Fácil digestión con carbohidratos rápidos. Bajo en fibra, ideal para no generar molestias GI.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'performance + recovery', 'maintenance'],
    carbs: 38,
    protein: 3,
    fat: 6,
    kcal: 220,
    portion: '4 galletas + 1 cda manjar',
  }),
  buildFood({
    name: 'Barra de cereal artesanal (avena, miel, chía)',
    description: 'Barra casera con avena y miel para energía sostenida. Chía aporta omega-3 anti-inflamatorio.',
    moment: 'intraWorkout',
    focus: ['maintenance', 'performance + recovery', 'recovery'],
    carbs: 32,
    protein: 5,
    fat: 8,
    kcal: 230,
    portion: '1 barra (~50g)',
  }),
  buildFood({
    name: 'Naranja pelada con sal',
    description: 'Vitamina C, fructosa y electrolitos para hidratación natural durante el esfuerzo.',
    moment: 'intraWorkout',
    focus: ['energy availability', 'recovery'],
    carbs: 18,
    protein: 1,
    fat: 0,
    kcal: 80,
    portion: '1 naranja grande',
  }),

  // ============================================================
  // POST-WORKOUT (10 items)
  // ============================================================

  // Existing 3 postWorkout items
  buildFood({
    name: 'Charquicán con huevos y ensalada chilena',
    description: 'Plato chileno completo. Carbs, proteína y verduras frescas para post-entreno con macros balanceados.',
    moment: 'postWorkout',
    focus: ['performance + recovery', 'maintenance'],
    carbs: 65,
    protein: 24,
    fat: 10,
    kcal: 520,
    portion: '1 plato mediano',
  }),
  buildFood({
    name: 'Batido de lúcuma, yogurt y quinoa inflada',
    description: 'Recuperación con proteína y glucógeno reconociendo sabores chilenos.',
    moment: 'postWorkout',
    focus: ['recovery'],
    carbs: 40,
    protein: 28,
    fat: 4,
    kcal: 380,
    portion: '400 ml',
  }),
  buildFood({
    name: 'Parfait de yogurt natural, frutos rojos y chía',
    description: 'Snack de recuperación suave. Frutos rojos aportan antioxidantes, chía omega-3 anti-inflamatorio.',
    moment: 'postWorkout',
    focus: ['maintenance', 'recovery'],
    carbs: 36,
    protein: 12,
    fat: 7,
    kcal: 320,
    portion: '200 g',
  }),

  // 7 new postWorkout items
  buildFood({
    name: 'Arroz integral con pechuga de pollo asada',
    description: 'Reposición de glucógeno y proteína magra para recuperación completa post-entreno intenso.',
    moment: 'postWorkout',
    focus: ['energy availability', 'performance + recovery'],
    carbs: 55,
    protein: 35,
    fat: 5,
    kcal: 420,
    portion: '1 taza arroz cocido + 150g pollo',
  }),
  buildFood({
    name: 'Lentejas con arroz y huevo duro',
    description: 'Legumbres chilenas con arroz: proteína completa vegetal y carbohidratos de digestión lenta.',
    moment: 'postWorkout',
    focus: ['performance + recovery', 'recovery'],
    carbs: 65,
    protein: 28,
    fat: 6,
    kcal: 450,
    portion: '1 plato mediano',
  }),
  buildFood({
    name: 'Batido de proteína con leche y plátano',
    description: 'Proteína de absorción rápida con carbohidratos para ventana anabólica post-entreno.',
    moment: 'postWorkout',
    focus: ['performance + recovery'],
    carbs: 40,
    protein: 30,
    fat: 4,
    kcal: 320,
    portion: '400 ml',
  }),
  buildFood({
    name: 'Pasta con salsa de tomate y atún',
    description: 'Pasta con proteína marina para reposición de glucógeno tras sesión larga.',
    moment: 'postWorkout',
    focus: ['energy availability'],
    carbs: 68,
    protein: 30,
    fat: 7,
    kcal: 470,
    portion: '1 plato mediano',
  }),
  buildFood({
    name: 'Ensalada de quinoa con pollo y palta',
    description: 'Bowl de recuperación completo con proteína, carbohidratos complejos y grasas anti-inflamatorias.',
    moment: 'postWorkout',
    focus: ['performance + recovery', 'recovery'],
    carbs: 38,
    protein: 30,
    fat: 14,
    kcal: 430,
    portion: '1 bowl',
  }),
  buildFood({
    name: 'Marraqueta tostada con requesón y mermelada',
    description: 'Carbohidratos rápidos más proteína láctea. Macros balanceados, fácil digestión post-entreno.',
    moment: 'postWorkout',
    focus: ['energy availability', 'maintenance', 'performance + recovery'],
    carbs: 48,
    protein: 12,
    fat: 4,
    kcal: 290,
    portion: '2 rebanadas',
  }),
  buildFood({
    name: 'Porotos con rienda',
    description: 'Plato tradicional chileno: legumbres, fideos y proteína para recuperación calórica completa.',
    moment: 'postWorkout',
    focus: ['energy availability', 'maintenance', 'performance + recovery'],
    carbs: 70,
    protein: 22,
    fat: 8,
    kcal: 460,
    portion: '1 plato mediano',
  }),

  // ============================================================
  // SNACK (9 items)
  // ============================================================

  // Existing 2 snack items
  buildFood({
    name: 'Yogurt natural con avena, berries y chía',
    description: 'Snack con proteína, antioxidantes y omega-3. Ratio CHO:PRO apto para recuperación activa.',
    moment: 'snack',
    focus: ['maintenance', 'performance + recovery', 'recovery'],
    carbs: 36,
    protein: 14,
    fat: 8,
    kcal: 320,
    portion: '1 bowl',
  }),
  buildFood({
    name: 'Palta rellena con garbanzos y tomate',
    description: 'Snack salado, rico en grasas buenas y proteína vegetal para antes de dormir o entre sesiones.',
    moment: 'snack',
    focus: ['maintenance', 'recovery'],
    carbs: 22,
    protein: 9,
    fat: 18,
    kcal: 310,
    portion: '1 palta grande',
  }),

  // 7 new snack items
  buildFood({
    name: 'Marraqueta con mantequilla de maní y plátano',
    description: 'Snack energético chileno con carbohidratos, grasas y proteína. Ideal en días de carga alta.',
    moment: 'snack',
    focus: ['energy availability', 'performance + recovery'],
    carbs: 42,
    protein: 10,
    fat: 12,
    kcal: 330,
    portion: '1/2 marraqueta + 1 cda mantequilla de maní + 1/2 plátano',
  }),
  buildFood({
    name: 'Nueces con pasas y dátiles',
    description: 'Grasas saludables, azúcares naturales y antioxidantes. Snack calórico para días de entrenamiento.',
    moment: 'snack',
    focus: ['energy availability', 'performance + recovery', 'recovery'],
    carbs: 32,
    protein: 5,
    fat: 18,
    kcal: 320,
    portion: '30g nueces + 20g fruta seca',
  }),
  buildFood({
    name: 'Huevos duros con galletas de arroz',
    description: 'Proteína completa con carbohidratos de fácil digestión para recuperación entre sesiones.',
    moment: 'snack',
    focus: ['performance + recovery', 'maintenance'],
    carbs: 20,
    protein: 16,
    fat: 10,
    kcal: 240,
    portion: '2 huevos + 2 galletas de arroz',
  }),
  buildFood({
    name: 'Manzana con mantequilla de maní',
    description: 'Fruta chilena con grasas y proteína. Carbohidratos de fruta para recarga rápida y mantenimiento.',
    moment: 'snack',
    focus: ['maintenance', 'energy availability'],
    carbs: 25,
    protein: 6,
    fat: 10,
    kcal: 220,
    portion: '1 manzana + 1 cda mantequilla de maní',
  }),
  buildFood({
    name: 'Batido de lúcuma con leche',
    description: 'Batido suave con lúcuma chilena, carbohidratos y calcio para recuperación entre sesiones.',
    moment: 'snack',
    focus: ['maintenance', 'recovery'],
    carbs: 36,
    protein: 10,
    fat: 4,
    kcal: 240,
    portion: '350 ml',
  }),
  buildFood({
    name: 'Tuna en lata con galletas de arroz',
    description: 'Proteína marina de alto valor biológico con carbohidratos simples para recuperación activa.',
    moment: 'snack',
    focus: ['performance + recovery', 'recovery'],
    carbs: 16,
    protein: 22,
    fat: 3,
    kcal: 190,
    portion: '1 lata (80g) + 4 galletas de arroz',
  }),
  buildFood({
    name: 'Maní tostado salado',
    description: 'Proteína vegetal, grasas insaturadas y potasio. Snack calórico denso para días de carga alta.',
    moment: 'snack',
    focus: ['energy availability', 'maintenance', 'performance + recovery'],
    carbs: 12,
    protein: 12,
    fat: 18,
    kcal: 260,
    portion: '40g',
  }),

  // ============================================================
  // DINNER (8 items)
  // ============================================================

  // Existing 2 dinner items
  buildFood({
    name: 'Cazuela de vacuno con camote',
    description: 'Proteína magra, camote y verduras para recuperar la noche. Ratio CHO:PRO 1.7:1 para alto rendimiento.',
    moment: 'dinner',
    focus: ['recovery', 'maintenance', 'performance + recovery'],
    carbs: 54,
    protein: 32,
    fat: 8,
    kcal: 460,
    portion: '1 plato profundo',
  }),
  buildFood({
    name: 'Salmón a la plancha con quínoa y salsa de merkén',
    description: 'Omega-3 anti-inflamatorio, proteína completa y quínoa. Ratio CHO:PRO ideal para recuperación.',
    moment: 'dinner',
    focus: ['recovery', 'performance + recovery'],
    carbs: 36,
    protein: 34,
    fat: 18,
    kcal: 510,
    portion: '150 g salmón + 1/2 taza quínoa',
  }),

  // 6 new dinner items
  buildFood({
    name: 'Cazuela de pollo con arroz y verduras',
    description: 'Cena completa chilena con proteína magra, carbohidratos y micronutrientes de verduras de estación.',
    moment: 'dinner',
    focus: ['energy availability', 'recovery'],
    carbs: 60,
    protein: 30,
    fat: 6,
    kcal: 440,
    portion: '1 plato profundo',
  }),
  buildFood({
    name: 'Fideos con pesto de albahaca y pechuga',
    description: 'Pasta con proteína y aceite de oliva. Macros balanceados para cenas de alta carga y mantenimiento.',
    moment: 'dinner',
    focus: ['energy availability', 'performance + recovery', 'maintenance'],
    carbs: 62,
    protein: 28,
    fat: 16,
    kcal: 520,
    portion: '1 plato mediano',
  }),
  buildFood({
    name: 'Reineta al vapor con puré de papas',
    description: 'Pescado blanco chileno bajo en grasa con puré para cenas de recuperación ligera.',
    moment: 'dinner',
    focus: ['performance + recovery', 'recovery'],
    carbs: 45,
    protein: 30,
    fat: 8,
    kcal: 380,
    portion: '150g pescado + 1 taza puré',
  }),
  buildFood({
    name: 'Porotos granados con choclo y albahaca',
    description: 'Plato vegetariano de verano chileno: legumbres con maíz, proteína vegetal y carbohidratos complejos.',
    moment: 'dinner',
    focus: ['energy availability', 'maintenance', 'performance + recovery'],
    carbs: 65,
    protein: 20,
    fat: 4,
    kcal: 400,
    portion: '1 plato',
  }),
  buildFood({
    name: 'Ensalada de garbanzos con espinaca y huevo',
    description: 'Proteína vegetal completa, hierro, vitamina K. Cena ligera con macros balanceados para mantenimiento.',
    moment: 'dinner',
    focus: ['maintenance', 'recovery', 'performance + recovery'],
    carbs: 32,
    protein: 22,
    fat: 12,
    kcal: 350,
    portion: '1 bowl grande',
  }),
  buildFood({
    name: 'Sopaipillas pasadas (versión ligera)',
    description: 'Cena tradicional chilena de invierno con carbohidratos de zapallo para reposición en días de carga alta.',
    moment: 'dinner',
    focus: ['energy availability'],
    carbs: 55,
    protein: 5,
    fat: 8,
    kcal: 320,
    portion: '3 sopaipillas medianas',
  }),
];

// Coverage validation (development only)
if (process.env.NODE_ENV === 'development') {
  const moments: FoodMoment[] = ['preWorkout', 'intraWorkout', 'postWorkout', 'snack', 'dinner'];
  const focuses = ['energy availability', 'performance + recovery', 'maintenance', 'recovery'];
  for (const m of moments) {
    for (const f of focuses) {
      const count = foodCatalog.filter(item => item.moment === m && item.focus.includes(f)).length;
      if (count < 4) {
        console.warn(`[catalog] COVERAGE GAP: ${m} × ${f} has ${count} items (need >=4)`);
      }
    }
  }
}
