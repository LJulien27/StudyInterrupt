#this is used to do all the create, get, update, delete actions with the database
from pymongo.errors import PyMongoError
from database import users_collection, sessions_collection , quizzes_collection , interrupts_collection , contests_collection , questions_collection
from models import *
from fastapi import HTTPException
from bson import ObjectId



# READ
def get_users():
    users = []
    for x in users_collection.find():
        x["_id"] = str(x["_id"])  # Convert ObjectId to string
        users.append(x)
    return users

def get_user_by_id(user_id):
    try:
        obj_id = ObjectId(id)  # Convert string to ObjectId
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    user = users_collection.find_one({"_id": obj_id})
    if user:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    else:
        raise HTTPException(status_code=404, detail="User not found")

#this includes user sessions where they are not the creator
def get_users_sessions(user_id):
    try:
        sessions = []
        query = { "participants.id": user_id}
        for session in sessions_collection.find(query):
            session["_id"] = str(session["_id"])  # Convert ObjectId to string
            sessions.append(session)

        if len(sessions) == 0:
            return {"message": "No sessions found for this user"}
    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

def get_users_contests(user_id):
    try:
        contests = []
        query = {"participants.id": user_id}
        for contest in contests_collection.find(query):
            contest["_id"] = str(contest["_id"])  # Convert ObjectId to string
            contests.append(contest)

        if len(contests) == 0:
            return {"message": "No contests found for this user"}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

def get_users_interrupts(user_id):
    try:
        interrupts = []
        query = {"creator_id": user_id}
        for interrupt in interrupts_collection.find(query):
            interrupt["_id"] = str(interrupt["_id"])  # Convert ObjectId to string
            interrupts.append(interrupt)

        if len(interrupts) == 0:
            return {"message": "No interrupts found for this user"}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

def get_users_quizzes(user_id):
    try:
        quizzes = []
        query = {"creator_id": user_id}
        for quizz in quizzes_collection.find(query):
            quizz["_id"] = str(quizz["_id"])  # Convert ObjectId to string
            quizzes.append(quizz)

        if len(quizzes) == 0:
            return {"message": "No quizzes found for this user"}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

def get_sessions_contest(session_id: str):
    try:
        contests = []
        query = {"session_id": session_id}
        for contest in contests_collection.find(query):
            contest["_id"] = str(contest["_id"])  # Convert ObjectId to string
            contests.append(contest)

        if len(contests) == 0:
            return {"message": "No contests found for this session"}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}


def get_sessions_quizzes(session_id: str):
     try:
         quizzes = []
         query = {"creator_id": session_id}
         for quizz in quizzes_collection.find(query):
             quizz["_id"] = str(quizz["_id"])  # Convert ObjectId to string
             quizzes.append(quizz)

         if len(quizzes) == 0:
             return {"message": "No quizzes found for this session"}

     except PyMongoError as e:
         return {"error": f"Database error: {str(e)}"}

     except Exception as e:
         return {"error": f"An unexpected error occurred: {str(e)}"}

def get_sessions_interrupts(session_id):
    try:
        interrupts = []
        query = {"session_id": session_id}
        for interrupt in interrupts_collection.find(query):
            interrupt["_id"] = str(interrupt["_id"])  # Convert ObjectId to string
            interrupts.append(interrupt)

        if len(interrupts) == 0:
            return {"message": "No interrupts found for this session"}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

def get_quiz_by_id(quiz_id):
    try:
        obj_id = ObjectId(quiz_id)  # Convert string to ObjectId
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    quizz = quizzes_collection.find_one({"_id": obj_id})
    if quizz:
        quizz["_id"] = str(quizz["_id"])  # Convert ObjectId to string
        return quizz
    else:
        raise HTTPException(status_code=404, detail="Quizz not found")

def get_quizzes_questions(quiz_id):
    try:
        questions = []
        query = {"creator_id": quiz_id}
        for question in questions_collection.find(query):
            question["_id"] = str(question["_id"])  # Convert ObjectId to string
            questions.append(question)

        if len(questions) == 0:
            return {"message": "No questions found for this quiz"}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}

"""
 # Create 
def create_user(user: User):
    user_dict = user.model_dump()  # Convert Pydantic model to dict
    inserted = users_collection.insert_one(user_dict)  # Insert into MongoDB
    return {"message": "User added", "id": str(inserted.inserted_id)}

# UPDATE 
def update_user(username: str, updated_data: dict):
    mycol.update_one({"username": username}, {"$set": updated_data})
    return {"message": "User updated"}

# DELETE 
def delete_user(username: str):
    mycol.delete_one({"username": username})
    return {"message": "User deleted"}"""


