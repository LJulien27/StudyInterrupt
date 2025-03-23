export interface Username {
    id: string;
    username: string;
  }
  
  export interface Session {
    _id: string;
    start_time: string;
    end_time: string;
    creator_id: string;
    participants: Username[];
    quiz_id?: string;
  }
  