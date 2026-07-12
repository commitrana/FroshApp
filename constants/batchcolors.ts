// All 20 batches — 10 colors x A/B section.
// Each one is PERMANENTLY linked to exactly one fruit image below.
// If a student's batch is changed (e.g. RedB -> RedA), the image shown
// changes automatically, because the image belongs to the batch, not the student.
export const ALL_BATCHES = [
  "RedA", "RedB",
  "BlueA", "BlueB",
  "BlackA", "BlackB",
  "PinkA", "PinkB",
  "PurpleA", "PurpleB",
  "YellowA", "YellowB",
  "GreenA", "GreenB",
  "OrangeA", "OrangeB",
  "WhiteA", "WhiteB",
  "BrownA", "BrownB",
] as const;

export type BatchCode = (typeof ALL_BATCHES)[number];

// IMPORTANT: these files must exist at assets/bootcamp/<name>.jpg
// or the app will fail to bundle. See the table in chat for exact filenames.
export const BATCH_IMAGES: Record<BatchCode, any> = {
  RedA: require("../assets/bootcamp/apple.jpg"),
  RedB: require("../assets/bootcamp/banana.jpg"),
  BlueA: require("../assets/bootcamp/blackberry.jpg"),
  BlueB: require("../assets/bootcamp/blueberry.jpg"),
  BlackA: require("../assets/bootcamp/cherries.jpg"),
  BlackB: require("../assets/bootcamp/dragonfruit.jpg"),
  PinkA: require("../assets/bootcamp/grapes.jpg"),
  PinkB: require("../assets/bootcamp/guava.jpg"),
  PurpleA: require("../assets/bootcamp/kiwi.jpg"),
  PurpleB: require("../assets/bootcamp/litchi.jpg"),
  YellowA: require("../assets/bootcamp/mango.jpg"),
  YellowB: require("../assets/bootcamp/muskmelon.jpg"),
  GreenA: require("../assets/bootcamp/orange.jpg"),
  GreenB: require("../assets/bootcamp/papaya.jpg"),
  OrangeA: require("../assets/bootcamp/peach.jpg"),
  OrangeB: require("../assets/bootcamp/pear.jpg"),
  WhiteA: require("../assets/bootcamp/pineapple.jpg"),
  WhiteB: require("../assets/bootcamp/pomegranate.jpg"),
  BrownA: require("../assets/bootcamp/strawberry.jpg"),
  BrownB: require("../assets/bootcamp/watermelon.jpg"),
};

// Human-friendly fruit name per batch, e.g. for "Your batch: RedA (Apple)"
export const BATCH_FRUIT_NAMES: Record<BatchCode, string> = {
  RedA: "Apple",
  RedB: "Banana",
  BlueA: "Blackberry",
  BlueB: "Blueberry",
  BlackA: "Cherries",
  BlackB: "Dragon Fruit",
  PinkA: "Grapes",
  PinkB: "Guava",
  PurpleA: "Kiwi",
  PurpleB: "Litchi",
  YellowA: "Mango",
  YellowB: "Muskmelon",
  GreenA: "Orange",
  GreenB: "Papaya",
  OrangeA: "Peach",
  OrangeB: "Pear",
  WhiteA: "Pineapple",
  WhiteB: "Pomegranate",
  BrownA: "Strawberry",
  BrownB: "Watermelon",
};

const isValidBatch = (batch: string | null): batch is BatchCode =>
  !!batch && (ALL_BATCHES as readonly string[]).includes(batch);

// Returns the local image asset for a batch code like "RedA", or null.
export const getBatchImage = (batch: string | null) => {
  return isValidBatch(batch) ? BATCH_IMAGES[batch] : null;
};

// Returns the fruit name for a batch code like "RedA" -> "Apple", or null.
export const getBatchFruitName = (batch: string | null): string | null => {
  return isValidBatch(batch) ? BATCH_FRUIT_NAMES[batch] : null;
};