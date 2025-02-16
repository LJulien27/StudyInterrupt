from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

#API body models. This is the info required to send in the body of a request
class User(BaseModel):
    username: str
    email: str
    password: str
    default_session_length: int | None = 180
    default_session_intervals: int | None = 30

class Session(BaseModel):
    start_time: datetime
    end_time: datetime
    creator_id: str
    quiz_id: float | None = None

class Quizz(BaseModel):
    title: str
    creator_id: str

class Contest(BaseModel):
    grades: List[str] | None = None
    participants: List[str]

class Question(BaseModel):
    type: int
    title: str
    body: str
    answer: str
    quiz_id: str

class Interrupt(BaseModel):
    type: int
    link: str
    interrupt_time: str
    creator_id : str