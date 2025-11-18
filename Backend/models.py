from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

from fastapi import WebSocket


# API body models - defines the structure of data for requests

# Model for a User object
class User(BaseModel):
    username: str
    email: str
    password: str | None = None
    google_id: str
    created_at: datetime
    default_session_length: int | None = 180  # Default session length in minutes
    default_min_range: int | None = 30        # Minimum range for intervals
    default_max_range: int | None = 30        # Maximum range for intervals

# Model for a Username reference
class Username(BaseModel):
    id: str
    username: str

# Model for a Contest object
class Contest(BaseModel):
    grades: List[int] | None = None           # List of grades, optional
    participants: List[Username]              # List of users participating
    session_id: str | None = None                         # Associated session ID

# Model for a Question object
class Question(BaseModel):
    type: int                                 # Question type identifier
    text: str                                 # Question text
    body: str                                 # Additional question details
    answer: str                               # Correct answer
    quiz_id: str                              # Associated quiz ID

# Model for a Quiz object
class Quizz(BaseModel):
    title: str                                # Quiz title
    creator_id: str                           # ID of the quiz creator
    session_id: str | None = None             # Associated session ID, optional
    created_at: datetime                      # Creation timestamp

# Model for an Interrupt object
class Interrupt(BaseModel):
    type: int                                 # Interrupt type identifier
    link: str                                 # Link associated with the interrupt
    interrupt_time: str                       # Time of the interrupt
    creator_id: str                           # ID of the creator
    session_id: str | None = None             # Associated session ID, optional
    quiz_id: str | None = None

# Model for a Session object
class Session(BaseModel):
    start_time: datetime                      # Start time of the session
    end_time: datetime                        # End time of the session
    creator_id: str                           # ID of the creator
    participants: List[Username]              # List of participants
    quizz_ids: List[str] | None = None
    interrupt_ids: List[str] | None = None
    contest_id: str | None = None
    duration: int
    is_public: bool
