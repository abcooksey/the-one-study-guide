export interface EncouragementMessage {
  text: string;
  subtext?: string;
  imageUrl: string;
  imageAlt: string;
}

export interface MessagePool {
  doingWell: EncouragementMessage[];
  struggling: EncouragementMessage[];
}

// 50% milestone messages (10 out of 20 questions answered)
export const fiftyPercentMessages: MessagePool = {
  doingWell: [
    {
      text: "You're halfway there and crushing it!",
      subtext: "Even Gandalf would be impressed with your knowledge.",
      imageUrl: "https://media.giphy.com/media/TcdpZwYDPlWXC/giphy.gif",
      imageAlt: "Gandalf nodding approvingly",
    },
    {
      text: "The Ring couldn't corrupt you, and neither can these questions!",
      subtext: "Your LOTR mastery is showing.",
      imageUrl: "https://media.giphy.com/media/14hMBBzd9fRJgA/giphy.gif",
      imageAlt: "Frodo looking determined",
    },
    {
      text: "Halfway through and you're slaying it!",
      subtext: "You fight like you've got the Army of the Dead behind you.",
      imageUrl: "https://media.giphy.com/media/11JTxkrmq4bGE0/giphy.gif",
      imageAlt: "Aragorn being heroic",
    },
    {
      text: "A wizard is never wrong, nor is he right too early...",
      subtext: "But you? You're right exactly when you mean to be!",
      imageUrl: "https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif",
      imageAlt: "Gandalf smiling wisely",
    },
  ],
  struggling: [
    {
      text: "Even Frodo stumbled on his journey to Mount Doom.",
      subtext: "Keep going - the road is long but you've got this!",
      imageUrl: "https://media.giphy.com/media/lqczWksNBr4HK/giphy.gif",
      imageAlt: "One does not simply walk into Mordor meme",
    },
    {
      text: "The road goes ever on and on...",
      subtext: "And so do you! Every step counts.",
      imageUrl: "https://media.giphy.com/media/1BiKKKBCXlQhq/giphy.gif",
      imageAlt: "Sam encouraging",
    },
    {
      text: "Not all those who wander are lost!",
      subtext: "You're finding your way through Middle-earth.",
      imageUrl: "https://media.giphy.com/media/HLjmfDAaDJmWQ/giphy.gif",
      imageAlt: "Fellowship walking",
    },
    {
      text: "Even the greatest heroes face challenges.",
      subtext: "Aragorn didn't become king in a day!",
      imageUrl: "https://media.giphy.com/media/njYrp176NQsHS/giphy.gif",
      imageAlt: "Aragorn looking thoughtful",
    },
  ],
};

// 75% milestone messages (15 out of 20 questions answered)
export const seventyFivePercentMessages: MessagePool = {
  doingWell: [
    {
      text: "Just 5 more questions! You're returning like a king!",
      subtext: "Your coronation awaits.",
      imageUrl: "https://media.giphy.com/media/11JTxkrmq4bGE0/giphy.gif",
      imageAlt: "Aragorn at his coronation",
    },
    {
      text: "Almost there! Your LOTR knowledge is legendary!",
      subtext: "Even the Elves would be impressed.",
      imageUrl: "https://media.giphy.com/media/10p3Q4u9Nfahpu/giphy.gif",
      imageAlt: "Legolas looking impressed",
    },
    {
      text: "The beacons are lit! Victory is near!",
      subtext: "5 questions stand between you and triumph.",
      imageUrl: "https://media.giphy.com/media/3ohfFm8e0JRnh4hdwQ/giphy.gif",
      imageAlt: "The beacons being lit",
    },
    {
      text: "You bow to no one with knowledge like this!",
      subtext: "The final stretch awaits, champion.",
      imageUrl: "https://media.giphy.com/media/d5qLPAaGNVQ3K/giphy.gif",
      imageAlt: "Hobbits being honored",
    },
  ],
  struggling: [
    {
      text: "Just 5 more! Even the smallest person can change the course of the future.",
      subtext: "Channel your inner hobbit courage!",
      imageUrl: "https://media.giphy.com/media/ERMGXqtKTDKHC/giphy.gif",
      imageAlt: "Galadriel speaking wisdom",
    },
    {
      text: "The final stretch! Channel your inner Samwise!",
      subtext: "\"I can't carry it for you, but I can carry you!\"",
      imageUrl: "https://media.giphy.com/media/TKjsEV8bDIJzy/giphy.gif",
      imageAlt: "Sam carrying Frodo",
    },
    {
      text: "There's some good in this world... and it's worth fighting for!",
      subtext: "5 questions to go. You've got this!",
      imageUrl: "https://media.giphy.com/media/1BiKKKBCXlQhq/giphy.gif",
      imageAlt: "Sam being inspirational",
    },
    {
      text: "The eagles are coming! ...Metaphorically.",
      subtext: "Just a few more questions to your victory!",
      imageUrl: "https://media.giphy.com/media/xUOwGaK6xtFRwkgA2Q/giphy.gif",
      imageAlt: "Eagles flying in",
    },
  ],
};

export function getRandomMessage(
  milestone: 50 | 75,
  isDoingWell: boolean
): EncouragementMessage {
  const pool = milestone === 50 ? fiftyPercentMessages : seventyFivePercentMessages;
  const messages = isDoingWell ? pool.doingWell : pool.struggling;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}
