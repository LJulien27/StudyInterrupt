#this is used to do all the create, get, update, delete actions with the database
from pymongo.errors import PyMongoError
from database import users_collection, sessions_collection , quizzes_collection , interrupts_collection , contests_collection , questions_collection
from models import *
from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId


# READ
def get_users():
    users = []
    for x in users_collection.find():
        x["_id"] = str(x["_id"])  # Convert ObjectId to string
        users.append(x)
    if len(users) > 0:
        return {"users": users}
    else:
        raise HTTPException(status_code=404, detail="No users found")

def get_user_by_id(user_id):
    try:
        obj_id = ObjectId(user_id)  # Convert string to ObjectId
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    user = users_collection.find_one({"_id": obj_id})
    if user:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    else:
        raise HTTPException(status_code=404, detail="User not found")

def get_users_sessions(user_id):
    try:
        # Ensure user_id is a valid ObjectId
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Validate user existence
        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        sessions = list(sessions_collection.find({"participants.id": user_id}))
        for session in sessions:
            session["_id"] = str(session["_id"])

        return {"message": "No sessions found for this user"} if not sessions else {"sessions": sessions}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_users_contests(user_id):
    try:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        contests = list(contests_collection.find({"participants.id": user_id}))
        for contest in contests:
            contest["_id"] = str(contest["_id"])

        return {"message": "No contests found for this user"} if not contests else {"contests": contests}
    except PyMongoError as e:
        print(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_users_interrupts(user_id):
    try:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        interrupts = list(interrupts_collection.find({"creator_id": user_id}))
        for interrupt in interrupts:
            interrupt["_id"] = str(interrupt["_id"])

        return {"message": "No interrupts found for this user"} if not interrupts else {"interrupts": interrupts}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_users_quizzes(user_id):
    try:
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        quizzes = list(quizzes_collection.find({"creator_id": user_id}))
        for quizz in quizzes:
            quizz["_id"] = str(quizz["_id"])

        return {"message": "No quizzes found for this user"} if not quizzes else {"quizzes": quizzes}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_sessions_contest(session_id):
    try:
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not sessions_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Session not found")

        contests = list(contests_collection.find({"session_id": session_id}))
        for contest in contests:
            contest["_id"] = str(contest["_id"])

        return {"message": "No contests found for this session"} if not contests else {"contests": contests}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



def get_sessions_quizzes(session_id):
    try:
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not sessions_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Session not found")

        quizzes = list(quizzes_collection.find({"session_id": session_id}))
        for quizz in quizzes:
            quizz["_id"] = str(quizz["_id"])

        return {"message": "No quizzes found for this session"} if not quizzes else {"quizzes": quizzes}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_sessions_interrupts(session_id):
    try:
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not sessions_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Session not found")

        interrupts = list(interrupts_collection.find({"session_id": session_id}))
        for interrupt in interrupts:
            interrupt["_id"] = str(interrupt["_id"])

        return {"message": "No interrupts found for this session"} if not interrupts else {"interrupts": interrupts}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_quizzes_questions(quiz_id):
    try:
        try:
            obj_id = ObjectId(quiz_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        quiz_exists = quizzes_collection.find_one({"_id": obj_id})
        if not quiz_exists:
            raise HTTPException(status_code=404, detail="Quiz not found")

        questions = []
        query = {"quiz_id": quiz_id}
        for question in questions_collection.find(query):
            question["_id"] = str(question["_id"])
            questions.append(question)

        return {"message": "No questions found for this quiz"} if not questions else {"questions": questions}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

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
        user_dict["_id"] = str(inserted.inserted_id)

        return user_dict

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def create_user_session(session: Session):
    try:
        # Ensure creator exists
        if not users_collection.find_one({"_id": ObjectId(session.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        session_dict = session.model_dump()
        inserted = sessions_collection.insert_one(session_dict)
        session_dict["_id"] = str(inserted.inserted_id)

        return session_dict

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

        contest_dict["_id"] = str(inserted.inserted_id)

        return contest_dict

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
        quiz_dict["_id"] = str(inserted.inserted_id)

        return quiz_dict

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
        interrupt_dict["_id"] = str(inserted.inserted_id)

        return interrupt_dict

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
        question_dict["_id"] = str(inserted.inserted_id)

        return question_dict

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


#UPDATES
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
def remove_user_from_contest(contest_id: str, user_id: str):
    try:
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID format")

        contest = contests_collection.find_one({"_id": ObjectId(contest_id)})
        if not contest:
            raise HTTPException(status_code=404, detail="Contest not found")

        contests_collection.update_one(
            {"_id": ObjectId(contest_id)},
            {"$pull": {"participants": {"id": user_id}}}  # Remove only this user
        )

        return {"message": "User removed from contest successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def remove_user_from_session(session_id: str, user_id: str):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$pull": {"participants": {"id": user_id}}}  # Remove only this user
        )

        return {"message": "User removed from session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def remove_quiz_from_session(session_id: str, quiz_id: str):
    try:
        if not ObjectId.is_valid(session_id) or not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid session or quiz ID format")

        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Ensure the session currently has the provided quiz_id
        if str(session.get("quiz_id")) != str(quiz_id):
            print("error here")
            raise HTTPException(status_code=400, detail="Quiz ID does not match session's quiz")

        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$unset": {"quiz_id": quiz_id}}
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
            print("Error here")
            raise HTTPException(status_code=404, detail="Session not found")

        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$pull": {"interrupts": {"_id": interrupt_id}}}
        )

        if result.modified_count == 0:
            print("Error here 2")
            raise HTTPException(status_code=404, detail="Interrupt not found in session")

        return {"message": "Interrupt removed from session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def remove_question_from_quiz(quiz_id: str, question_id: str):
    try:
        if not ObjectId.is_valid(quiz_id) or not ObjectId.is_valid(question_id):

            raise HTTPException(status_code=400, detail="Invalid quiz or question ID format")

        quiz = sessions_collection.find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            print("Error here")
            raise HTTPException(status_code=404, detail="Session not found")

        result = quizzes_collection.update_one(
            {"_id": ObjectId(quiz_id)},
            {"$pull": {"questions": {"_id": question_id}}}
        )

        if result.modified_count == 0:
            print("Error here 2")
            raise HTTPException(status_code=404, detail="Interrupt not found in session")

        return {"message": "Question removed from session successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ✅ Delete a User
def delete_user(user_id: str):
    try:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID")

        user_quizzes = quizzes_collection.find({"creator_id": user_id})
        quiz_ids = [str(quiz["_id"]) for quiz in user_quizzes]

        # Delete all questions linked to those quizzes
        questions_result = questions_collection.delete_many({"quiz_id": {"$in": quiz_ids}})

        # Delete all quizzes created by this user
        quizzes_result = quizzes_collection.delete_many({"creator_id": user_id})

        # Delete all sessions created by this user
        sessions_result = sessions_collection.delete_many({"creator_id": user_id})

        interrupt_result = interrupts_collection.delete_many({"creator_id": user_id})

        # Delete the user
        result = users_collection.delete_one({"_id": ObjectId(user_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "User deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Delete a Session
def delete_session(session_id: str):
    try:
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID")

        # Set session_id to None in contests
        contests_result = contests_collection.update_many(
            {"session_id": session_id}, {"$set": {"session_id": None}}
        )

        # Set session_id to None in interrupts
        interrupts_result = interrupts_collection.update_many(
            {"session_id": session_id}, {"$set": {"session_id": None}}
        )

        # Set session_id to None in quizzes
        quizzes_result = quizzes_collection.update_many(
            {"session_id": session_id}, {"$set": {"session_id": None}}
        )

        result = sessions_collection.delete_one({"_id": ObjectId(session_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"message": "Session deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Delete a Contest. Nothing to check for
def delete_contest(contest_id: str):
    try:
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID")

        result = contests_collection.delete_one({"_id": ObjectId(contest_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contest not found")

        return {"message": "Contest deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Delete a Quiz
def delete_quiz(quiz_id: str):
    try:
        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid quiz ID")

        # Delete all questions associated with this quiz
        questions_result = questions_collection.delete_many({"quiz_id": quiz_id})

        # Delete the quiz itself
        result = quizzes_collection.delete_one({"_id": ObjectId(quiz_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Quiz not found")

        return {"message": "Quiz deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Delete a Question. need to check in Quizz
def delete_question(question_id: str):
    try:
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=400, detail="Invalid question ID")

        # Remove the question ID from any quiz that contains it
        quizzes_collection.update_many(
            {"questions": question_id},
            {"$pull": {"questions": question_id}}
        )

        # Delete the question itself
        result = questions_collection.delete_one({"_id": ObjectId(question_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")

        return {"message": "Question deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ✅ Delete an Interrupt
def delete_interrupt(interrupt_id: str):
    try:
        if not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid interrupt ID")

        sessions_collection.update_many(
            {"interrupts._id": interrupt_id},
            {"$pull": {"interrupts": {"_id": interrupt_id}}}
        )

        # Delete the interrupt itself
        result = interrupts_collection.delete_one({"_id": ObjectId(interrupt_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Interrupt not found")

        return {"message": "Interrupt deleted successfully"}

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")




