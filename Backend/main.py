from fastapi import FastAPI

import crud
from crud import *

    # Initialize FastAPI app
app = FastAPI(title="Fast Mongo API")

#GET Requests
@app.get("/users/{id}")
async def get_user_by_id(id: str):
    return crud.get_user_by_id(id)

@app.get("/users/")
async def get_users():
    return {"users": crud.get_users()}

@app.get("/users/{id}/sessions")
async def get_users_sessions(id: str):
    return crud.get_users_sessions(id)

@app.get("/users/{id}/contests")
async def get_users_contests(id: str):
    return crud.get_users_contests(id)

@app.get("/users/{id}/interrupts")
async def get_users_interrupts(id: str):
    return crud.get_users_interrupts(id)

@app.get("/users/{id}/quizzes")
async def get_users_quizzes(id: str):
    return crud.get_users_quizzes(id)

@app.get("/sessions/{id}/contests")
async def get_sessions_contest(id: str):
    return crud.get_sessions_contest(id)

@app.get("/sessions/{id}/quizzes")
async def get_sessions_quizzes(id: str):
    return crud.get_sessions_quizzes(id)

@app.get("/session/{id}/interrupts")
async def get_session_interrupts(id: str):
    return crud.get_sessions_interrupts(id)

@app.get("/quizzes/{id}")
async def get_quiz_by_id(id: str):
    return crud.get_quiz_by_id(id)

@app.get("/quizzes/{id}/questions")
async def get_quizzes_questions(id: str):
    return crud.get_quizzes_questions(id)

#POST methods
@app.post("/users")
async def add_user(user: User):
    return crud.create_user(user)

@app.post("/users/{id}/sessions", status_code=201)
async def add_user_session(session: Session):
    return create_user_session(session)

@app.post("/users/{id}/contests", status_code=201)
async def add_user_contest(contest: Contest):
    return create_contest(contest)

@app.post("/users/{id}/quizzes", status_code=201)
async def add_user_quiz(quiz: Quizz):
    return create_quiz(quiz)

@app.post("/sessions/{id}/interrupts", status_code=201)
async def add_session_interrupt(interrupt: Interrupt):
    return create_interrupt(interrupt)

@app.post("/quizzes/{id}/questions", status_code=201)
async def add_quiz_question(question: Question):
    return create_question(question)

#PUT methods
@app.put("/users/{id}", status_code=200)
async def edit_user(id: str, user: User):
    return update_user(id, user)

@app.put("/sessions/{id}", status_code=200)
async def edit_user_session(id: str, session: Session):
    return update_user_session(id, session)

@app.put("/contests/{id}", status_code=200)
async def edit_contest(id: str, contest: Contest):
    return update_contest(id, contest)

@app.put("/quizzes/{id}", status_code=200)
async def edit_quiz(id: str, quiz: Quizz):
    return update_quiz(id, quiz)

@app.put("/interrupts/{id}", status_code=200)
async def edit_interrupt(id: str, interrupt: Interrupt):
    return update_interrupt(id, interrupt)

@app.put("/questions/{id}", status_code=200)
async def edit_question(id: str, question: Question):
    return update_question(id, question)

#PATCH methods

@app.patch("/contests/{id}/add-users", status_code=200)
async def patch_add_users_to_contest(id: str, users: list[Username]):
    return add_users_to_contest(id, users)

@app.patch("/sessions/{id}/add-users", status_code=200)
async def patch_add_users_to_session(id: str, users: list[Username]):
    return add_users_to_session(id, users)

@app.patch("/sessions/{id}/add-quiz", status_code=200)
async def patch_add_quiz_to_session(id: str, quiz_id: str):
    return add_quiz_to_session(id, quiz_id)

@app.patch("/sessions/{session_id}/add-interrupt/{interrupt_id}", status_code=200)
async def patch_add_interrupt(session_id: str, interrupt_id: str):
    return add_interrupt_to_session(session_id, interrupt_id)

#DELETE

@app.delete("/contests/{id}/remove-users", status_code=200)
async def delete_users_from_contest(id: str, users: list[Username]):
    return remove_users_from_contest(id, users)

@app.delete("/sessions/{id}/remove-users", status_code=200)
async def delete_users_from_session(id: str, users: list[Username]):
    return remove_users_from_session(id, users)

@app.delete("/sessions/{id}/remove-quiz", status_code=200)
async def delete_quiz_from_session(id: str):
    return remove_quiz_from_session(id)

@app.delete("/sessions/{session_id}/remove-interrupt/{interrupt_id}", status_code=200)
async def delete_remove_interrupt(session_id: str, interrupt_id: str):
    return remove_interrupt_from_session(session_id, interrupt_id)

@app.delete("/users/{user_id}", status_code=200)
async def delete_user_route(user_id: str):
    return delete_user(user_id)

@app.delete("/sessions/{session_id}", status_code=200)
async def delete_session_route(session_id: str):
    return delete_session(session_id)

@app.delete("/contests/{contest_id}", status_code=200)
async def delete_contest_route(contest_id: str):
    return delete_contest(contest_id)

@app.delete("/quizzes/{quiz_id}", status_code=200)
async def delete_quiz_route(quiz_id: str):
    return delete_quiz(quiz_id)

@app.delete("/questions/{question_id}", status_code=200)
async def delete_question_route(question_id: str):
    return delete_question(question_id)

@app.delete("/interrupts/{interrupt_id}", status_code=200)
async def delete_interrupt_route(interrupt_id: str):
    return delete_interrupt(interrupt_id)