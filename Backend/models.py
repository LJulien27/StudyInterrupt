from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

#API body models. This is the info required to send in the body of a request
class User(BaseModel):
    username: str
    email: str
    password: str
    created_at: datetime
    default_session_length: int | None = 180
    default_min_range: int | None = 30
    default_max_range: int | None = 30

class Username(BaseModel):
    id: str
    username: str

class Contest(BaseModel):
    grades: List[int] | None = None
    participants: List[Username]
    session_id: str

class Question(BaseModel):
    type: int
    text: str
    body: str
    answer: str
    quiz_id: str

class Quizz(BaseModel):
    title: str
    creator_id: str
    session_id: str | None = None
    created_at: datetime

class Interrupt(BaseModel):
    type: int
    link: str
    interrupt_time: str
    creator_id : str
    session_id: str | None = None

class Session(BaseModel):
    start_time: datetime
    end_time: datetime
    creator_id: str
    participants: List[Username]
    quiz_id: str | None = None