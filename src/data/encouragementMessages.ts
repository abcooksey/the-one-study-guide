import { Profile } from '../types';

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
      imageUrl: "/images/gandalf-success.gif",
      imageAlt: "Gandalf celebrating",
    },
    {
      text: "The Ring couldn't corrupt you, and neither can these questions!",
      subtext: "Your LOTR mastery is showing.",
      imageUrl: "/images/aragorn-success.gif",
      imageAlt: "Aragorn victorious",
    },
    {
      text: "Halfway through and you're slaying it!",
      subtext: "You fight like you've got the Army of the Dead behind you.",
      imageUrl: "/images/aragorn-success2.gif",
      imageAlt: "Aragorn being heroic",
    },
    {
      text: "A wizard is never wrong, nor is he right too early...",
      subtext: "But you? You're right exactly when you mean to be!",
      imageUrl: "/images/gimli-success.gif",
      imageAlt: "Gimli celebrating",
    },
  ],
  struggling: [
    {
      text: "Even Frodo stumbled on his journey to Mount Doom.",
      subtext: "Keep going - the road is long but you've got this!",
      imageUrl: "/images/gollum-struggle.gif",
      imageAlt: "Gollum struggling",
    },
    {
      text: "The road goes ever on and on...",
      subtext: "And so do you! Every step counts.",
      imageUrl: "/images/aragorn-struggle.gif",
      imageAlt: "Aragorn in a tough moment",
    },
    {
      text: "Not all those who wander are lost!",
      subtext: "You're finding your way through Middle-earth.",
      imageUrl: "/images/arwen-struggle.gif",
      imageAlt: "Arwen looking determined",
    },
    {
      text: "Even the greatest heroes face challenges.",
      subtext: "Aragorn didn't become king in a day!",
      imageUrl: "/images/denethor-struggle.gif",
      imageAlt: "Denethor in despair",
    },
  ],
};

// 75% milestone messages (15 out of 20 questions answered)
export const seventyFivePercentMessages: MessagePool = {
  doingWell: [
    {
      text: "Just 5 more questions! You're returning like a king!",
      subtext: "Your coronation awaits.",
      imageUrl: "/images/aragorn-success.gif",
      imageAlt: "Aragorn victorious",
    },
    {
      text: "Almost there! Your LOTR knowledge is legendary!",
      subtext: "Even the Elves would be impressed.",
      imageUrl: "/images/gimli-success.gif",
      imageAlt: "Gimli celebrating",
    },
    {
      text: "The beacons are lit! Victory is near!",
      subtext: "5 questions stand between you and triumph.",
      imageUrl: "/images/theoden-success.gif",
      imageAlt: "Theoden rallying the troops",
    },
    {
      text: "You bow to no one with knowledge like this!",
      subtext: "The final stretch awaits, champion.",
      imageUrl: "/images/hobbits-success.gif",
      imageAlt: "Hobbits celebrating",
    },
  ],
  struggling: [
    {
      text: "Just 5 more! Even the smallest person can change the course of the future.",
      subtext: "Channel your inner hobbit courage!",
      imageUrl: "/images/arwen-struggle.gif",
      imageAlt: "Arwen looking determined",
    },
    {
      text: "The final stretch! Channel your inner Samwise!",
      subtext: "\"I can't carry it for you, but I can carry you!\"",
      imageUrl: "/images/aragorn-struggle.gif",
      imageAlt: "Aragorn in a tough moment",
    },
    {
      text: "There's some good in this world... and it's worth fighting for!",
      subtext: "5 questions to go. You've got this!",
      imageUrl: "/images/gollum-struggle.gif",
      imageAlt: "Gollum struggling",
    },
    {
      text: "The eagles are coming! ...Metaphorically.",
      subtext: "Just a few more questions to your victory!",
      imageUrl: "/images/denethor-struggle.gif",
      imageAlt: "Denethor in despair",
    },
  ],
};

