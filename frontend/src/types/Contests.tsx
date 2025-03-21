// src/types/Contest.ts
  export interface Contest {
    grades?: number[];
    participants: Username[];
    session_id: string;
  }
  
  export interface Username {
    id: string;
    username: string;
  }