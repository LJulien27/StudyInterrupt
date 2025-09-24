from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

import crud
from crud import *

from init_db import init_db

    # Initialize FastAPI app
app = FastAPI(title="StudyInterrupt API")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure CORS
origins = [
    "http://localhost:3000",  # React development server
    # Add other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan():
    init_db()
    # above the 'yield' is executed before the application starts
    yield
    # below the 'yield' is executed after the application finishes

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Request: {await request.body()}")
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

#GET Requests
@app.get("/users/{id}")
async def get_user_by_id(id: str):
    return crud.get_user_by_id(id)

# Fetch all users
@app.get("/users/")
async def get_users():
    return crud.get_users()

# Fetch all sessions for a specific user
@app.get("/users/{id}/sessions")
async def get_users_sessions(id: str):
    return crud.get_users_sessions(id)

# Fetch all contests for a specific user
@app.get("/users/{id}/contests")
async def get_users_contests(id: str):
    return crud.get_users_contests(id)

# Fetch all interrupts for a specific user
@app.get("/users/{id}/interrupts")
async def get_users_interrupts(id: str):
    return crud.get_users_interrupts(id)

# Fetch all quizzes for a specific user
@app.get("/users/{id}/quizzes")
async def get_users_quizzes(id: str):
    return crud.get_users_quizzes(id)

# Fetch the contest associated with a specific session
@app.get("/sessions/{id}/contests")
async def get_sessions_contest(id: str):
    return crud.get_sessions_contest(id)

# Fetch all quizzes for a specific session
@app.get("/sessions/{id}/quizzes")
async def get_sessions_quizzes(id: str):
    return crud.get_sessions_quizzes(id)

# Fetch all interrupts for a specific session
@app.get("/sessions/{id}/interrupts")
async def get_session_interrupts(id: str):
    return crud.get_sessions_interrupts(id)

# Fetch a specific quiz by ID
@app.get("/quizzes/{id}")
async def get_quiz_by_id(id: str):
    return crud.get_quiz_by_id(id)

# Fetch all questions for a specific quiz
@app.get("/quizzes/{id}/questions")
async def get_quizzes_questions(id: str):
    return crud.get_quizzes_questions(id)

#POST methods
@app.post("/users")
async def add_user(user: User):
    return crud.create_user(user)

# POST methods for creating new resources

# Create a new session
@app.post("/sessions", status_code=201)
async def add_user_session(session: Session):
    return create_user_session(session)

# Create a new contest
@app.post("/contests", status_code=201)
async def add_user_contest(contest: Contest):
    return create_contest(contest)

# Create a new quiz
@app.post("/quizzes", status_code=201)
async def add_user_quiz(quiz: Quizz):
    return create_quiz(quiz)

# Create a new interrupt
@app.post("/interrupts", status_code=201)
async def add_session_interrupt(interrupt: Interrupt):
    return create_interrupt(interrupt)

# Create a new quiz question
@app.post("/questions", status_code=201)
async def add_quiz_question(question: Question):
    return create_question(question)

# PUT methods for updating existing resources

# Update an existing user
@app.put("/users/{id}", status_code=200)
async def edit_user(id: str, user: User):
    return update_user(id, user)

# Update an existing session
@app.put("/sessions/{id}", status_code=200)
async def edit_user_session(id: str, session: Session):
    return update_user_session(id, session)

# Update an existing contest
@app.put("/contests/{id}", status_code=200)
async def edit_contest(id: str, contest: Contest):
    return update_contest(id, contest)

# Update an existing quiz
@app.put("/quizzes/{id}", status_code=200)
async def edit_quiz(id: str, quiz: Quizz):
    return update_quiz(id, quiz)

# Update an existing interrupt
@app.put("/interrupts/{id}", status_code=200)
async def edit_interrupt(id: str, interrupt: Interrupt):
    return update_interrupt(id, interrupt)

# Update an existing quiz question
@app.put("/questions/{id}", status_code=200)
async def edit_question(id: str, question: Question):
    return update_question(id, question)


# PATCH methods for partial updates

# Add users to an existing contest
@app.patch("/contests/{id}/add-users", status_code=200)
async def patch_add_users_to_contest(id: str, users: list[Username]):
    return add_users_to_contest(id, users)

# Add users to an existing session
@app.patch("/sessions/{id}/add-users", status_code=200)
async def patch_add_users_to_session(id: str, users: list[Username]):
    return add_users_to_session(id, users)

# Link a quiz to a specific session
@app.patch("/sessions/{id}/add-quiz/{quiz_id}", status_code=200)
async def patch_add_quiz_to_session(id: str, quiz_id: str):
    return add_quiz_to_session(id, quiz_id)

# Link an interrupt to a specific session
@app.patch("/sessions/{session_id}/add-interrupt/{interrupt_id}", status_code=200)
async def patch_add_interrupt(session_id: str, interrupt_id: str):
    return add_interrupt_to_session(session_id, interrupt_id)

# DELETE methods for removing resources

# Remove a user from a contest
@app.delete("/contests/{contest_id}/remove-user/{user_id}", status_code=200)
async def delete_users_from_contest(contest_id: str, user_id: str):
    return remove_user_from_contest(contest_id, user_id)

# Remove a user from a session
@app.delete("/sessions/{session_id}/remove-user/{user_id}", status_code=200)
async def delete_users_from_session(session_id: str, user_id: str):
    return remove_user_from_session(session_id, user_id)

# Unlink a quiz from a session
@app.delete("/sessions/{session_id}/remove-quiz/{quiz_id}", status_code=200)
async def delete_quiz_from_session(session_id: str, quiz_id: str):
    return remove_quiz_from_session(session_id, quiz_id)

# Unlink an interrupt from a session
@app.delete("/sessions/{session_id}/remove-interrupt/{interrupt_id}", status_code=200)
async def delete_remove_interrupt(session_id: str, interrupt_id: str):
    return remove_interrupt_from_session(session_id, interrupt_id)

# Delete individual resources

# Delete a user by ID
@app.delete("/users/{user_id}", status_code=200)
async def delete_user_route(user_id: str):
    return delete_user(user_id)

# Delete a session by ID
@app.delete("/sessions/{session_id}", status_code=200)
async def delete_session_route(session_id: str):
    return delete_session(session_id)

# Delete a contest by ID
@app.delete("/contests/{contest_id}", status_code=200)
async def delete_contest_route(contest_id: str):
    return delete_contest(contest_id)

# Delete a quiz by ID
@app.delete("/quizzes/{quiz_id}", status_code=200)
async def delete_quiz_route(quiz_id: str):
    return delete_quiz(quiz_id)

# Delete a question by ID
@app.delete("/questions/{question_id}", status_code=200)
async def delete_question_route(question_id: str):
    return delete_question(question_id)

# Delete an interrupt by ID
@app.delete("/interrupts/{interrupt_id}", status_code=200)
async def delete_interrupt_route(interrupt_id: str):
    return delete_interrupt(interrupt_id)

# Run the application using Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
