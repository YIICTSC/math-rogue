export interface NativeEnglishUnitOption {
  id: string;
  name: string;
  mode: string;
}

export type NativeEnglishSubjectId = 'NATIVE_ELA' | 'NATIVE_MATH' | 'NATIVE_SCIENCE' | 'NATIVE_SOCIAL' | 'NATIVE_JAPANESE';

const u = (id: string, name: string, mode: string): NativeEnglishUnitOption => ({ id, name, mode });

export const NATIVE_ENGLISH_GRADE_UNITS: Record<NativeEnglishSubjectId, Record<number, NativeEnglishUnitOption[]>> = {
  NATIVE_ELA: {
    1: [
      u('NE_ELA_G1_PHONICS', 'ELA G1: Phonics and Sight Words', 'NATIVE_ELA_G1'),
      u('NE_ELA_G1_LONG_VOWELS', 'ELA G1: Long Vowels', 'NATIVE_ELA_G1_LONG_VOWELS'),
      u('NE_ELA_G1_SIGHT_WORDS', 'ELA G1: Sight Words in Sentences', 'NATIVE_ELA_G1_SIGHT_WORDS'),
      u('NE_ELA_G1_SENTENCES', 'ELA G1: Sentences and Story Details', 'NATIVE_ELA_G1_SENTENCES'),
    ],
    2: [
      u('NE_ELA_G2_GRAMMAR', 'ELA G2: Sentences and Main Idea', 'NATIVE_ELA_G2'),
      u('NE_ELA_G2_PREFIX_SUFFIX', 'ELA G2: Prefixes and Suffixes', 'NATIVE_ELA_G2_PREFIX_SUFFIX'),
      u('NE_ELA_G2_READING', 'ELA G2: Reading Details and Vocabulary', 'NATIVE_ELA_G2_READING'),
      u('NE_ELA_G2_FLUENCY', 'ELA G2: Reading Fluency and Expression', 'NATIVE_ELA_G2_FLUENCY'),
    ],
    3: [
      u('NE_ELA_G3_GRAMMAR', 'ELA G3: Reading and Grammar', 'NATIVE_ELA_G3'),
      u('NE_ELA_G3_WRITING', 'ELA G3: Paragraphs and Word Study', 'NATIVE_ELA_G3_WRITING'),
      u('NE_ELA_G3_INFERENCE', 'ELA G3: Inference and Theme', 'NATIVE_ELA_G3_INFERENCE'),
      u('NE_ELA_G3_VOCAB', 'ELA G3: Vocabulary and Context Clues', 'NATIVE_ELA_G3_VOCAB'),
    ],
    4: [
      u('NE_ELA_G4_INFERENCE', 'ELA G4: Inference and Theme', 'NATIVE_ELA_G4_INFERENCE'),
      u('NE_ELA_G4_STRUCTURE', 'ELA G4: Text Structure and Vocabulary', 'NATIVE_ELA_G4_STRUCTURE'),
      u('NE_ELA_G4_POINT_OF_VIEW', 'ELA G4: Point of View', 'NATIVE_ELA_G4_POINT_OF_VIEW'),
      u('NE_ELA_G4_FIGURATIVE', 'ELA G4: Figurative Language', 'NATIVE_ELA_G4_FIGURATIVE'),
    ],
    5: [
      u('NE_ELA_G5_ANALYSIS', 'ELA G5: Text Analysis', 'NATIVE_ELA_G5_ANALYSIS'),
      u('NE_ELA_G5_WRITING', 'ELA G5: Opinion and Informative Writing', 'NATIVE_ELA_G5_WRITING'),
      u('NE_ELA_G5_TEXT_EVIDENCE', 'ELA G5: Text Evidence', 'NATIVE_ELA_G5_TEXT_EVIDENCE'),
      u('NE_ELA_G5_COMPARE', 'ELA G5: Compare and Contrast', 'NATIVE_ELA_G5_COMPARE'),
    ],
    6: [
      u('NE_ELA_G6_ARGUMENT', 'ELA G6: Argument and Evidence', 'NATIVE_ELA_G6_ARGUMENT'),
      u('NE_ELA_G6_LITERATURE', 'ELA G6: Literature and Figurative Language', 'NATIVE_ELA_G6_LITERATURE'),
      u('NE_ELA_G6_VOCAB', 'ELA G6: Academic Vocabulary', 'NATIVE_ELA_G6_VOCAB'),
      u('NE_ELA_G6_INFORMATIONAL', 'ELA G6: Informational Text', 'NATIVE_ELA_G6_INFORMATIONAL'),
    ],
    7: [
      u('NE_ELA_G7_ANALYSIS', 'ELA G7: Literary Analysis', 'NATIVE_ELA_G7_ANALYSIS'),
      u('NE_ELA_G7_RESEARCH', 'ELA G7: Research and Media Literacy', 'NATIVE_ELA_G7_RESEARCH'),
      u('NE_ELA_G7_ARGUMENT', 'ELA G7: Argument and Claims', 'NATIVE_ELA_G7_ARGUMENT'),
      u('NE_ELA_G7_VOCAB', 'ELA G7: Word Study and Tone', 'NATIVE_ELA_G7_VOCAB'),
    ],
    8: [
      u('NE_ELA_G8_RHETORIC', 'ELA G8: Rhetoric and Author Craft', 'NATIVE_ELA_G8_RHETORIC'),
      u('NE_ELA_G8_ARGUMENT', 'ELA G8: Argument Writing and Source Use', 'NATIVE_ELA_G8_ARGUMENT'),
      u('NE_ELA_G8_MEDIA', 'ELA G8: Media Literacy', 'NATIVE_ELA_G8_MEDIA'),
      u('NE_ELA_G8_LITERATURE', 'ELA G8: Literature and Theme', 'NATIVE_ELA_G8_LITERATURE'),
    ],
  },
  NATIVE_MATH: {
    1: [
      u('NE_MATH_G1_NUMBERS', 'Math G1: Number Sense', 'NATIVE_MATH_G1'),
      u('NE_MATH_G1_ADD_SUB_20', 'Math G1: Addition and Subtraction within 20', 'NATIVE_MATH_G1_ADD_SUB_20'),
      u('NE_MATH_G1_SHAPES', 'Math G1: Shapes, Time, and Money', 'NATIVE_MATH_G1_SHAPES'),
      u('NE_MATH_G1_COMPARE', 'Math G1: Compare Numbers and Data', 'NATIVE_MATH_G1_COMPARE'),
    ],
    2: [
      u('NE_MATH_G2_WORDS', 'Math G2: Word Problems', 'NATIVE_MATH_G2'),
      u('NE_MATH_G2_PLACE_VALUE', 'Math G2: Place Value', 'NATIVE_MATH_G2_PLACE_VALUE'),
      u('NE_MATH_G2_MEASURE', 'Math G2: Place Value and Measurement', 'NATIVE_MATH_G2_MEASURE'),
      u('NE_MATH_G2_ADD_SUB_100', 'Math G2: Addition and Subtraction within 100', 'NATIVE_MATH_G2_ADD_SUB_100'),
    ],
    3: [
      u('NE_MATH_G3_MULTI', 'Math G3: Multiplication and Fractions', 'NATIVE_MATH_G3'),
      u('NE_MATH_G3_FRACTIONS', 'Math G3: Fractions on Shapes and Number Lines', 'NATIVE_MATH_G3_FRACTIONS'),
      u('NE_MATH_G3_GEOMETRY', 'Math G3: Geometry and Data', 'NATIVE_MATH_G3_GEOMETRY'),
      u('NE_MATH_G3_DIVISION', 'Math G3: Division and Equal Groups', 'NATIVE_MATH_G3_DIVISION'),
    ],
    4: [
      u('NE_MATH_G4_OPERATIONS', 'Math G4: Multi-Digit Operations', 'NATIVE_MATH_G4_OPERATIONS'),
      u('NE_MATH_G4_FRACTIONS', 'Math G4: Fractions and Decimals', 'NATIVE_MATH_G4_FRACTIONS'),
      u('NE_MATH_G4_DECIMALS', 'Math G4: Decimals and Measurement', 'NATIVE_MATH_G4_DECIMALS'),
      u('NE_MATH_G4_GEOMETRY', 'Math G4: Geometry, Lines, and Angles', 'NATIVE_MATH_G4_GEOMETRY'),
    ],
    5: [
      u('NE_MATH_G5_DECIMALS', 'Math G5: Decimals and Volume', 'NATIVE_MATH_G5_DECIMALS'),
      u('NE_MATH_G5_FRACTIONS', 'Math G5: Fraction Operations', 'NATIVE_MATH_G5_FRACTIONS'),
      u('NE_MATH_G5_COORDINATE', 'Math G5: Coordinate Plane', 'NATIVE_MATH_G5_COORDINATE'),
      u('NE_MATH_G5_EXPRESSIONS', 'Math G5: Numerical Expressions', 'NATIVE_MATH_G5_EXPRESSIONS'),
    ],
    6: [
      u('NE_MATH_G6_RATIOS', 'Math G6: Ratios and Rates', 'NATIVE_MATH_G6_RATIOS'),
      u('NE_MATH_G6_EXPRESSIONS', 'Math G6: Expressions and Equations', 'NATIVE_MATH_G6_EXPRESSIONS'),
      u('NE_MATH_G6_INTEGERS', 'Math G6: Integers and Rational Numbers', 'NATIVE_MATH_G6_INTEGERS'),
      u('NE_MATH_G6_STATS', 'Math G6: Statistics and Data', 'NATIVE_MATH_G6_STATS'),
    ],
    7: [
      u('NE_MATH_G7_PROPORTIONS', 'Math G7: Proportional Relationships', 'NATIVE_MATH_G7_PROPORTIONS'),
      u('NE_MATH_G7_STATS', 'Math G7: Statistics and Probability', 'NATIVE_MATH_G7_STATS'),
      u('NE_MATH_G7_INTEGERS', 'Math G7: Integers and Rational Numbers', 'NATIVE_MATH_G7_INTEGERS'),
      u('NE_MATH_G7_EXPRESSIONS', 'Math G7: Expressions and Equations', 'NATIVE_MATH_G7_EXPRESSIONS'),
    ],
    8: [
      u('NE_MATH_G8_LINEAR', 'Math G8: Linear Equations', 'NATIVE_MATH_G8_LINEAR'),
      u('NE_MATH_G8_GEOMETRY', 'Math G8: Geometry and Functions', 'NATIVE_MATH_G8_GEOMETRY'),
      u('NE_MATH_G8_PYTHAGOREAN', 'Math G8: Pythagorean Theorem', 'NATIVE_MATH_G8_PYTHAGOREAN'),
      u('NE_MATH_G8_TRANSFORMATIONS', 'Math G8: Transformations and Congruence', 'NATIVE_MATH_G8_TRANSFORMATIONS'),
    ],
  },
  NATIVE_SCIENCE: {
    1: [
      u('NE_SCI_G1_LIVING', 'Science G1: Weather and Living Things', 'NATIVE_SCIENCE_G1'),
      u('NE_SCI_G1_WEATHER', 'Science G1: Weather and Seasons', 'NATIVE_SCIENCE_G1_WEATHER'),
      u('NE_SCI_G1_MATERIALS', 'Science G1: Light, Sound, and Materials', 'NATIVE_SCIENCE_G1_MATERIALS'),
    ],
    2: [
      u('NE_SCI_G2_LIFE', 'Science G2: Plants, Animals, and Matter', 'NATIVE_SCIENCE_G2'),
      u('NE_SCI_G2_MATTER', 'Science G2: Solids, Liquids, and Changes', 'NATIVE_SCIENCE_G2_MATTER'),
      u('NE_SCI_G2_EARTH', 'Science G2: Land, Water, and Weather', 'NATIVE_SCIENCE_G2_EARTH'),
    ],
    3: [
      u('NE_SCI_G3_FORCES', 'Science G3: Habitats and Forces', 'NATIVE_SCIENCE_G3'),
      u('NE_SCI_G3_SYSTEMS', 'Science G3: Life Cycles and Earth Systems', 'NATIVE_SCIENCE_G3_SYSTEMS'),
      u('NE_SCI_G3_WEATHER_CLIMATE', 'Science G3: Weather and Climate', 'NATIVE_SCIENCE_G3_WEATHER_CLIMATE'),
    ],
    4: [
      u('NE_SCI_G4_ENERGY', 'Science G4: Energy and Waves', 'NATIVE_SCIENCE_G4_ENERGY'),
      u('NE_SCI_G4_EARTH', 'Science G4: Earth Changes', 'NATIVE_SCIENCE_G4_EARTH'),
      u('NE_SCI_G4_ORGANISMS', 'Science G4: Organisms and Environments', 'NATIVE_SCIENCE_G4_ORGANISMS'),
    ],
    5: [
      u('NE_SCI_G5_MATTER', 'Science G5: Matter and Mixtures', 'NATIVE_SCIENCE_G5_MATTER'),
      u('NE_SCI_G5_ECOSYSTEMS', 'Science G5: Ecosystems and Space', 'NATIVE_SCIENCE_G5_ECOSYSTEMS'),
      u('NE_SCI_G5_ENGINEERING', 'Science G5: Engineering Design', 'NATIVE_SCIENCE_G5_ENGINEERING'),
    ],
    6: [
      u('NE_SCI_G6_CELLS', 'Science G6: Cells and Body Systems', 'NATIVE_SCIENCE_G6_CELLS'),
      u('NE_SCI_G6_EARTH', 'Science G6: Earth Science', 'NATIVE_SCIENCE_G6_EARTH'),
      u('NE_SCI_G6_WEATHER_CLIMATE', 'Science G6: Weather and Climate', 'NATIVE_SCIENCE_G6_WEATHER_CLIMATE'),
    ],
    7: [
      u('NE_SCI_G7_LIFE', 'Science G7: Genetics and Ecology', 'NATIVE_SCIENCE_G7_LIFE'),
      u('NE_SCI_G7_PHYSICAL', 'Science G7: Physical Science', 'NATIVE_SCIENCE_G7_PHYSICAL'),
      u('NE_SCI_G7_ENERGY_TRANSFER', 'Science G7: Energy Transfer', 'NATIVE_SCIENCE_G7_ENERGY_TRANSFER'),
    ],
    8: [
      u('NE_SCI_G8_CHEMISTRY', 'Science G8: Chemistry Foundations', 'NATIVE_SCIENCE_G8_CHEMISTRY'),
      u('NE_SCI_G8_SPACE', 'Science G8: Space and Earth History', 'NATIVE_SCIENCE_G8_SPACE'),
      u('NE_SCI_G8_FORCES_MOTION', 'Science G8: Forces and Motion', 'NATIVE_SCIENCE_G8_FORCES_MOTION'),
    ],
  },
  NATIVE_SOCIAL: {
    1: [
      u('NE_SOC_G1_COMMUNITY', 'Social Studies G1: Community', 'NATIVE_SOCIAL_G1'),
      u('NE_SOC_G1_NEEDS_WANTS', 'Social Studies G1: Needs, Wants, and Jobs', 'NATIVE_SOCIAL_G1_NEEDS_WANTS'),
      u('NE_SOC_G1_CITIZENSHIP', 'Social Studies G1: Rules and Citizenship', 'NATIVE_SOCIAL_G1_CITIZENSHIP'),
      u('NE_SOC_G1_DIGITAL_KINDNESS', 'Social Studies G1: Digital Kindness and Safety', 'NATIVE_SOCIAL_G1_DIGITAL_KINDNESS'),
    ],
    2: [
      u('NE_SOC_G2_MAPS', 'Social Studies G2: Maps and Citizenship', 'NATIVE_SOCIAL_G2'),
      u('NE_SOC_G2_MAP_SKILLS', 'Social Studies G2: Map Skills', 'NATIVE_SOCIAL_G2_MAP_SKILLS'),
      u('NE_SOC_G2_HISTORY', 'Social Studies G2: Culture and History Sources', 'NATIVE_SOCIAL_G2_HISTORY'),
      u('NE_SOC_G2_HEALTHY_ROUTINES', 'Social Studies G2: Healthy Routines and Choices', 'NATIVE_SOCIAL_G2_HEALTHY_ROUTINES'),
    ],
    3: [
      u('NE_SOC_G3_REGIONS', 'Social Studies G3: Regions and History', 'NATIVE_SOCIAL_G3'),
      u('NE_SOC_G3_GOVERNMENT', 'Social Studies G3: Government and Economy', 'NATIVE_SOCIAL_G3_GOVERNMENT'),
      u('NE_SOC_G3_MAP_SKILLS', 'Social Studies G3: Map Skills and Regions', 'NATIVE_SOCIAL_G3_MAP_SKILLS'),
      u('NE_SOC_G3_DIGITAL_CITIZENSHIP', 'Social Studies G3: Digital Citizenship', 'NATIVE_SOCIAL_G3_DIGITAL_CITIZENSHIP'),
    ],
    4: [
      u('NE_SOC_G4_GEOGRAPHY', 'Social Studies G4: Geography and Regions', 'NATIVE_SOCIAL_G4_GEOGRAPHY'),
      u('NE_SOC_G4_HISTORY', 'Social Studies G4: State and Local History', 'NATIVE_SOCIAL_G4_HISTORY'),
      u('NE_SOC_G4_ECONOMICS', 'Social Studies G4: Economics and Resources', 'NATIVE_SOCIAL_G4_ECONOMICS'),
      u('NE_SOC_G4_STUDY_SKILLS', 'Social Studies G4: Study Skills and Goals', 'NATIVE_SOCIAL_G4_STUDY_SKILLS'),
    ],
    5: [
      u('NE_SOC_G5_US_HISTORY', 'Social Studies G5: U.S. History Foundations', 'NATIVE_SOCIAL_G5_US_HISTORY'),
      u('NE_SOC_G5_CIVICS', 'Social Studies G5: Civics and Economics', 'NATIVE_SOCIAL_G5_CIVICS'),
      u('NE_SOC_G5_GEOGRAPHY', 'Social Studies G5: Geography of the Americas', 'NATIVE_SOCIAL_G5_GEOGRAPHY'),
      u('NE_SOC_G5_FINANCIAL_LITERACY', 'Social Studies G5: Financial Literacy Basics', 'NATIVE_SOCIAL_G5_FINANCIAL_LITERACY'),
    ],
    6: [
      u('NE_SOC_G6_WORLD_GEO', 'Social Studies G6: World Geography', 'NATIVE_SOCIAL_G6_WORLD_GEO'),
      u('NE_SOC_G6_ANCIENT', 'Social Studies G6: Ancient Civilizations', 'NATIVE_SOCIAL_G6_ANCIENT'),
      u('NE_SOC_G6_WORLD_CULTURES', 'Social Studies G6: World Cultures', 'NATIVE_SOCIAL_G6_WORLD_CULTURES'),
      u('NE_SOC_G6_ONLINE_PRIVACY', 'Social Studies G6: Online Safety and Privacy', 'NATIVE_SOCIAL_G6_ONLINE_PRIVACY'),
    ],
    7: [
      u('NE_SOC_G7_MEDIEVAL', 'Social Studies G7: Medieval and Early Modern World', 'NATIVE_SOCIAL_G7_MEDIEVAL'),
      u('NE_SOC_G7_CIVICS', 'Social Studies G7: Civics and Global Issues', 'NATIVE_SOCIAL_G7_CIVICS'),
      u('NE_SOC_G7_ECONOMICS', 'Social Studies G7: Economics and Trade', 'NATIVE_SOCIAL_G7_ECONOMICS'),
      u('NE_SOC_G7_MEDIA_BALANCE', 'Social Studies G7: Media Balance and Well-Being', 'NATIVE_SOCIAL_G7_MEDIA_BALANCE'),
    ],
    8: [
      u('NE_SOC_G8_US_HISTORY', 'Social Studies G8: U.S. History and Constitution', 'NATIVE_SOCIAL_G8_US_HISTORY'),
      u('NE_SOC_G8_CIVICS', 'Social Studies G8: Government, Rights, and Media', 'NATIVE_SOCIAL_G8_CIVICS'),
      u('NE_SOC_G8_MEDIA_LITERACY', 'Social Studies G8: Media Literacy and Public Issues', 'NATIVE_SOCIAL_G8_MEDIA_LITERACY'),
      u('NE_SOC_G8_CAREER_AWARENESS', 'Social Studies G8: Career Awareness and Problem Solving', 'NATIVE_SOCIAL_G8_CAREER_AWARENESS'),
    ],
  },
  NATIVE_JAPANESE: {
    1: [
      u('NE_JPN_G1_HIRAGANA', 'Japanese G1: Hiragana and First Words', 'NATIVE_JAPANESE_G1'),
      u('NE_JPN_G1_GREETINGS', 'Japanese G1: Greetings and Classroom Phrases', 'NATIVE_JAPANESE_G1_GREETINGS'),
      u('NE_JPN_G1_NUMBERS', 'Japanese G1: Numbers and Colors', 'NATIVE_JAPANESE_G1_NUMBERS'),
    ],
    2: [
      u('NE_JPN_G2_KATAKANA', 'Japanese G2: Katakana and Loanwords', 'NATIVE_JAPANESE_G2'),
      u('NE_JPN_G2_SENTENCES', 'Japanese G2: Simple Sentences', 'NATIVE_JAPANESE_G2_SENTENCES'),
      u('NE_JPN_G2_FAMILY', 'Japanese G2: Family and Daily Words', 'NATIVE_JAPANESE_G2_FAMILY'),
    ],
    3: [
      u('NE_JPN_G3_PARTICLES', 'Japanese G3: Particles and Questions', 'NATIVE_JAPANESE_G3'),
      u('NE_JPN_G3_KANJI', 'Japanese G3: First Kanji and Radicals', 'NATIVE_JAPANESE_G3_KANJI'),
      u('NE_JPN_G3_TIME', 'Japanese G3: Time and Schedules', 'NATIVE_JAPANESE_G3_TIME'),
    ],
    4: [
      u('NE_JPN_G4_VERBS', 'Japanese G4: Verbs and Polite Forms', 'NATIVE_JAPANESE_G4_VERBS'),
      u('NE_JPN_G4_READING', 'Japanese G4: Short Reading Passages', 'NATIVE_JAPANESE_G4_READING'),
      u('NE_JPN_G4_SHOPPING', 'Japanese G4: Shopping and Menus', 'NATIVE_JAPANESE_G4_SHOPPING'),
    ],
    5: [
      u('NE_JPN_G5_ADJECTIVES', 'Japanese G5: Adjectives and Descriptions', 'NATIVE_JAPANESE_G5_ADJECTIVES'),
      u('NE_JPN_G5_DAILY_LIFE', 'Japanese G5: Daily Life Communication', 'NATIVE_JAPANESE_G5_DAILY_LIFE'),
      u('NE_JPN_G5_SCHOOL_LIFE', 'Japanese G5: School Life', 'NATIVE_JAPANESE_G5_SCHOOL_LIFE'),
    ],
    6: [
      u('NE_JPN_G6_CONNECTORS', 'Japanese G6: Connectors and Longer Sentences', 'NATIVE_JAPANESE_G6_CONNECTORS'),
      u('NE_JPN_G6_CULTURE', 'Japanese G6: Culture and Practical Reading', 'NATIVE_JAPANESE_G6_CULTURE'),
      u('NE_JPN_G6_TRAVEL', 'Japanese G6: Travel and Directions', 'NATIVE_JAPANESE_G6_TRAVEL'),
    ],
    7: [
      u('NE_JPN_G7_CONVERSATION', 'Japanese G7: Conversation and Opinions', 'NATIVE_JAPANESE_G7_CONVERSATION'),
      u('NE_JPN_G7_READING', 'Japanese G7: Reading with Kanji', 'NATIVE_JAPANESE_G7_READING'),
      u('NE_JPN_G7_MEDIA', 'Japanese G7: Media and Messages', 'NATIVE_JAPANESE_G7_MEDIA'),
    ],
    8: [
      u('NE_JPN_G8_GRAMMAR', 'Japanese G8: Grammar Review and Nuance', 'NATIVE_JAPANESE_G8_GRAMMAR'),
      u('NE_JPN_G8_MEDIA', 'Japanese G8: Media, Signs, and Everyday Texts', 'NATIVE_JAPANESE_G8_MEDIA'),
      u('NE_JPN_G8_CULTURE_PROJECT', 'Japanese G8: Culture Project and Presentation', 'NATIVE_JAPANESE_G8_CULTURE_PROJECT'),
    ],
  },
};
