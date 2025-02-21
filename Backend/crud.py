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
        else:
            return {"sessions": sessions}
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
        else:
            return {"contests": contests}

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
        else:
            return {"interrupts": interrupts}

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
        else:
            return {"quizzes": quizzes}

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
        else:
            return {"contests": contests}

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
         else:
             return {"quizzes": quizzes}

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
        else:
            return {"interrupts": interrupts}

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
        query = {"quiz_id": quiz_id}
        for question in questions_collection.find(query):
            question["_id"] = str(question["_id"])  # Convert ObjectId to string
            questions.append(question)

        if len(questions) == 0:
            return {"message": "No questions found for this quiz"}
        else:
            return {"questions": questions}

    except PyMongoError as e:
        return {"error": f"Database error: {str(e)}"}

    except Exception as e:
        return {"error": f"An unexpected error occurred: {str(e)}"}




 # Create 
def create_user(user: User):
    try:
        # Ensure required fields are not empty
        if not user.username or not user.email or not user.password:
            raise HTTPException(status_code=400, detail="Username, email, and password are required")

        # Check if email already exists (to enforce uniqueness)
        if users_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=409, detail="Email already registered")

        # Convert Pydantic model to dict
        user_dict = user.model_dump()

        # Insert into MongoDB
        inserted = users_collection.insert_one(user_dict)

        return {"message": "User added", "id": str(inserted.inserted_id)}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

