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

class Session(BaseModel):
    start_time: datetime
    end_time: datetime
    creator_id: str
    participants: List[Username]
    quiz_id: float | None = None


class Contest(BaseModel):
    grades: List[str] | None = None
    participants: List[Username]
    session_id: str

class Question(BaseModel):
    type: int
    title: str
    body: str
    answer: str
    quiz_id: str

class Quizz(BaseModel):
    title: str
    creator_id: str
    created_at: datetime
    questions: List[str]

class Interrupt(BaseModel):
    type: int
    link: str
    interrupt_time: str
    creator_id : str
    session_id: str | None = None