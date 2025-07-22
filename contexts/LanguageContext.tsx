// contexts/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr' | 'es' | 'rw' | 'sw';

interface TranslationKeys {
  // Add all translation keys here
  home: string;
  dailyVictories: string;
  missions: string;
  community: string;
  welcome: string;
  tagline: string;
  hello: string;
  todaysMission: string;
  learnTogether: string;
  duration: string;
  points: string;
  difficulty: string;
  startLearning: string;
  hearFromNimi: string;
  previewMission: string;
  dailyMissions: string;
  waitingAdventures: string;
  tapToStart: string;
  learningTree: string;
  watchGrow: string;
  seeProgress: string;
  pikoCommunity: string;
  shareCelebrate: string;
  connectFriends: string;
  pikoPeaks: string;
  unlockRewards: string;
  celebrateVictories: string;
  progressAdventure: string;
  learningJourney: string;
  adventuresComplete: string;
  start: string;
  growing: string;
  blooming: string;
  shining: string;
  master: string;
  amazingWork: string;
  incredibleMissions: string;
  moreAdventures: string;
  completedAll: string;
  nextReward: string;
  mysteryBadge: string;
  completeMore: string;
  celebrationSounds: string;
  nimisVoice: string;
  listenMessages: string;
  playMessage: string;
  newReward: string;
  unlockedSticker: string;
  viewRewards: string;
  dailyLove: string;
  sendLove: string;
  spreadLove: string;
  readyAdventure: string;
  socioEmotional: string;
  letsLearn: string;
  doingAmazing: string;
  favoriteBuddy: string;
  amazingAdventure: string;
  believeInYou: string;
  discoverWonderful: string;
  learningFun: string;
  morningEmotions: string;
  liveMissions: string;
  learningAdventure: string;
  todaysProgress: string;
  completed: string;
  encouragementMessage: string;
  chooseAdventureDay: string;
  nimisVideoGuide: string;
  videoGuideDescription: string;
  playNimisGuide: string;
  whatYoullDo: string;
  pikoVictoryGoal: string;
  funFact: string;
  whatYoullLearn: string;
  completeMission: string;
  locked: string;
  celebrationMessage: string;
  missionCompletedAlert: string;
    pikoCommunity: string;
  shareCelebrate: string;
  uploadPhoto: string;
  recordStory: string;
  creationsGallery: string;
  hallOfFame: string;
  askNimiAnything: string;
  nimiAnswers: string;
  askPlaceholder: string;
  comingSoon: string;
  learningGames: string;
  playWithFriends: string;
  videoCalls: string;
  learnWithNimi: string;
  groupChallenges: string;
  teamAdventures: string;
  shareCreation: string;
  uploadPrompt: string;
  creationDescription: string;
  cancel: string;
  shareButton: string;
  tapToView: string;
  achievements: string;
  dayStreak: string;
  userProfile: string;
  editProfile: string;
  aboutMe: string;
  myBadges: string;
  recentActivity: string;
  learningJourney: string;
  achievements: string;
  completedMissions: string;
  dailyStreak: string;
  currentLevel: string;
  nextLevel: string;
  points: string;
  friends: string;
  badges: string;
  noBadges: string;
  noActivity: string;
  changeAvatar: string;
  saveChanges: string;
  cancel: string;
  profileUpdated: string;
  viewAll: string;
  missionCompleted: string;
  badgeEarned: string;
  friendAdded: string;
  levelUp: string;
  beginner: string;
  explorer: string;
  adventurer: string;
  master: string;
  superstar: string;

}


interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, TranslationKeys> = {
  en: {
    home: "Home",
    dailyVictories: "Daily Little Victories",
    missions: "Missions",
    community: "Community",
    welcome: "Welcome to Nimi",
    tagline: "Your decentralized identity solution",
    hello: "Hello",
    dailyVictories: "Daily Little Victories — One step at a time!",
    todaysMission: "Today's Mission",
    learnTogether: "Learn about emotions and express your feelings with NIMI",
    duration: "Duration",
    points: "Points",
    difficulty: "Difficulty",
    startLearning: "Start Learning Adventure!",
    hearFromNimi: "Hear from NIMI",
    previewMission: "Preview Mission",
    dailyMissions: "Daily Missions",
    waitingAdventures: "Amazing Adventures Waiting!",
    tapToStart: "Tap to start your learning journey",
    learningTree: "My Learning Tree",
    watchGrow: "Watch Your Knowledge Grow!",
    seeProgress: "See your amazing progress",
    pikoCommunity: "Piko Community",
    shareCelebrate: "Share & Celebrate Together!",
    connectFriends: "Connect with learning friends",
    pikoPeaks: "Piko Peaks",
    unlockRewards: "Unlock Amazing Rewards!",
    celebrateVictories: "Celebrate your victories",
    progressAdventure: "Your Piko Progress Adventure!",
    learningJourney: "Learning Journey",
    adventuresComplete: "Adventures Complete!",
    start: "Start",
    growing: "Growing",
    blooming: "Blooming",
    shining: "Shining",
    master: "Master!",
    amazingWork: "Amazing work, little explorer! You've completed",
    incredibleMissions: "incredible missions!",
    moreAdventures: "more magical adventures await! Keep going!",
    completedAll: "INCREDIBLE! You've completed ALL missions! You're a true learning superstar!",
    nextReward: "Next Amazing Reward!",
    mysteryBadge: "Mystery Badge Awaits!",
    completeMore: "Complete 1 more mission to unlock!",
    celebrationSounds: "Celebration sounds ready to play!",
    nimisVoice: "NIMI's Voice",
    listenMessages: "Listen to encouraging messages!",
    playMessage: "Play Message",
    newReward: "New Reward!",
    unlockedSticker: "You unlocked a special sticker!",
    viewRewards: "View Rewards",
    dailyLove: "Daily Love",
    sendLove: "Send love to learning friends!",
    spreadLove: "Spread Love",
    readyAdventure: "Ready for today's adventure?",
    socioEmotional: "Socio-Emotional Learning",
    letsLearn: "Let's learn together!",
    doingAmazing: "You're doing amazing!",
    favoriteBuddy: "You're my favorite learning buddy!",
    amazingAdventure: "Ready for an amazing adventure?",
    believeInYou: "I believe in you, little explorer!",
    discoverWonderful: "Let's discover something wonderful today!",
    learningFun: "You make learning so much fun!",
    morningEmotions: "Morning Emotions",
    liveMissions: "NIMI's Live Missions",
    learningAdventure: "Your amazing learning adventure! 🌈",
    todaysProgress: "Today's Progress",
    completed: "Completed",
    encouragementMessage: "You're doing amazing! Keep going, little explorer! 🌟",
    chooseAdventureDay: "🗓️ Choose Your Adventure Day",
    nimisVideoGuide: "🎬 NIMI's Video Guide",
    videoGuideDescription: "Watch NIMI explain this mission with fun animations!",
    playNimisGuide: "▶️ Play NIMI's Guide",
    whatYoullDo: "🎯 What You'll Do:",
    pikoVictoryGoal: "🏆 Piko Victory Goal:",
    funFact: "🤓 Fun Fact:",
    whatYoullLearn: "📚 What You'll Learn:",
    completeMission: "Complete Mission",
    locked: "🔒 Locked",
    celebrationMessage: "🎉 Great job! Piko Victory unlocked!",
    missionCompletedAlert: "✅ Mission marked as completed!", 
     pikoCommunity: "Piko Community",
    shareCelebrate: "Share your amazing creations and celebrate with learning friends! 🌈",
    uploadPhoto: "Upload Photo",
    recordStory: "Record Story",
    creationsGallery: "Piko Creations Gallery",
    hallOfFame: "Piko Pal Hall of Fame",
    askNimiAnything: "Ask NIMI Anything!",
    nimiAnswers: "NIMI is here to answer all your curious questions! 💭",
    askPlaceholder: "Ask NIMI a question...",
    comingSoon: "More Amazing Features Coming Soon!",
    learningGames: "Learning Games",
    playWithFriends: "Play together with friends",
    videoCalls: "Video Calls",
    learnWithNimi: "Learn with NIMI live",
    groupChallenges: "Group Challenges",
    teamAdventures: "Team up for big adventures",
    shareCreation: "Share Your Creation",
    uploadPrompt: "Tap to take a photo or choose from gallery",
    creationDescription: "Tell us about your creation...",
    cancel: "Cancel",
    shareButton: "Share! 🎉",
    tapToView: "Tap to view",
    achievements: "achievements",
    dayStreak: "day streak",
     userProfile: "User Profile",
    editProfile: "Edit Profile",
    aboutMe: "About Me",
    myBadges: "My Badges",
    recentActivity: "Recent Activity",
    learningJourney: "Learning Journey",
    achievements: "Achievements",
    completedMissions: "Completed Missions",
    dailyStreak: "Daily Streak",
    currentLevel: "Current Level",
    nextLevel: "Next Level",
    points: "Points",
    friends: "Friends",
    badges: "Badges",
    noBadges: "No badges earned yet",
    noActivity: "No recent activity",
    changeAvatar: "Change Avatar",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    profileUpdated: "Profile updated successfully!",
    viewAll: "View All",
    missionCompleted: "Mission Completed",
    badgeEarned: "Badge Earned",
    friendAdded: "Friend Added",
    levelUp: "Level Up!",
    beginner: "Beginner",
    explorer: "Explorer",
    adventurer: "Adventurer",
    master: "Master",
    superstar: "Superstar",
    feelingHappyMessage: "You’re doing great! Keep smiling!",
    feelingGoodMessage: "Keep up the good mood!",
    feelingNeutralMessage: "It’s okay to have an off day.",
    feelingSadMessage: "Remember, tomorrow is a new day!",
    feelingExcitedMessage: "Yay! Enjoy your happiness!",
    feelingTiredMessage: "Make sure to get some rest.",
    hearNimiReadPage: "Hear Nimi Read This Page",
    loadingMissions: "Loading your missions...",
    completeDayToUnlock: "Complete day {day} to unlock",
    theme: "Theme",
    points: "pts",
    newReward: "New Reward!",
  unlockedSticker: "You unlocked a special sticker!",
  viewRewards: "View Rewards",
  dayCompleteTitle: "Day Complete!",
  dayCompleteMessage: "You've completed Day {day}!",
  streakBonus: "{streak}-day streak!",
  streakBonusMessage: "Keep it going to earn bonus points!",
  nextReward: "Next Reward:",
  mysteryBadge: "Mystery Badge!",
  continueToNextDay: "Continue to Day",
  missionCompletedCelebration: "Mission complete! {points} points earned!",
  dayCompletedCelebration: "Day {day} completed! You earned {points} points!",
  completionError: "Oops! Something went wrong. Please try again."







  

  },
  rw: {
    home: "Ahabanza",
    dailyVictories: "Intsinzi Ntoya Z'umunsi",
    missions: "Intego",
    community: "Umuryango",
    welcome: "Murakaza neza kuri Nimi",
    tagline: "Igisubizo cyawe cy'ubwigenge",
    hello: "Mwaramutse",
    dailyVictories: "Intsinzi ntoya buri munsi — Intambwe imwe mu gihe!",
    todaysMission: "Intego y'uyu munsi",
    learnTogether: "Jya wiga iby'imyumvire no kuvuga iby'umutima wawe na NIMI",
    duration: "Igihe",
    points: "Amapointe",
    difficulty: "Ingorane",
    startLearning: "Tangira urugendo rwo kwiga!",
    hearFromNimi: "Umve NIMI",
    previewMission: "Reba intego mbere",
    dailyMissions: "Intego z'umunsi",
    waitingAdventures: "Inzira z'urugendo zitegereje!",
    tapToStart: "Kanda utangire urugendo rwawe rwo kwiga",
    learningTree: "Igiti cyanjye cy'ubumenyi",
    watchGrow: "Reba ubumenyi bwawe bukura!",
    seeProgress: "Reba iterambere ryawe ry'igitangaza",
    pikoCommunity: "Umuryango wa Piko",
    shareCelebrate: "Sangira kandi wizihize hamwe!",
    connectFriends: "Huza n'inshuti zo kwiga",
    pikoPeaks: "Amazinga ya Piko",
    unlockRewards: "Fungura ibihembo by'igitangaza!",
    celebrateVictories: "Wizihize intsinzi zawe",
    progressAdventure: "Urugendo rwawe rwo Kwimenyereza kuri Piko!",
    learningJourney: "Urugendo rwo kwiga",
    adventuresComplete: "Inzira z'urugendo zarangije!",
    start: "Gutangira",
    growing: "Gukura",
    blooming: "Gutumbuka",
    shining: "Kumurika",
    master: "Umwuga!",
    amazingWork: "Akazi k'igitangaza, mw'umunyeshuri muto! Warangije",
    incredibleMissions: "intego z'igitangaza!",
    moreAdventures: "inzira z'urugendo zisigaye! Komeza!",
    completedAll: "IGITANGAZA! Warangije ZOSE intego! Uri umunyeshuri w'umwuga wo kwiga!",
    nextReward: "Igihango gikurikira cy'igitangaza!",
    mysteryBadge: "Ikimenyetso gisanzwe gitegereje!",
    completeMore: "Rangiza indi ntego imwe kugirango uyifungure!",
    celebrationSounds: "Amajwi y'ishimwe yiteguye gusebakana!",
    nimisVoice: "Ijwi rya NIMI",
    listenMessages: "Umve ubutumwa bw'ishyigikye!",
    playMessage: "Sobanura ubutumwa",
    newReward: "Igihango gishya!",
    unlockedSticker: "Wasohoye ikimenyetso gisanzwe!",
    viewRewards: "Reba ibihembo",
    dailyLove: "Urukundo rw'umunsi",
    sendLove: "Ohereza urukundo kubanyeshuri bashyigikiye!",
    spreadLove: "Sakaza urukundo",
    readyAdventure: "Uteguye urugendo rw'uyu munsi?",
    socioEmotional: "Kwiga Imyumvire n'Imibereho",
    letsLearn: "Reka twige hamwe!",
    doingAmazing: "Ukora neza cyane!",
    favoriteBuddy: "Uri inshuti yanjye nyamukunda yo kwiga!",
    amazingAdventure: "Uteguye urugendo rw'igitangaza?",
    believeInYou: "Ndizera muri wowe, mw'umunyeshuri muto!",
    discoverWonderful: "Reka dusobanukirwe ikintu cy'igitangaza uyu munsi!",
    learningFun: "Ukora kwiga kuba umunezero!",
    morningEmotions: "Imyumvire y'umutondo",
    liveMissions: "Intego za NIMI zikurikira",
    learningAdventure: "Urugendo rwawe rwo kwiga rw'igitangaza! 🌈",
    todaysProgress: "Iterambere ry'uyu munsi",
    completed: "Byarangiye",
    encouragementMessage: "Ukora neza! Komeza, mw'umunyeshuri muto! 🌟",
    chooseAdventureDay: "🗓️ Hitamo Umunsi wawe wo Kwiga",
    nimisVideoGuide: "🎬 Icyitonderwa cya NIMI",
    videoGuideDescription: "Reba NIMI asobanura iyi ntego akoresheje imikino!",
    playNimisGuide: "▶️ Tangira Icyitonderwa cya NIMI",
    whatYoullDo: "🎯 Icyo uzakora:",
    pikoVictoryGoal: "🏆 Intego ya Piko:",
    funFact: "🤓 Ikintu cy'igishushanyo:",
    whatYoullLearn: "📚 Icyo uziga:",
    completeMission: "Rangiza intego",
    locked: "🔒 Yahakotse",
    celebrationMessage: "🎉 Akazi neza! Washoboye intsinzi ya Piko!",
    missionCompletedAlert: "✅ Intego yanditse nk'iyarangije!",
        pikoCommunity: "Umuryango wa Piko",
    shareCelebrate: "Sangiza ibikorwa byawe by'igitangaza kandi wizihize hamwe n'inshuti zo kwiga! 🌈",
    uploadPhoto: "Shyiraho Ifoto",
    recordStory: "Andika Inkuru",
    creationsGallery: "Ishusho y'Ibikorwa bya Piko",
    hallOfFame: "Abakinnyi b'ikimenyetso ba Piko",
    askNimiAnything: "Baza NIMI icyo aricyo cyose!",
    nimiAnswers: "NIMI ari hano kugusubiza ibibazo byawe byose! 💭",
    askPlaceholder: "Baza NIMI ikibazo...",
    comingSoon: "Ibindi Bidasanzwe Biraza!",
    learningGames: "Imikino yo Kwiga",
    playWithFriends: "Ikina hamwe n'inshuti",
    videoCalls: "Amahamagara y'amashusho",
    learnWithNimi: "Jya wiga na NIMI",
    groupChallenges: "Ibyifuzo by'Itsinda",
    teamAdventures: "Fata uruhare mu nzira z'urugendo",
    shareCreation: "Sangiza Ibukorwa byawe",
    uploadPrompt: "Kanda gufata ifoto cyangwa hitamo muri gallery",
    creationDescription: "Tubwire ibyerekeye ibukorwa byawe...",
    cancel: "Hagarika",
    shareButton: "Sangiza! 🎉",
    tapToView: "Kanda kureba",
    achievements: "ibyagezweho",
    dayStreak: "umunsi w'umurongo",
     userProfile: "Profili y'umukoresha",
    editProfile: "Hindura Profili",
    aboutMe: "Ibyerekeye njye",
    myBadges: "Ikimenyetso cyanjye",
    recentActivity: "Ibikorwa vya kigeze",
    learningJourney: "Urugendo rwo Kwiga",
    achievements: "Ibyagezweho",
    completedMissions: "Intego Zarangiye",
    dailyStreak: "Umunsi w'umurongo",
    currentLevel: "Urwego rwa none",
    nextLevel: "Urwego rukurikira",
    points: "Amapointe",
    friends: "Inshuti",
    badges: "Ikimenyetso",
    noBadges: "Nta kimenyetso cyagezweho",
    noActivity: "Nta bikorwa vya kigeze",
    changeAvatar: "Hindura Avatar",
    saveChanges: "Bika Impinduka",
    cancel: "Hagarika",
    profileUpdated: "Profili yavuguruwe neza!",
    viewAll: "Reba Byose",
    missionCompleted: "Intego Yarangiye",
    badgeEarned: "Ikimenyetso Cyagezweho",
    friendAdded: "Inshuti Yonjewe",
    levelUp: "Urwego Rushya!",
    beginner: "Umutangizi",
    explorer: "Umuhanga",
    adventurer: "Umuhanga",
    master: "Umwuga",
    superstar: "Nyota",
  feelingHappyMessage: "Uri gukora neza cyane! Komeza useke!",
  feelingGoodMessage: "Komeza umunezero wawe mwiza!",
  feelingNeutralMessage: "Birakwiye kugira umunsi utameze neza.",
  feelingSadMessage: "Ibuka ko ejo ari umunsi mushya!",
  feelingExcitedMessage: "Yay! Wishimire ibyishimo byawe!",
  feelingTiredMessage: "Witondere kuruhuka neza.",
  hearNimiReadPage: "Wumve Nimi asoma uru rupapuro",
  newReward: "Igihashyo Gishya!",
  unlockedSticker: "Wasohoye sitike y'idashyizeho!",
  viewRewards: "Reba Ibihashyo",
  dayCompleteTitle: "Umunsi Waranze!",
  dayCompleteMessage: "Warangiye Umunsi {day}!",
  streakBonus: "Iminsi {streak} ikurikirana!",
  streakBonusMessage: "Komeza kugirango ubone amapoinzi yinyongera!",
  nextReward: "Igihashyo Gikurikira:",
  mysteryBadge: "Ikimenyetso Gitangaje!",
  continueToNextDay: "Komeza ku Minsi",
  missionCompletedCelebration: "Misiyoni yarangiye! {points} amapoinzi wabitswe!",
  dayCompletedCelebration: "Umunsi {day} warangiye! Wabitswe {points} amapoinzi!",
  completionError: "Oya! Habaye ikibazo. Nyamuneka gerageza nanone."
  

  },
  fr: {
    home: "Accueil",
    dailyVictories: "Petites Victoires Quotidiennes",
    missions: "Missions",
    community: "Communauté",
    welcome: "Bienvenue sur Nimi",
    tagline: "Votre solution d'identité décentralisée",
    hello: "Bonjour",
    dailyVictories: "Petites victoires quotidiennes — Un pas à la fois!",
    todaysMission: "Mission du jour",
    learnTogether: "Apprenez sur les émotions et exprimez vos sentiments avec NIMI",
    duration: "Durée",
    points: "Points",
    difficulty: "Difficulté",
    startLearning: "Commencer l'aventure d'apprentissage!",
    hearFromNimi: "Écouter NIMI",
    previewMission: "Aperçu de la mission",
    dailyMissions: "Missions quotidiennes",
    waitingAdventures: "Incroyables aventures en attente!",
    tapToStart: "Appuyez pour commencer votre voyage d'apprentissage",
    learningTree: "Mon arbre d'apprentissage",
    watchGrow: "Regardez vos connaissances grandir!",
    seeProgress: "Voyez vos progrès incroyables",
    pikoCommunity: "Communauté Piko",
    shareCelebrate: "Partagez et célébrez ensemble!",
    connectFriends: "Connectez-vous avec des amis d'apprentissage",
    pikoPeaks: "Piko Peaks",
    unlockRewards: "Débloquez des récompenses incroyables!",
    celebrateVictories: "Célébrez vos victoires",
    progressAdventure: "Votre aventure de progrès Piko!",
    learningJourney: "Parcours d'apprentissage",
    adventuresComplete: "Aventures terminées!",
    start: "Début",
    growing: "Croissance",
    blooming: "Floraison",
    shining: "Brillance",
    master: "Maître!",
    amazingWork: "Travail incroyable, petit explorateur! Vous avez terminé",
    incredibleMissions: "missions incroyables!",
    moreAdventures: "aventures magiques vous attendent! Continuez!",
    completedAll: "INCROYABLE! Vous avez terminé TOUTES les missions! Vous êtes une vraie superstar de l'apprentissage!",
    nextReward: "Prochaine récompense incroyable!",
    mysteryBadge: "Badge mystère à gagner!",
    completeMore: "Terminez 1 mission de plus pour débloquer!",
    celebrationSounds: "Sons de célébration prêts à jouer!",
    nimisVoice: "La voix de NIMI",
    listenMessages: "Écoutez des messages encourageants!",
    playMessage: "Jouer le message",
    newReward: "Nouvelle récompense!",
    unlockedSticker: "Vous avez débloqué un autocollant spécial!",
    viewRewards: "Voir les récompenses",
    dailyLove: "Amour quotidien",
    sendLove: "Envoyez de l'amour aux amis d'apprentissage!",
    spreadLove: "Propager l'amour",
    readyAdventure: "Prêt pour l'aventure d'aujourd'hui?",
    socioEmotional: "Apprentissage Socio-Émotionnel",
    letsLearn: "Apprenons ensemble!",
    doingAmazing: "Vous vous débrouillez merveilleusement!",
    favoriteBuddy: "Vous êtes mon compagnon d'apprentissage préféré!",
    amazingAdventure: "Prêt pour une aventure incroyable?",
    believeInYou: "Je crois en toi, petit explorateur!",
    discoverWonderful: "Découvrons quelque chose de merveilleux aujourd'hui!",
    learningFun: "Vous rendez l'apprentissage tellement amusant!",
    morningEmotions: "Émotions matinales",
    liveMissions: "Missions en direct de NIMI",
    learningAdventure: "Votre incroyable aventure d'apprentissage! 🌈",
    todaysProgress: "Progrès d'aujourd'hui",
    completed: "Terminé",
    encouragementMessage: "Vous vous débrouillez merveilleusement! Continuez, petit explorateur! 🌟",
    chooseAdventureDay: "🗓️ Choisissez votre journée d'aventure",
    nimisVideoGuide: "🎬 Guide vidéo de NIMI",
    videoGuideDescription: "Regardez NIMI expliquer cette mission avec des animations amusantes!",
    playNimisGuide: "▶️ Lancer le guide de NIMI",
    whatYoullDo: "🎯 Ce que vous ferez:",
    pikoVictoryGoal: "🏆 Objectif Victoire Piko:",
    funFact: "🤓 Fait amusant:",
    whatYoullLearn: "📚 Ce que vous apprendrez:",
    completeMission: "Compléter la mission",
    locked: "🔒 Verrouillé",
    celebrationMessage: "🎉 Excellent travail! Victoire Piko débloquée!",
    missionCompletedAlert: "✅ Mission marquée comme complétée!",
        pikoCommunity: "Communauté Piko",
    shareCelebrate: "Partagez vos créations incroyables et célébrez avec vos amis d'apprentissage ! 🌈",
    uploadPhoto: "Télécharger une photo",
    recordStory: "Enregistrer une histoire",
    creationsGallery: "Galerie des Créations Piko",
    hallOfFame: "Temple de la Renommée Piko",
    askNimiAnything: "Demandez n'importe quoi à NIMI !",
    nimiAnswers: "NIMI est là pour répondre à toutes vos questions curieuses ! 💭",
    askPlaceholder: "Posez une question à NIMI...",
    comingSoon: "Plus de fonctionnalités incroyables à venir !",
    learningGames: "Jeux d'apprentissage",
    playWithFriends: "Jouer avec des amis",
    videoCalls: "Appels vidéo",
    learnWithNimi: "Apprendre avec NIMI en direct",
    groupChallenges: "Défis de groupe",
    teamAdventures: "Faites équipe pour de grandes aventures",
    shareCreation: "Partagez votre création",
    uploadPrompt: "Appuyez pour prendre une photo ou choisir dans la galerie",
    creationDescription: "Parlez-nous de votre création...",
    cancel: "Annuler",
    shareButton: "Partager ! 🎉",
    tapToView: "Appuyez pour voir",
    achievements: "réalisations",
    dayStreak: "série de jours",
     userProfile: "Profil Utilisateur",
    editProfile: "Modifier le Profil",
    aboutMe: "À propos de moi",
    myBadges: "Mes Badges",
    recentActivity: "Activité Récente",
    learningJourney: "Parcours d'Apprentissage",
    achievements: "Réalisations",
    completedMissions: "Missions Terminées",
    dailyStreak: "Série Quotidienne",
    currentLevel: "Niveau Actuel",
    nextLevel: "Niveau Suivant",
    points: "Points",
    friends: "Amis",
    badges: "Badges",
    noBadges: "Aucun badge obtenu",
    noActivity: "Aucune activité récente",
    changeAvatar: "Changer d'avatar",
    saveChanges: "Enregistrer",
    cancel: "Annuler",
    profileUpdated: "Profil mis à jour avec succès!",
    viewAll: "Voir Tout",
    missionCompleted: "Mission Terminée",
    badgeEarned: "Badge Obtenu",
    friendAdded: "Ami Ajouté",
    levelUp: "Niveau Supérieur!",
    beginner: "Débutant",
    explorer: "Explorateur",
    adventurer: "Aventurier",
    master: "Maître",
    superstar: "Superstar",
  feelingHappyMessage: "Tu fais du super travail ! Continue de sourire !",
  feelingGoodMessage: "Garde ta bonne humeur !",
  feelingNeutralMessag: "C’est normal d’avoir un jour sans.",
  feelingSadMessage: "Rappelle-toi, demain est un nouveau jour !",
  feelingExcitedMessage: "Youpi ! Profite de ton bonheur !",
  feelingTiredMessage: "Assure-toi de bien te reposer",
  hearNimiReadPage: "Écoutez Nimi lire cette page",
  newReward: "Nouvelle récompense !",
  unlockedSticker: "Vous avez débloqué un autocollant spécial !",
  viewRewards: "Voir les récompenses",
  dayCompleteTitle: "Journée terminée !",
  dayCompleteMessage: "Vous avez terminé le Jour {day} !",
  streakBonus: "Série de {streak} jours !",
  streakBonusMessage: "Continuez pour gagner des points bonus !",
  nextReward: "Prochaine récompense :",
  mysteryBadge: "Badge mystère !",
  continueToNextDay: "Continuer au Jour",
  missionCompletedCelebration: "Mission accomplie ! {points} points gagnés !",
  dayCompletedCelebration: "Jour {day} terminé ! Vous avez gagné {points} points !",
  completionError: "Oups ! Un problème est survenu. Veuillez réessayer."



  },
  es: {
    home: "Inicio",
    dailyVictories: "Pequeñas Victorias Diarias",
    missions: "Misiones",
    community: "Comunidad",
    welcome: "Bienvenido a Nimi",
    tagline: "Tu solución de identidad descentralizada",
    hello: "Hola",
    dailyVictories: "Pequeñas victorias diarias — ¡Un paso a la vez!",
    todaysMission: "Misión de hoy",
    learnTogether: "Aprende sobre emociones y expresa tus sentimientos con NIMI",
    duration: "Duración",
    points: "Puntos",
    difficulty: "Dificultad",
    startLearning: "¡Comienza la aventura de aprendizaje!",
    hearFromNimi: "Escuchar a NIMI",
    previewMission: "Vista previa de la misión",
    dailyMissions: "Misiones diarias",
    waitingAdventures: "¡Increíbles aventuras esperando!",
    tapToStart: "Toca para comenzar tu viaje de aprendizaje",
    learningTree: "Mi árbol de aprendizaje",
    watchGrow: "¡Observa cómo crece tu conocimiento!",
    seeProgress: "Mira tu increíble progreso",
    pikoCommunity: "Comunidad Piko",
    shareCelebrate: "¡Comparte y celebra juntos!",
    connectFriends: "Conéctate con amigos de aprendizaje",
    pikoPeaks: "Piko Peaks",
    unlockRewards: "¡Desbloquea recompensas increíbles!",
    celebrateVictories: "Celebra tus victorias",
    progressAdventure: "¡Tu aventura de progreso Piko!",
    learningJourney: "Viaje de aprendizaje",
    adventuresComplete: "¡Aventuras completadas!",
    start: "Comienzo",
    growing: "Creciendo",
    blooming: "Floreciendo",
    shining: "Brillando",
    master: "¡Maestro!",
    amazingWork: "¡Increíble trabajo, pequeño explorador! Has completado",
    incredibleMissions: "¡misiones increíbles!",
    moreAdventures: "¡aventuras mágicas te esperan! ¡Sigue adelante!",
    completedAll: "¡INCREÍBLE! ¡Has completado TODAS las misiones! ¡Eres una verdadera superestrella del aprendizaje!",
    nextReward: "¡Próxima recompensa increíble!",
    mysteryBadge: "¡Insignia misteriosa esperando!",
    completeMore: "¡Completa 1 misión más para desbloquear!",
    celebrationSounds: "¡Sonidos de celebración listos para reproducir!",
    nimisVoice: "La voz de NIMI",
    listenMessages: "¡Escucha mensajes alentadores!",
    playMessage: "Reproducir mensaje",
    newReward: "¡Nueva recompensa!",
    unlockedSticker: "¡Has desbloqueado una pegatina especial!",
    viewRewards: "Ver recompensas",
    dailyLove: "Amor diario",
    sendLove: "¡Envía amor a tus amigos de aprendizaje!",
    spreadLove: "Difundir amor",
    readyAdventure: "¿Listo para la aventura de hoy?",
    socioEmotional: "Aprendizaje Socioemocional",
    letsLearn: "¡Aprendamos juntos!",
    doingAmazing: "¡Lo estás haciendo increíble!",
    favoriteBuddy: "¡Eres mi compañero de aprendizaje favorito!",
    amazingAdventure: "¿Listo para una aventura increíble?",
    believeInYou: "¡Creo en ti, pequeño explorador!",
    discoverWonderful: "¡Descubramos algo maravilloso hoy!",
    learningFun: "¡Haces que aprender sea muy divertido!",
    morningEmotions: "Emociones matutinas",
     liveMissions: "Misiones en vivo de NIMI",
    learningAdventure: "¡Tu increíble aventura de aprendizaje! 🌈",
    todaysProgress: "Progreso de hoy",
    completed: "Completado",
    encouragementMessage: "¡Lo estás haciendo increíble! ¡Sigue adelante, pequeño explorador! 🌟",
    chooseAdventureDay: "🗓️ Elige tu día de aventura",
    nimisVideoGuide: "🎬 Guía de video de NIMI",
    videoGuideDescription: "¡Mira a NIMI explicar esta misión con divertidas animaciones!",
    playNimisGuide: "▶️ Reproducir la guía de NIMI",
    whatYoullDo: "🎯 Lo que harás:",
    pikoVictoryGoal: "🏆 Objetivo de Victoria Piko:",
    funFact: "🤓 Dato curioso:",
    whatYoullLearn: "📚 Lo que aprenderás:",
    completeMission: "Completar misión",
    locked: "🔒 Bloqueado",
    celebrationMessage: "🎉 ¡Gran trabajo! ¡Victoria Piko desbloqueada!",
    missionCompletedAlert: "✅ ¡Misión marcada como completada!",
     pikoCommunity: "Comunidad Piko",
    shareCelebrate: "¡Comparte tus increíbles creaciones y celebra con amigos de aprendizaje! 🌈",
    uploadPhoto: "Subir Foto",
    recordStory: "Grabar Historia",
    creationsGallery: "Galería de Creaciones Piko",
    hallOfFame: "Salón de la Fama de Piko",
    askNimiAnything: "¡Pregúntale cualquier cosa a NIMI!",
    nimiAnswers: "¡NIMI está aquí para responder todas tus preguntas curiosas! 💭",
    askPlaceholder: "Pregúntale a NIMI...",
    comingSoon: "¡Más características increíbles próximamente!",
    learningGames: "Juegos de Aprendizaje",
    playWithFriends: "Juega con amigos",
    videoCalls: "Llamadas de Video",
    learnWithNimi: "Aprende con NIMI en vivo",
    groupChallenges: "Desafíos Grupales",
    teamAdventures: "Únete para grandes aventuras",
    shareCreation: "Comparte tu Creación",
    uploadPrompt: "Toca para tomar una foto o elegir de la galería",
    creationDescription: "Cuéntanos sobre tu creación...",
    cancel: "Cancelar",
    shareButton: "¡Compartir! 🎉",
    tapToView: "Toca para ver",
    achievements: "logros",
    dayStreak: "racha de días",
    userProfile: "Perfil de Usuario",
    editProfile: "Editar Perfil",
    aboutMe: "Sobre Mí",
    myBadges: "Mis Insignias",
    recentActivity: "Actividad Reciente",
    learningJourney: "Viaje de Aprendizaje",
    achievements: "Logros",
    completedMissions: "Misiones Completadas",
    dailyStreak: "Racha Diaria",
    currentLevel: "Nivel Actual",
    nextLevel: "Próximo Nivel",
    points: "Puntos",
    friends: "Amigos",
    badges: "Insignias",
    noBadges: "No hay insignias obtenidas",
    noActivity: "No hay actividad reciente",
    changeAvatar: "Cambiar Avatar",
    saveChanges: "Guardar Cambios",
    cancel: "Cancelar",
    profileUpdated: "¡Perfil actualizado con éxito!",
    viewAll: "Ver Todo",
    missionCompleted: "Misión Completada",
    badgeEarned: "Insignia Obtenida",
    friendAdded: "Amigo Agregado",
    levelUp: "¡Subir de Nivel!",
    beginner: "Principiante",
    explorer: "Explorador",
    adventurer: "Aventurero",
    master: "Maestro",
    superstar: "Superestrella",
  feelingHappyMessage: "¡Lo estás haciendo genial! ¡Sigue sonriendo!",
  feelingGoodMessage: "¡Mantén el buen ánimo!",
  feelingNeutralMessage: "Está bien tener un mal día.",
  feelingSadMessage: "Recuerda, mañana es un nuevo día.",
  feelingExcitedMessage: "¡Yay! ¡Disfruta tu felicidad!",
  feelingTiredMessage: "Asegúrate de descansar bien.",
  hearNimiReadPage: "Escucha a Nimi leer esta página",
  
  newReward: "¡Nueva recompensa!",
  unlockedSticker: "¡Desbloqueaste un sticker especial!",
  viewRewards: "Ver recompensas",
  dayCompleteTitle: "¡Día completado!",
  dayCompleteMessage: "¡Has completado el Día {day}!",
  streakBonus: "¡Racha de {streak} días!",
  streakBonusMessage: "¡Sigue así para ganar puntos extra!",
  nextReward: "Próxima recompensa:",
  mysteryBadge: "¡Insignia misteriosa!",
  continueToNextDay: "Continuar al Día",
  missionCompletedCelebration: "¡Misión completada! ¡Ganaste {points} puntos!",
  dayCompletedCelebration: "¡Día {day} completado! ¡Ganaste {points} puntos!",
  completionError: "¡Ups! Algo salió mal. Por favor, inténtalo de nuevo."

  

    
  },
  sw: {
    home: "Nyumbani",
    dailyVictories: "Mafanikio ya Kila Siku",
    missions: "Misioni",
    community: "Jumuiya",
    welcome: "Karibu kwa Nimi",
    tagline: "Suluhisho lako la utambulisho lililojitenga",
    hello: "Habari",
    dailyVictories: "Ushindi wa kila siku — Hatua moja kwa wakati!",
    todaysMission: "Kazi ya Leo",
    learnTogether: "Jifunze kuhusu hisia na eleza hisia zako na NIMI",
    duration: "Muda",
    points: "Pointi",
    difficulty: "Ugumu",
    startLearning: "Anza Safari ya Kujifunza!",
    hearFromNimi: "Sikiliza NIMI",
    previewMission: "Hakiki Kazi kabla",
    dailyMissions: "Kazi za Kila Siku",
    waitingAdventures: "Safari za kusisimua zinangojea!",
    tapToStart: "Gusa kuanza safari yako ya kujifunza",
    learningTree: "Mti wangu wa Kujifunza",
    watchGrow: "Angalia ujuzi wako ukua!",
    seeProgress: "Ona maendeleo yako ya kushangaza",
    pikoCommunity: "Jumuiya ya Piko",
    shareCelebrate: "Shiriki na sherehekea pamoja!",
    connectFriends: "Ungana na marafiki wa kujifunza",
    pikoPeaks: "Piko Peaks",
    unlockRewards: "Fungua zawadi za kushangaza!",
    celebrateVictories: "Sherehekea ushindi wako",
    progressAdventure: "Safari yako ya Maendeleo ya Piko!",
    learningJourney: "Safari ya Kujifunza",
    adventuresComplete: "Safari Kamili!",
    start: "Mwanzo",
    growing: "Inakua",
    blooming: "Inachanua",
    shining: "Inang'aa",
    master: "Mtaalamu!",
    amazingWork: "Kazi nzuri, mpelelezi mdogo! Umemaliza",
    incredibleMissions: "kazi za kushangaza!",
    moreAdventures: "safari za kichawi zinasubiri! Endelea!",
    completedAll: "AJABU! Umemaliza KAZI ZOTE! Wewe ni nyota halisi ya kujifunza!",
    nextReward: "Zawadi ya Kuvutia ijayo!",
    mysteryBadge: "Beji ya siri inangojea!",
    completeMore: "Maliza kazi moja zaidi kufungua!",
    celebrationSounds: "Sauti za sherehe tayari kuchezwa!",
    nimisVoice: "Sauti ya NIMI",
    listenMessages: "Sikiliza ujumbe wa kuhimiza!",
    playMessage: "Cheza ujumbe",
    newReward: "Zawadi mpya!",
    unlockedSticker: "Umefungua stika maalum!",
    viewRewards: "Tazama zawadi",
    dailyLove: "Upendo wa Kila Siku",
    sendLove: "Tuma upendo kwa marafiki wa kujifunza!",
    spreadLove: "Sambaza upendo",
    readyAdventure: "Tayari kwa safari ya leo?",
    socioEmotional: "Kujifunza Kijamii na Kihemko",
    letsLearn: "Tujifunze pamoja!",
    doingAmazing: "Unafanya vizuri sana!",
    favoriteBuddy: "Wewe ndiye rafiki yangu mpendwa wa kujifunza!",
    amazingAdventure: "Tayari kwa safari ya kusisimua?",
    believeInYou: "Ninaamini wewe, mpelelezi mdogo!",
    discoverWonderful: "Tugundue kitu cha kuvutia leo!",
    learningFun: "Unafanya kujifunza kuwa raha!",
    morningEmotions: "Hisia za Asubuhi",
    liveMissions: "Kazi za Moja kwa Moja za NIMI",
    learningAdventure: "Safari yako ya kusisimua ya kujifunza! 🌈",
    todaysProgress: "Maendeleo ya Leo",
    completed: "Kamili",
    encouragementMessage: "Unafanya vizuri sana! Endelea, mpelelezi mdogo! 🌟",
    chooseAdventureDay: "🗓️ Chagua Siku Yako ya Safari",
    nimisVideoGuide: "🎬 Mwongozo wa Video wa NIMI",
    videoGuideDescription: "Angalia NIMI akielezea kazi hii kwa michoro ya kufurahisha!",
    playNimisGuide: "▶️ Cheza Mwongozo wa NIMI",
    whatYoullDo: "🎯 Utakachofanya:",
    pikoVictoryGoal: "🏆 Lengo la Ushindi wa Piko:",
    funFact: "🤓 Ukweli wa Kufurahisha:",
    whatYoullLearn: "📚 Utakachojifunza:",
    completeMission: "Kamili kazi",
    locked: "🔒 Imefungwa",
    celebrationMessage: "🎉 Kazi nzuri! Ushindi wa Piko umefunguliwa!",
    missionCompletedAlert: "✅ Kazi imeandikwa kama kamili!",
    pikoCommunity: "Jumuiya ya Piko",
    shareCelebrate: "Shiriki michango yako ya kushangaza na kusherekea pamoja na marafiki wa kujifunza! 🌈",
    uploadPhoto: "Pakia Picha",
    recordStory: "Rekodi Hadithi",
    creationsGallery: "Jumba la Sanaa la Piko",
    hallOfFame: "Ukumbi wa Umaarufu wa Piko",
    askNimiAnything: "Uliza NIMI chochote!",
    nimiAnswers: "NIMI yako hapa kujibu maswali yako yote ya udadisi! 💭",
    askPlaceholder: "Uliza NIMI swali...",
    comingSoon: "Vipengele zaidi vya kuvutia vinakuja!",
    learningGames: "Michezo ya Kujifunza",
    playWithFriends: "Cheza pamoja na marafiki",
    videoCalls: "Simu za Video",
    learnWithNimi: "Jifunza na NIMI moja kwa moja",
    groupChallenges: "Changamoto za Kikundi",
    teamAdventures: "Shirikiana kwa safari kubwa",
    shareCreation: "Shiriki Uumbaji wako",
    uploadPrompt: "Gusa kupiga picha au chagua kutoka kwenye hazina",
    creationDescription: "Tuambie kuhusu uumbaji wako...",
    cancel: "Ghairi",
    shareButton: "Shiriki! 🎉",
    tapToView: "Gusa kuona",
    achievements: "mafanikio",
    dayStreak: "mfululizo wa siku",
     userProfile: "Wasifu wa Mtumiaji",
    editProfile: "Hariri Wasifu",
    aboutMe: "Kuhusu Mimi",
    myBadges: "Baji Zangu",
    recentActivity: "Shughuli za Hivi Karibuni",
    learningJourney: "Safari ya Kujifunza",
    achievements: "Mafanikio",
    completedMissions: "Misheni Zilizokamilika",
    dailyStreak: "Mfululizo wa Kila Siku",
    currentLevel: "Kiwango cha Sasa",
    nextLevel: "Kiwango Kifuatacho",
    points: "Pointi",
    friends: "Marafiki",
    badges: "Baji",
    noBadges: "Hakuna baji zilizopatikana",
    noActivity: "Hakuna shughuli za hivi karibuni",
    changeAvatar: "Badilisha Avatar",
    saveChanges: "Hifadhi Mabadiliko",
    cancel: "Ghairi",
    profileUpdated: "Wasifu umesasishwa kwa mafanikio!",
    viewAll: "Tazama Zote",
    missionCompleted: "Misheni Imekamilika",
    badgeEarned: "Baji Imepatikana",
    friendAdded: "Rafiki Ameongezwa",
    levelUp: "Panda Kiwango!",
    beginner: "Mwanzo",
    explorer: "Mpelelezi",
    adventurer: "Mkimbizi",
    master: "Mtaalamu",
    superstar: "Nyota",
  feelingHappyMessage: "Unafanya vizuri sana! Endelea kujiwekea tabasamu!",
  feelingGoodMessage: "Endelea na hali nzuri ya moyo!",
  feelingNeutralMessage: "Ni sawa kuwa na siku mbaya kidogo.",
  feelingSadMessage: "Kumbuka, kesho ni siku mpya!",
  feelingExcitedMessage: "Yay! Furahia furaha yako!",
  feelingTiredMessage: "Hakikisha unapata mapumziko ya kutosha.",
  hearNimiReadPage: "Sikiliza Nimi akisoma ukurasa huu",
  newReward: "Tuzo Mpya!",
  unlockedSticker: "Umefungua stika maalum!",
  viewRewards: "Angalia Tuzo",
  dayCompleteTitle: "Siku Imekamilika!",
  dayCompleteMessage: "Umekamilisha Siku {day}!",
  streakBonus: "Mfululizo wa siku {streak}!",
  streakBonusMessage: "Endelea kufanya hivyo kupata pointi za ziada!",
  nextReward: "Tuzo Inayofuata:",
  mysteryBadge: "Beji ya Misteri!",
  continueToNextDay: "Endelea na Siku",
  missionCompletedCelebration: "Misheni imekamilika! Umepata pointi {points}!",
  dayCompletedCelebration: "Siku {day} imekamilika! Umepata pointi {points}!",
  completionError: "Lo! Kitu kimeharibika. Tafadhali jaribu tena."

  }
}
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof TranslationKeys) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};