def create_user_session(session: Session):
    try:
        # Ensure creator exists
        if not users_collection.find_one({"_id": ObjectId(session.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        session_dict = session.model_dump()
        inserted = sessions_collection.insert_one(session_dict)

        return {"message": "Session created", "id": str(inserted.inserted_id)}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Create a Contest
def create_contest(contest: Contest):
    try:
        # Ensure session exists
        if not sessions_collection.find_one({"_id": ObjectId(contest.session_id)}):
            raise HTTPException(status_code=404, detail="Session not found")

        contest_dict = contest.model_dump()
        inserted = contests_collection.insert_one(contest_dict)

        return {"message": "Contest created", "id": str(inserted.inserted_id)}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Create a Quiz
def create_quiz(quiz: Quizz):
    try:
        # Ensure creator exists
        if not users_collection.find_one({"_id": ObjectId(quiz.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        quiz_dict = quiz.model_dump()
        inserted = quizzes_collection.insert_one(quiz_dict)

        return {"message": "Quiz created", "id": str(inserted.inserted_id)}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Create an Interrupt
def create_interrupt(interrupt: Interrupt):
    try:
        # Ensure creator exists
        if not users_collection.find_one({"_id": ObjectId(interrupt.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        # Ensure session exists if session_id is provided
        if interrupt.session_id and not sessions_collection.find_one({"_id": ObjectId(interrupt.session_id)}):
            raise HTTPException(status_code=404, detail="Session not found")

        interrupt_dict = interrupt.model_dump()
        inserted = interrupts_collection.insert_one(interrupt_dict)

        return {"message": "Interrupt created", "id": str(inserted.inserted_id)}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Create a Question
def create_question(question: Question):
    try:
        # Ensure quiz exists
        if not quizzes_collection.find_one({"_id": ObjectId(question.quiz_id)}):
            raise HTTPException(status_code=404, detail="Quiz not found")

        question_dict = question.model_dump()
        inserted = questions_collection.insert_one(question_dict)

        return {"message": "Question created", "id": str(inserted.inserted_id)}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


#UPDATES
from pymongo.errors import PyMongoError
from fastapi import HTTPException
from database import users_collection
from models import User
from bson import ObjectId

# ✅ Update a User by ID
def update_user(user_id: str, user: User):
    try:
        if not ObjectId.is_valid(ObjectId(user_id)):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        existing_user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        user_dict = user.model_dump(exclude_unset=True)  # Only update provided fields
        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": user_dict})

        return {"message": "User updated successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Update a User Session
def update_user_session(session_id: str, session: Session):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not sessions_collection.find_one({"_id": ObjectId(session_id)}):
            raise HTTPException(status_code=404, detail="Session not found")

        session_dict = session.model_dump(exclude_unset=True)
        sessions_collection.update_one({"_id": ObjectId(session_id)}, {"$set": session_dict})

        return {"message": "Session updated successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Update a Contest
def update_contest(contest_id: str, contest: Contest):
    try:
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID format")

        if not contests_collection.find_one({"_id": ObjectId(contest_id)}):
            raise HTTPException(status_code=404, detail="Contest not found")

        contest_dict = contest.model_dump(exclude_unset=True)
        contests_collection.update_one({"_id": ObjectId(contest_id)}, {"$set": contest_dict})

        return {"message": "Contest updated successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Update a Quiz
def update_quiz(quiz_id: str, quiz: Quizz):
    try:
        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        if not quizzes_collection.find_one({"_id": ObjectId(quiz_id)}):
            raise HTTPException(status_code=404, detail="Quiz not found")

        quiz_dict = quiz.model_dump(exclude_unset=True)
        quizzes_collection.update_one({"_id": ObjectId(quiz_id)}, {"$set": quiz_dict})

        return {"message": "Quiz updated successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Update an Interrupt
def update_interrupt(interrupt_id: str, interrupt: Interrupt):
    try:
        if not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid interrupt ID format")

        if not interrupts_collection.find_one({"_id": ObjectId(interrupt_id)}):
            raise HTTPException(status_code=404, detail="Interrupt not found")

        interrupt_dict = interrupt.model_dump(exclude_unset=True)
        interrupts_collection.update_one({"_id": ObjectId(interrupt_id)}, {"$set": interrupt_dict})

        return {"message": "Interrupt updated successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Update a Question
def update_question(question_id: str, question: Question):
    try:
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=400, detail="Invalid question ID format")

        if not questions_collection.find_one({"_id": ObjectId(question_id)}):
            raise HTTPException(status_code=404, detail="Question not found")

        question_dict = question.model_dump(exclude_unset=True)
        questions_collection.update_one({"_id": ObjectId(question_id)}, {"$set": question_dict})

        return {"message": "Question updated successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Patch
# ✅ Add Users to a Contest
def add_users_to_contest(contest_id: str, users: list[Username]):
    try:
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID format")

        contest = contests_collection.find_one({"_id": ObjectId(contest_id)})
        if not contest:
            raise HTTPException(status_code=404, detail="Contest not found")

        existing_participants = contest.get("participants", [])
        new_users = [user.model_dump() for user in users if user.model_dump() not in existing_participants]

        if not new_users:
            return {"message": "No new users added (users may already exist in the contest)"}

        contests_collection.update_one(
            {"_id": ObjectId(contest_id)},
            {"$addToSet": {"participants": {"$each": new_users}}}  # Prevent duplicates
        )

        return {"message": "Users added to contest successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Add Users to a Session
def add_users_to_session(session_id: str, users: list[Username]):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        existing_participants = session.get("participants", [])
        new_users = [user.model_dump() for user in users if user.model_dump() not in existing_participants]

        if not new_users:
            return {"message": "No new users added (users may already exist in the session)"}

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$addToSet": {"participants": {"$each": new_users}}}
        )

        return {"message": "Users added to session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Add a Quiz to a Session
def add_quiz_to_session(session_id: str, quiz_id: str):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"quiz_id": quiz_id}}
        )

        return {"message": "Quiz added to session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def add_interrupt_to_session(session_id: str, interrupt_id: str):
    try:
        if not ObjectId.is_valid(session_id) or not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid session or interrupt ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        interrupt = interrupts_collection.find_one({"_id": ObjectId(interrupt_id)})
        if not interrupt:
            raise HTTPException(status_code=404, detail="Interrupt not found")

        # Convert ObjectId to string for JSON compatibility
        interrupt["_id"] = str(interrupt["_id"])

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"interrupts": interrupt}}
        )

        return {"message": "Interrupt added to session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

#Removing things from lists

# ✅ Remove Users from a Contest
def remove_users_from_contest(contest_id: str, users: list[Username]):
    try:
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID format")

        contest = contests_collection.find_one({"_id": ObjectId(contest_id)})
        if not contest:
            raise HTTPException(status_code=404, detail="Contest not found")

        user_ids_to_remove = [user.id for user in users]

        contests_collection.update_one(
            {"_id": ObjectId(contest_id)},
            {"$pull": {"participants": {"id": {"$in": user_ids_to_remove}}}}
        )

        return {"message": "Users removed from contest successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Remove Users from a Session
def remove_users_from_session(session_id: str, users: list[Username]):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        user_ids_to_remove = [user.id for user in users]

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$pull": {"participants": {"id": {"$in": user_ids_to_remove}}}}
        )

        return {"message": "Users removed from session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Remove a Quiz from a Session
def remove_quiz_from_session(session_id: str):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$unset": {"quiz_id": ""}}
        )

        return {"message": "Quiz removed from session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def remove_interrupt_from_session(session_id: str, interrupt_id: str):
    try:
        if not ObjectId.is_valid(session_id) or not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid session or interrupt ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$pull": {"interrupts": {"_id": interrupt_id}}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Interrupt not found in session")

        return {"message": "Interrupt removed from session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

#Actually deleting things
def delete_item(collection, item_id: str, item_name: str):
    try:
        if not ObjectId.is_valid(item_id):
            raise HTTPException(status_code=400, detail=f"Invalid {item_name} ID")

        result = collection.delete_one({"_id": ObjectId(item_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"{item_name.capitalize()} not found")

        return {"message": f"{item_name.capitalize()} deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Delete a User
def delete_user(user_id: str):
    return delete_item(users_collection, user_id, "user")


# ✅ Delete a Session
def delete_session(session_id: str):
    return delete_item(sessions_collection, session_id, "session")


# ✅ Delete a Contest
def delete_contest(contest_id: str):
    return delete_item(contests_collection, contest_id, "contest")


# ✅ Delete a Quiz
def delete_quiz(quiz_id: str):
    return delete_item(quizzes_collection, quiz_id, "quiz")


# ✅ Delete a Question
def delete_question(question_id: str):
    return delete_item(questions_collection, question_id, "question")


# ✅ Delete an Interrupt
def delete_interrupt(interrupt_id: str):
    return delete_item(interrupts_collection, interrupt_id, "interrupt")



