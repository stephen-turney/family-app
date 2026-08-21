// Picture library for chores and routine steps.
//
// Young kids who can't read yet navigate their list by picture, so every row gets
// one. The built-in library uses emoji, and a picker value may instead be an
// uploaded image data URL.
//
// A task's picture is resolved in three steps: an explicitly chosen `icon`, else a
// keyword match against the title, else DEFAULT_ICON. That means existing chores
// light up with sensible pictures with no migration or data entry.

export const DEFAULT_ICON = '📋';
export const DEFAULT_COMPLETED_ICON = '✅';

export function isUploadedImage(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

// `keywords` are matched as whole words, so multi-word keys ('make bed') are more
// specific than single words ('bed') and win. Avoid giving the same single word to
// two entries — put it on the more common task instead (e.g. bare 'lunch' → 🥪).
export const ICON_GROUPS = [
  {
    group: 'Morning',
    items: [
      { icon: '⏰', label: 'Wake up', keywords: ['wake up', 'wake', 'alarm', 'get up'] },
      { icon: '🛏️', label: 'Make the bed', keywords: ['make bed', 'bed', 'blankets', 'sheets', 'tidy bed'] },
      { icon: '😁', label: 'Brush teeth', keywords: ['brush teeth', 'teeth', 'tooth', 'toothbrush', 'brush'] },
      { icon: '🧼', label: 'Wash up', keywords: ['wash hands', 'wash face', 'soap', 'wash'] },
      { icon: '🚿', label: 'Shower', keywords: ['shower'] },
      { icon: '🛁', label: 'Take a bath', keywords: ['bath', 'bathe', 'tub'] },
      { icon: '🚽', label: 'Potty', keywords: ['potty', 'toilet', 'flush', 'bathroom'] },
      { icon: '💇', label: 'Brush hair', keywords: ['brush hair', 'hair', 'comb', 'ponytail'] },
      { icon: '🧴', label: 'Sunscreen', keywords: ['sunscreen', 'sunblock', 'lotion'] },
    ],
  },
  {
    group: 'Getting dressed',
    items: [
      { icon: '👕', label: 'Get dressed', keywords: ['get dressed', 'dressed', 'clothes', 'shirt', 'outfit'] },
      { icon: '🧦', label: 'Socks', keywords: ['socks', 'sock'] },
      { icon: '👟', label: 'Shoes on', keywords: ['shoes', 'sneakers', 'boots', 'laces'] },
      { icon: '🧥', label: 'Coat', keywords: ['coat', 'jacket', 'raincoat'] },
      { icon: '🧢', label: 'Hat', keywords: ['hat', 'cap', 'helmet'] },
      { icon: '👚', label: 'Put clothes away', keywords: ['put away clothes', 'clothes away', 'closet', 'drawer'] },
    ],
  },
  {
    group: 'School',
    items: [
      { icon: '🎒', label: 'Pack backpack', keywords: ['pack backpack', 'backpack', 'book bag', 'bookbag'] },
      { icon: '🍱', label: 'Pack lunch', keywords: ['pack lunch', 'lunch', 'lunchbox', 'lunch box', 'sandwich'] },
      { icon: '🚌', label: 'Catch the bus', keywords: ['bus', 'school bus'] },
      { icon: '🏫', label: 'Go to school', keywords: ['school', 'go to school'] },
      { icon: '📝', label: 'Homework', keywords: ['homework', 'schoolwork', 'worksheet', 'study'] },
      { icon: '📖', label: 'Read a book', keywords: ['read', 'reading', 'book', 'story', 'storytime'] },
      { icon: '✏️', label: 'Practice writing', keywords: ['writing', 'handwriting', 'letters', 'spelling'] },
      { icon: '🔢', label: 'Practice numbers', keywords: ['math', 'numbers', 'counting', 'flashcards'] },
      { icon: '📚', label: 'Put books away', keywords: ['put away books', 'books away', 'bookshelf'] },
    ],
  },
  {
    group: 'Meals & kitchen',
    items: [
      { icon: '🍳', label: 'Breakfast', keywords: ['breakfast', 'eat breakfast', 'cereal'] },
      { icon: '🥗', label: 'Eat lunch', keywords: ['eat lunch'] },
      { icon: '🍽️', label: 'Dinner', keywords: ['dinner', 'supper', 'eat dinner'] },
      { icon: '🍎', label: 'Snack', keywords: ['snack', 'fruit', 'apple'] },
      { icon: '🚰', label: 'Drink water', keywords: ['drink water', 'water bottle', 'hydrate', 'drink'] },
      { icon: '🧑‍🍳', label: 'Help cook', keywords: ['cook', 'help cook', 'make dinner', 'baking', 'bake'] },
      { icon: '🍴', label: 'Set the table', keywords: ['set table', 'set the table', 'silverware', 'napkins'] },
      { icon: '🍽️', label: 'Dishes', keywords: ['dishes', 'wash dishes', 'dishwasher', 'load dishwasher', 'unload dishwasher'] },
      { icon: '🫧', label: 'Clear the table', keywords: ['clear table', 'clear the table', 'wipe table', 'wipe counter'] },
      { icon: '🛒', label: 'Groceries', keywords: ['groceries', 'grocery', 'shopping', 'store'] },
    ],
  },
  {
    group: 'Cleaning up',
    items: [
      { icon: '🚂', label: 'Pick up toys', keywords: ['toys', 'pick up toys', 'clean up toys', 'tidy toys', 'blocks'] },
      { icon: '🧹', label: 'Sweep', keywords: ['sweep', 'broom', 'clean', 'tidy', 'clean up'] },
      { icon: '🪣', label: 'Mop', keywords: ['mop', 'bucket', 'scrub floor'] },
      { icon: '🗑️', label: 'Take out trash', keywords: ['trash', 'garbage', 'take out trash', 'bin', 'rubbish'] },
      { icon: '♻️', label: 'Recycling', keywords: ['recycling', 'recycle', 'bottles', 'cans'] },
      { icon: '👕', label: 'Laundry', keywords: ['laundry', 'wash clothes', 'hamper', 'dirty clothes'] },
      { icon: '🧷', label: 'Fold laundry', keywords: ['fold laundry', 'fold clothes', 'folding', 'fold'] },
      { icon: '🛋️', label: 'Tidy the room', keywords: ['tidy room', 'clean room', 'living room', 'straighten'] },
      { icon: '🪟', label: 'Clean windows', keywords: ['windows', 'window', 'mirrors'] },
      { icon: '🚪', label: 'Close the door', keywords: ['door', 'close door', 'shut door'] },
      { icon: '💡', label: 'Turn off lights', keywords: ['lights', 'turn off lights', 'lights out', 'lamp'] },
    ],
  },
  {
    group: 'Pets',
    items: [
      { icon: '🐕', label: 'Feed the dog', keywords: ['feed dog', 'dog', 'dog food', 'puppy'] },
      { icon: '🦮', label: 'Walk the dog', keywords: ['walk dog', 'walk the dog', 'dog walk'] },
      { icon: '🐈', label: 'Feed the cat', keywords: ['feed cat', 'cat', 'kitten', 'litter', 'litter box'] },
      { icon: '🐟', label: 'Feed the fish', keywords: ['fish', 'feed fish', 'aquarium'] },
      { icon: '🐹', label: 'Small pet', keywords: ['hamster', 'guinea pig', 'rabbit', 'bunny'] },
      { icon: '🐦', label: 'Feed the bird', keywords: ['bird', 'feed bird', 'parakeet'] },
      { icon: '💧', label: 'Pet water', keywords: ['pet water', 'water bowl', 'refill bowl'] },
    ],
  },
  {
    group: 'Outside',
    items: [
      { icon: '🪴', label: 'Water the plants', keywords: ['water plants', 'plants', 'flowers', 'garden'] },
      { icon: '🍂', label: 'Rake leaves', keywords: ['rake', 'leaves'] },
      { icon: '🌿', label: 'Pull weeds', keywords: ['weeds', 'weeding', 'weed'] },
      { icon: '✂️', label: 'Mow the lawn', keywords: ['mow', 'lawn', 'grass', 'trim'] },
      { icon: '❄️', label: 'Shovel snow', keywords: ['shovel', 'snow', 'ice'] },
      { icon: '🏡', label: 'Yard work', keywords: ['yard', 'yard work', 'outside chores'] },
      { icon: '🚲', label: 'Ride bike', keywords: ['bike', 'bicycle', 'ride bike', 'scooter'] },
      { icon: '🌞', label: 'Play outside', keywords: ['play outside', 'outside', 'outdoors', 'playground'] },
      { icon: '📬', label: 'Get the mail', keywords: ['mail', 'get mail', 'mailbox', 'post'] },
    ],
  },
  {
    group: 'Play & screens',
    items: [
      { icon: '⚽', label: 'Sports practice', keywords: ['soccer', 'sports', 'practice', 'ball', 'baseball', 'basketball'] },
      { icon: '🏊', label: 'Swimming', keywords: ['swim', 'swimming', 'pool'] },
      { icon: '🎵', label: 'Practice music', keywords: ['practice piano', 'piano', 'violin', 'music', 'instrument', 'guitar'] },
      { icon: '🎨', label: 'Art time', keywords: ['art', 'color', 'coloring', 'draw', 'drawing', 'paint', 'crayons'] },
      { icon: '🧩', label: 'Puzzle', keywords: ['puzzle', 'puzzles', 'lego', 'legos'] },
      { icon: '💻', label: 'Screen time', keywords: ['screen time', 'screen', 'tablet', 'ipad', 'computer'] },
      { icon: '📺', label: 'TV time', keywords: ['tv', 'television', 'show', 'movie'] },
      { icon: '🎮', label: 'Video games', keywords: ['video games', 'games', 'game', 'xbox', 'switch', 'playstation'] },
    ],
  },
  {
    group: 'Bedtime',
    items: [
      { icon: '🛌', label: 'Go to bed', keywords: ['bedtime', 'go to bed', 'sleep', 'goodnight', 'night night'] },
      { icon: '👖', label: 'Put on pajamas', keywords: ['pajamas', 'pyjamas', 'pjs', 'nightgown'] },
      { icon: '😴', label: 'Nap', keywords: ['nap', 'rest', 'quiet rest'] },
      { icon: '🌙', label: 'Wind down', keywords: ['wind down', 'calm down', 'settle'] },
    ],
  },
  {
    group: 'Health & feelings',
    items: [
      { icon: '💊', label: 'Vitamins', keywords: ['vitamin', 'vitamins', 'medicine', 'meds', 'pills', 'inhaler'] },
      { icon: '🏃', label: 'Exercise', keywords: ['exercise', 'workout', 'stretch', 'run', 'jump'] },
      { icon: '🧘', label: 'Quiet time', keywords: ['quiet time', 'breathe', 'calm', 'meditate', 'mindful'] },
      { icon: '🦷', label: 'Floss', keywords: ['floss', 'flossing'] },
      { icon: '🩹', label: 'Bandage', keywords: ['bandage', 'boo boo', 'first aid'] },
    ],
  },
  {
    group: 'Kindness',
    items: [
      { icon: '🤝', label: 'Be a helper', keywords: ['help', 'helper', 'be helpful', 'chores'] },
      { icon: '❤️', label: 'Be kind', keywords: ['kind', 'kindness', 'be nice', 'nice'] },
      { icon: '🧑‍🤝‍🧑', label: 'Share & take turns', keywords: ['share', 'sharing', 'take turns', 'turns'] },
      { icon: '💌', label: 'Thank you note', keywords: ['thank you', 'note', 'card', 'letter'] },
      { icon: '📞', label: 'Call family', keywords: ['call', 'phone', 'facetime', 'grandma', 'grandpa'] },
      { icon: '🙏', label: 'Prayers', keywords: ['pray', 'prayers', 'prayer'] },
    ],
  },
  {
    group: 'Other',
    items: [
      { icon: '⭐', label: 'Something special', keywords: ['special', 'bonus', 'reward', 'treat'] },
      { icon: '🎯', label: 'Goal', keywords: ['goal', 'target'] },
      { icon: '🎂', label: 'Birthday', keywords: ['birthday', 'party'] },
      { icon: '🧳', label: 'Pack a bag', keywords: ['pack bag', 'suitcase', 'packing', 'trip'] },
      { icon: '💰', label: 'Allowance', keywords: ['allowance', 'money', 'save', 'piggy bank'] },
      { icon: '📋', label: 'Task', keywords: ['task', 'todo', 'to do'] },
    ],
  },
];

export const ALL_ICONS = ICON_GROUPS.flatMap((g) => g.items);

// Split into lowercase words, and add a naive singular for each so "toys"
// matches the "toy" keyword and "dishes" matches "dish".
function wordsOf(text) {
  const set = new Set();
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .forEach((w) => {
      set.add(w);
      if (w.endsWith('es') && w.length > 3) set.add(w.slice(0, -2));
      if (w.endsWith('s') && w.length > 2) set.add(w.slice(0, -1));
    });
  return set;
}

// Best keyword match for a task title, or null. A keyword matches when every one
// of its words is present in the title, so more words = a more specific match.
export function iconForTitle(title) {
  const words = wordsOf(title);
  if (words.size === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const item of ALL_ICONS) {
    for (const keyword of item.keywords) {
      const parts = keyword.split(' ');
      if (!parts.every((p) => words.has(p))) continue;
      // More words beats fewer; longer string breaks ties.
      const score = parts.length * 100 + keyword.length;
      if (score > bestScore) {
        bestScore = score;
        best = item.icon;
      }
    }
  }
  return best;
}

// The picture to show for a chore / routine step: explicit choice, then keyword
// match on the title, then the generic fallback.
export function resolveIcon(task) {
  return task?.icon || iconForTitle(task?.title) || DEFAULT_ICON;
}

// A completed step may have its own chosen picture. Older steps have no value
// in this column, so they use one consistent, unmistakable done image.
export function resolveCompletedIcon(task) {
  return task?.completed_icon || DEFAULT_COMPLETED_ICON;
}

// Free-text search over labels and keywords, for the picker's search box.
export function searchIcons(query) {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_ICONS;
  return ALL_ICONS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)) ||
      item.icon === q
  );
}
