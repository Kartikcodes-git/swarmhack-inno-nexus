-- ============================================================================
-- Bucket A seed data — run once after supabase/schema.sql.
-- Government MSP (2024-25 marketing season, indicative) + crop care guidance.
-- Crop names match lib/crops.ts exactly, or api/msp + api/crop-care return
-- nothing for that crop.
-- ============================================================================

insert into public.crop_msp (crop_name, season, msp_per_quintal) values
  ('Wheat',    'Rabi',   2275.00),
  ('Maize',    'Kharif', 2225.00),
  ('Soybean',  'Kharif', 4892.00),
  ('Gram',     'Rabi',   5650.00),
  ('Cotton',   'Kharif', 7121.00),
  ('Onion',    'Kharif', 2410.00),
  ('Tomato',   'Kharif', 1850.00),
  ('Potato',   'Rabi',   1450.00)
on conflict (crop_name, season) do update
  set msp_per_quintal = excluded.msp_per_quintal,
      effective_from = current_date;

insert into public.crop_care_guidelines
  (crop_name, recommended_rotation_crops, disease_risk_notes, irrigation_advice, pesticide_advice)
values
  ('Onion', array['Wheat', 'Gram'],
    'Continuous onion cropping raises purple blotch and stemphylium risk.',
    'Light, frequent irrigation; stop 2–3 weeks before harvest to aid curing.',
    'Spray mancozeb at first sign of purple blotch; avoid overhead watering in humid spells.'),
  ('Tomato', array['Maize', 'Soybean'],
    'Back-to-back tomato favours bacterial wilt and early blight build-up in soil.',
    'Drip irrigation preferred; keep foliage dry to limit blight spread.',
    'Rotate fungicide classes (avoid repeated mancozeb) to slow resistance; neem-based spray for early aphid pressure.'),
  ('Potato', array['Wheat', 'Maize'],
    'Repeated potato increases late blight and cyst nematode pressure.',
    'Maintain even soil moisture; avoid waterlogging, which worsens tuber rot.',
    'Preventive copper-oxychloride spray before monsoon onset if late blight reported nearby.'),
  ('Cotton', array['Gram', 'Wheat'],
    'Continuous cotton builds up pink bollworm populations.',
    'Deficit irrigation during vegetative stage, full irrigation at flowering/boll formation.',
    'Install pheromone traps for pink bollworm; spray only past economic threshold.'),
  ('Wheat', array['Soybean', 'Gram'],
    'Wheat after wheat raises rust and root-rot incidence.',
    'Critical irrigation at crown root initiation and flowering stages.',
    'Seed-treat with fungicide before sowing if rust was seen in the previous season.'),
  ('Soybean', array['Wheat', 'Maize'],
    'Continuous soybean favours yellow mosaic virus via whitefly carryover.',
    'Well-drained field; avoid standing water, soybean is waterlogging-sensitive.',
    'Monitor whitefly counts; spray only if above threshold to protect natural predators.'),
  ('Maize', array['Gram', 'Soybean'],
    'Repeated maize increases stalk borer and fall armyworm carryover.',
    'Irrigate at knee-high, tasseling and grain-filling stages — the most moisture-sensitive.',
    'Scout whorls for fall armyworm early; apply only if damage exceeds threshold.'),
  ('Gram', array['Cotton', 'Maize'],
    'Continuous gram raises wilt (Fusarium) risk in the same field.',
    'Light irrigation at pre-flowering and pod-development stages; over-watering promotes wilt.',
    'Use wilt-resistant seed where available; avoid gram-after-gram in known wilt fields.')
on conflict (crop_name) do update
  set recommended_rotation_crops = excluded.recommended_rotation_crops,
      disease_risk_notes = excluded.disease_risk_notes,
      irrigation_advice = excluded.irrigation_advice,
      pesticide_advice = excluded.pesticide_advice;