// Special flirty messages for Angus
export const angusFiftyPercentMessages: MessagePool = {
  doingWell: [
    {
      text: "Halfway there, handsome!",
      subtext: "Your LOTR knowledge is almost as impressive as your looks.",
      imageUrl: "/images/aragorn-success.gif",
      imageAlt: "Aragorn victorious",
    },
    {
      text: "You're the Aragorn to my Arwen.",
      subtext: "And you're crushing this quiz like I crush on you!",
      imageUrl: "/images/gandalf-success.gif",
      imageAlt: "Gandalf celebrating",
    },
    {
      text: "Is it hot in here or is it just your trivia skills?",
      subtext: "10 down, 10 to go. You've got this, babe.",
      imageUrl: "/images/gimli-success.gif",
      imageAlt: "Gimli celebrating",
    },
    {
      text: "One does not simply... look this good while acing trivia.",
      subtext: "But somehow you manage it.",
      imageUrl: "/images/aragorn-success2.gif",
      imageAlt: "Aragorn being heroic",
    },
  ],
  struggling: [
    {
      text: "Even if you lose, you're still my precious.",
      subtext: "But like, in a less creepy way.",
      imageUrl: "/images/gollum-struggle.gif",
      imageAlt: "Gollum struggling",
    },
    {
      text: "Struggling a bit? That's okay, you're still cute.",
      subtext: "I believe in you more than Sam believes in Frodo.",
      imageUrl: "/images/aragorn-struggle.gif",
      imageAlt: "Aragorn in a tough moment",
    },
    {
      text: "The road goes ever on... and I'd walk it with you.",
      subtext: "Even if you get every question wrong. But please don't.",
      imageUrl: "/images/arwen-struggle.gif",
      imageAlt: "Arwen looking determined",
    },
    {
      text: "You may not have the Ring, but you've got my heart.",
      subtext: "Now focus up and get these last 10 right!",
      imageUrl: "/images/denethor-struggle.gif",
      imageAlt: "Denethor in despair",
    },
  ],
};

export const angusSeventyFivePercentMessages: MessagePool = {
  doingWell: [
    {
      text: "5 more questions and then we can make out.",
      subtext: "I mean, celebrate. We can celebrate.",
      imageUrl: "/images/aragorn-success.gif",
      imageAlt: "Aragorn victorious",
    },
    {
      text: "You're doing amazing, sweetie!",
      subtext: "Almost as amazing as you look right now.",
      imageUrl: "/images/gimli-success.gif",
      imageAlt: "Gimli celebrating",
    },
    {
      text: "The beacons are lit! And so is my love for you.",
      subtext: "That was cheesy. I regret nothing. 5 more to go!",
      imageUrl: "/images/theoden-success.gif",
      imageAlt: "Theoden rallying the troops",
    },
    {
      text: "You bow to no one... except maybe me.",
      subtext: "Kidding! Finish strong, champion.",
      imageUrl: "/images/hobbits-success.gif",
      imageAlt: "Hobbits celebrating",
    },
  ],
  struggling: [
    {
      text: "Hey, even if trivia isn't your thing...",
      subtext: "You're still the most precious thing in my life. Now FOCUS.",
      imageUrl: "/images/arwen-struggle.gif",
      imageAlt: "Arwen looking determined",
    },
    {
      text: "I can't carry these answers for you...",
      subtext: "But I CAN feed you a Monty Moose after. 5 more questions!",
      imageUrl: "/images/aragorn-struggle.gif",
      imageAlt: "Aragorn in a tough moment",
    },
    {
      text: "Win or lose, you're coming home with me.",
      subtext: "But winning would be sexier, just saying.",
      imageUrl: "/images/gollum-struggle.gif",
      imageAlt: "Gollum struggling",
    },
    {
      text: "The eagles are coming to save you!",
      subtext: "JK, it's just me cheering you on. You've got this, babe!",
      imageUrl: "/images/denethor-struggle.gif",
      imageAlt: "Denethor in despair",
    },
  ],
};

export function getRandomMessage(
  milestone: 50 | 75,
  isDoingWell: boolean,
  profile?: Profile
): EncouragementMessage {
  // Use Angus-specific messages if profile is Angus
  let pool: MessagePool;
  if (profile === 'Angus') {
    pool = milestone === 50 ? angusFiftyPercentMessages : angusSeventyFivePercentMessages;
  } else {
    pool = milestone === 50 ? fiftyPercentMessages : seventyFivePercentMessages;
  }

  const messages = isDoingWell ? pool.doingWell : pool.struggling;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}
