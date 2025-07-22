// app/api/creations/data.ts

export interface Creation {
    id: string;
    childName: string;
    age: number;
    creation: string;
    type: string;
    likes: number;
    image: string;
    mission: string;
    emoji: string;
    isPublic: boolean;
    createdAt: string;
    sharedWith: string[];
  }
  
  // In-memory list (replace with DB later)
  export const creations: Creation[] = [];
  