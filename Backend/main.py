from fastapi import FastAPI, HTTPException
from bson import ObjectId

import crud
from models import *
from database import *
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
    return {crud.get_users_sessions(id)}

@app.get("/users/{id}/contests")
async def get_users_contests(id: str):
    return {crud.get_users_contests(id)}

@app.get("/users/{id}/interrupts")
async def get_users_interrupts(id: str):
    return {crud.get_users_interrupts(id)}

@app.get("/users/{id}/quizzes")
async def get_users_quizzes(id: str):
    return {crud.get_users_quizzes(id)}

@app.get("/sessions/{id}/contests")
async def get_sessions_contest(id: str):
    return {crud.get_sessions_contest(id)}

@app.get("/sessions/{id}/quizzes")
async def get_sessions_quizzes(id: str):
    return {crud.get_sessions_quizzes(id)}

@app.get("/session/{id}/interrupts")
async def get_session_interrupts(id: str):
    return {crud.get_sessions_interrupts(id)}

@app.get("/quizzes/{id}")
async def get_quiz_by_id(id: str):
    return {crud.get_quiz_by_id(id)}

@app.get("/quizzes/{id}/questions")
async def get_quizzes_questions(id: str):
    return {crud.get_quizzes_questions()}


"""
#POST methods
@app.post("/users")
async def add_user(user: User):
    doc = {"name": name}
    result = users_collection.insert_one(doc)
    return {"inserted_id": str(result.inserted_id)}
    """
