// app/missions/staticMissionsData.ts

import {
    Smile,
    Palette,
    Volume2,
    Users2,
    BookOpen,
    Music,
  } from "lucide-react";
  
  export const missionProgram = [
    {
      day: 1,
      date: "July 1st, 2025",
      title: "NIMI Discovers Emotions",
      theme: "Emotions & Expression",
      color: "from-pink-400 to-rose-400",
      emoji: "😊",
      completed: true,
      missions: [
        {
          id: "d1m1",
          time: "8:30 AM",
          title: "The Welcome Song of Emotions",
          type: "Early Morning",
          duration: "15 min",
          points: 20,
          objectives: ["Socio-Emotional Competencies", "Oral Language"],
          activity:
            "NIMI invites the child to look in a mirror and imitate emotional faces (joy, sadness, surprise, anger) shown by NIMI or the adult. The adult helps name the emotion.",
          pikoVictory: "The child successfully mimicked and named at least 2 emotions.",
          materials: ["Mirror", "Emotion cards or pictures"],
          completed: true,
          icon: Smile,
          funFact: "Did you know? Babies can recognize emotions from 6 months old! 👶",
        },
        // ... add all your static missions from your previous `missionProgram` array
      ],
    },
    // ... other days
  ];
  