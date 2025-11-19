#this is used to do all the create, get, update, delete actions with the database
from pymongo.errors import PyMongoError
from database import users_collection, sessions_collection , quizzes_collection , interrupts_collection , contests_collection , questions_collection
from models import *
from fastapi import HTTPException
from bson import ObjectId
from bson.errors import InvalidId


# READ
def get_users():
    # Fetch all users from the database
    users = []
    for x in users_collection.find():
        x["_id"] = str(x["_id"])  # Convert ObjectId to string
        users.append(x)

    # Return users if found, else raise 404
    if len(users) > 0:
        return {"users": users}
    else:
        raise HTTPException(status_code=404, detail="No users found")

def check_if_user_with_google_id(google_id):
    # Fetch user by ID
    user = users_collection.find_one({"google_id": google_id})
    if user:
        return True
    else:
        raise HTTPException(status_code=404, detail="User with that google id not found")


def get_user_by_id(user_id):
    # Validate and convert user ID
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # Fetch user by ID
    user = users_collection.find_one({"_id": obj_id})
    if user:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    else:
        raise HTTPException(status_code=404, detail="User not found")

def get_user_by_username(username):
    # Fetch user by ID
    user = users_collection.find_one({"username": username})
    if user:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    else:
        raise HTTPException(status_code=404, detail="User not found")

def get_users_sessions(user_id):
    try:
        # Validate user ID
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Check user existence
        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch user sessions
        sessions = list(sessions_collection.find({"participants.id": user_id}))
        for session in sessions:
            session["_id"] = str(session["_id"])

        # Return sessions or message if not found
        return {"message": "No sessions found for this user"} if not sessions else {"sessions": sessions}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_users_contests(user_id):
    try:
        # Validate user ID
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Check user existence
        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch user contests
        contests = list(contests_collection.find({"participants.id": user_id}))
        for contest in contests:
            contest["_id"] = str(contest["_id"])

        return {"message": "No contests found for this user"} if not contests else {"contests": contests}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_users_interrupts(user_id):
    try:
        # Validate user ID
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Check user existence
        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch user interrupts
        interrupts = list(interrupts_collection.find({"creator_id": user_id}))
        for interrupt in interrupts:
            interrupt["_id"] = str(interrupt["_id"])

        return {"message": "No interrupts found for this user"} if not interrupts else {"interrupts": interrupts}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_users_quizzes(user_id):
    try:
        # Validate user ID
        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Check user existence
        if not users_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch user quizzes
        quizzes = list(quizzes_collection.find({"creator_id": user_id}))
        for quizz in quizzes:
            quizz["_id"] = str(quizz["_id"])

        return {"message": "No quizzes found for this user"} if not quizzes else {"quizzes": quizzes}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_session_by_id (session_id):
    try:
        # Validate session ID
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Fetch user by ID
        session = sessions_collection.find_one({"_id": obj_id})
        if session:
            session["_id"] = str(session["_id"])  # Convert ObjectId to string
            return session
        else:
            raise HTTPException(status_code=404, detail="User not found")

    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_sessions_contest(session_id):
    try:
        # Validate session ID
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Check session existence
        if not sessions_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Session not found")

        # Fetch contest for session
        contest = contests_collection.find_one({"session_id": session_id})
        if contest:
            contest["_id"] = str(contest["_id"])

        return {"message": "No contests found for this session"} if not contest else {"contest": contest}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_sessions_quizzes(session_id):
    try:
        # Validate session ID
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Check session existence
        if not sessions_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Session not found")

        # Fetch quizzes for session
        quizzes = list(quizzes_collection.find({"session_id": session_id}))
        for quizz in quizzes:
            quizz["_id"] = str(quizz["_id"])

        return {"message": "No quizzes found for this session"} if not quizzes else {"quizzes": quizzes}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_sessions_interrupts(session_id):
    try:
        # Validate session ID
        try:
            obj_id = ObjectId(session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Check session existence
        if not sessions_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Session not found")

        # Fetch interrupts for session
        interrupts = list(interrupts_collection.find({"session_id": session_id}))
        for interrupt in interrupts:
            interrupt["_id"] = str(interrupt["_id"])

        return {"message": "No interrupts found for this session"} if not interrupts else {"interrupts": interrupts}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_quizzes_questions(quiz_id):
    try:
        # Validate quiz ID
        try:
            obj_id = ObjectId(quiz_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        # Check quiz existence
        if not quizzes_collection.find_one({"_id": obj_id}):
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Fetch questions for quiz
        questions = list(questions_collection.find({"quiz_id": quiz_id}))
        for question in questions:
            question["_id"] = str(question["_id"])

        return {"message": "No questions found for this quiz"} if not questions else {"questions": questions}
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_question_by_id(question_id):
    # Validate and convert user ID
    try:
        obj_id = ObjectId(question_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid question user ID format")

    # Fetch user by ID
    question = questions_collection.find_one({"_id": obj_id})
    if question:
        question["_id"] = str(question["_id"])  # Convert ObjectId to string
        return question
    else:
        raise HTTPException(status_code=404, detail="User not found")


def get_quiz_by_id(quiz_id):
    # Fetch quiz by ID
    try:
        obj_id = ObjectId(quiz_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    quizz = quizzes_collection.find_one({"_id": obj_id})
    if quizz:
        quizz["_id"] = str(quizz["_id"])
        return quizz
    else:
        raise HTTPException(status_code=404, detail="Quiz not found")

def get_interrupt_by_id(interrupt_id):
    try:
        obj_id = ObjectId(interrupt_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    interrupt = interrupts_collection.find_one({"_id": obj_id})
    if interrupt:
        interrupt["_id"] = str(interrupt["_id"])
        return interrupt
    else:
        raise HTTPException(status_code=404, detail="Interrupt not found")





 # Create 
def create_user(user: User):
    try:
        # Ensure required fields are provided
        if not user.username or not user.email or not user.google_id:
            raise HTTPException(status_code=400, detail="Username, email, and google_id are required")

        # Check for existing email to prevent duplicate registrations
        if users_collection.find_one({"email": user.email}):
            raise HTTPException(status_code=409, detail="Email already registered")

        # Convert Pydantic model to dictionary format
        user_dict = user.model_dump()

        # Insert the user into MongoDB and retrieve the inserted ID
        inserted = users_collection.insert_one(user_dict)
        user_dict["_id"] = str(inserted.inserted_id)  # Convert ObjectId to string for JSON serialization

        # Return the newly created user object
        return user_dict

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_user_session(session: Session):
    try:
        # Ensure the creator ID is valid and exists in the database
        if not users_collection.find_one({"_id": ObjectId(session.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        # Convert Pydantic model to dictionary format
        session_dict = session.model_dump()

        # Insert the session into MongoDB and retrieve the inserted ID
        inserted = sessions_collection.insert_one(session_dict)
        session_dict["_id"] = str(inserted.inserted_id)  # Convert ObjectId to string for JSON serialization

        # Return the newly created session object
        return session_dict

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_contest(contest: Contest):
    try:
        # Ensure the session ID is valid and exists in the database
        # Convert Pydantic model to dictionary format
        contest_dict = contest.model_dump()

        # Insert the contest into MongoDB and retrieve the inserted ID
        inserted = contests_collection.insert_one(contest_dict)
        contest_dict["_id"] = str(inserted.inserted_id)  # Convert ObjectId to string for JSON serialization

        # Return the newly created contest object
        return contest_dict

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_quiz(quiz: Quizz):
    try:
        # Ensure the creator ID is valid and exists in the database
        if not users_collection.find_one({"_id": ObjectId(quiz.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        # Convert Pydantic model to dictionary format
        quiz_dict = quiz.model_dump()

        # Insert the quiz into MongoDB and retrieve the inserted ID
        inserted = quizzes_collection.insert_one(quiz_dict)
        quiz_dict["_id"] = str(inserted.inserted_id)  # Convert ObjectId to string for JSON serialization

        # Return the newly created quiz object
        return quiz_dict

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_interrupt(interrupt: Interrupt):
    try:
        # Ensure the creator ID is valid and exists in the database
        if not users_collection.find_one({"_id": ObjectId(interrupt.creator_id)}):
            raise HTTPException(status_code=404, detail="Creator not found")

        # Ensure the session ID exists if provided
        if interrupt.session_id and not sessions_collection.find_one({"_id": ObjectId(interrupt.session_id)}):
            raise HTTPException(status_code=404, detail="Session not found")

        # Convert Pydantic model to dictionary format
        interrupt_dict = interrupt.model_dump()

        # Insert the interrupt into MongoDB and retrieve the inserted ID
        inserted = interrupts_collection.insert_one(interrupt_dict)
        interrupt_dict["_id"] = str(inserted.inserted_id)  # Convert ObjectId to string for JSON serialization

        # Return the newly created interrupt object
        return interrupt_dict

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def create_question(question: Question):
    try:
        # Ensure the quiz ID is valid and exists in the database
        if not quizzes_collection.find_one({"_id": ObjectId(question.quiz_id)}):
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Convert Pydantic model to dictionary format
        question_dict = question.model_dump()

        # Insert the question into MongoDB and retrieve the inserted ID
        inserted = questions_collection.insert_one(question_dict)
        question_dict["_id"] = str(inserted.inserted_id)  # Convert ObjectId to string for JSON serialization

        # Return the newly created question object
        return question_dict

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")




#UPDATES
# ✅ Update a User by ID
def update_user(user_id: str, user: User):
    try:
        # Validate the provided user ID format
        if not ObjectId.is_valid(ObjectId(user_id)):
            raise HTTPException(status_code=400, detail="Invalid user ID format")

        # Check if the user exists in the database
        existing_user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Convert the Pydantic model to a dictionary, excluding unset values
        user_dict = user.model_dump(exclude_unset=True)  # Only update provided fields

        # Update the user record in the database
        users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": user_dict})

        # Return a success message
        return {"message": "User updated successfully"}

    except PyMongoError as e:
        # Handle any database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def update_user_session(session_id: str, session: Session):
    try:
        # Validate the provided session ID format
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Check if the session exists in the database
        if not sessions_collection.find_one({"_id": ObjectId(session_id)}):
            raise HTTPException(status_code=404, detail="Session not found")

        # Convert the Pydantic model to a dictionary, excluding unset values
        session_dict = session.model_dump(exclude_unset=True)

        # Update the session record in the database
        sessions_collection.update_one({"_id": ObjectId(session_id)}, {"$set": session_dict})

        # Return a success message
        return {"message": "Session updated successfully"}

    except PyMongoError as e:
        # Handle any database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def update_contest(contest_id: str, contest: Contest):
    try:
        # Validate the provided contest ID format
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID format")

        # Check if the contest exists in the database
        if not contests_collection.find_one({"_id": ObjectId(contest_id)}):
            raise HTTPException(status_code=404, detail="Contest not found")

        # Convert the Pydantic model to a dictionary, excluding unset values
        contest_dict = contest.model_dump(exclude_unset=True)

        # Update the contest record in the database
        contests_collection.update_one({"_id": ObjectId(contest_id)}, {"$set": contest_dict})

        # Return a success message
        return {"message": "Contest updated successfully"}

    except PyMongoError as e:
        # Handle any database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def update_quiz(quiz_id: str, quiz: Quizz):
    try:
        # Validate the provided quiz ID format
        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        # Check if the quiz exists in the database
        if not quizzes_collection.find_one({"_id": ObjectId(quiz_id)}):
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Convert the Pydantic model to a dictionary, excluding unset values
        quiz_dict = quiz.model_dump(exclude_unset=True)

        # Update the quiz record in the database
        quizzes_collection.update_one({"_id": ObjectId(quiz_id)}, {"$set": quiz_dict})

        # Return a success message
        return {"message": "Quiz updated successfully"}

    except PyMongoError as e:
        # Handle any database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def update_interrupt(interrupt_id: str, interrupt: Interrupt):
    try:
        # Validate the provided interrupt ID format
        if not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid interrupt ID format")

        # Check if the interrupt exists in the database
        if not interrupts_collection.find_one({"_id": ObjectId(interrupt_id)}):
            raise HTTPException(status_code=404, detail="Interrupt not found")

        # Convert the Pydantic model to a dictionary, excluding unset values
        interrupt_dict = interrupt.model_dump(exclude_unset=True)

        # Update the interrupt record in the database
        interrupts_collection.update_one({"_id": ObjectId(interrupt_id)}, {"$set": interrupt_dict})

        # Return a success message
        return {"message": "Interrupt updated successfully"}

    except PyMongoError as e:
        # Handle any database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def update_question(question_id: str, question: Question):
    try:
        # Validate the provided question ID format
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=400, detail="Invalid question ID format")

        # Check if the question exists in the database
        if not questions_collection.find_one({"_id": ObjectId(question_id)}):
            raise HTTPException(status_code=404, detail="Question not found")

        # Convert the Pydantic model to a dictionary, excluding unset values
        question_dict = question.model_dump(exclude_unset=True)

        # Update the question record in the database
        questions_collection.update_one({"_id": ObjectId(question_id)}, {"$set": question_dict})

        # Return a success message
        return {"message": "Question updated successfully"}

    except PyMongoError as e:
        # Handle any database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Patch
# Add Users to a Contest
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


# Add Users to a Session
def add_users_to_session(session_id: str, users: list[Username]):
    try:
        # Validate the session ID format
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Check if the session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Get existing participants in the session
        existing_participants = session.get("participants", [])

        # Add only new users (who are not already in the session)
        new_users = [user.model_dump() for user in users if user.model_dump() not in existing_participants]

        # If no new users, return a message
        if not new_users:
            return {"message": "No new users added (users may already exist in the session)"}

        # Add the new users to the session
        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$addToSet": {"participants": {"$each": new_users}}}  # Using $addToSet ensures uniqueness
        )

        return {"message": "Users added to session successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Add a Quiz to a Session
def add_quiz_to_session(session_id: str, quiz_id: str):
    try:
        # Validate session and quiz ID formats
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid quiz ID format")

        # Check if the session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Assign the quiz to the session
        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$addToSet": {"quiz_ids": quiz_id}}  # ensures no duplicates
        )

        if result.modified_count == 0:
            return {"message": "Quiz was already in session or session not modified"}

        return {"message": "Quiz added to session successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Add an Interrupt to a Session
def add_interrupt_to_session(session_id: str, interrupt_id: str):
    try:
        # Validate session and interrupt ID formats
        if not ObjectId.is_valid(session_id) or not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid session or interrupt ID format")

        # Check if the session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Check if the interrupt exists
        interrupt = interrupts_collection.find_one({"_id": ObjectId(interrupt_id)})
        if not interrupt:
            raise HTTPException(status_code=404, detail="Interrupt not found")

        # Convert interrupt ID to string for JSON compatibility
        interrupt["_id"] = str(interrupt["_id"])

        # Add the interrupt to the session
        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"interrupts": interrupt}}  # Using $push to add interrupt
        )

        return {"message": "Interrupt added to session successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Remove Users from a Contest
def remove_user_from_contest(contest_id: str, user_id: str):
    try:
        # Validate contest ID format
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID format")

        # Check if the contest exists
        contest = contests_collection.find_one({"_id": ObjectId(contest_id)})
        if not contest:
            raise HTTPException(status_code=404, detail="Contest not found")

        # Remove the user from the contest's participant list
        contests_collection.update_one(
            {"_id": ObjectId(contest_id)},
            {"$pull": {"participants": {"id": user_id}}}  # Using $pull to remove specific user
        )

        return {"message": "User removed from contest successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Remove User from a Session
def remove_user_from_session(session_id: str, user_id: str):
    try:
        # Validate session ID format
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID format")

        # Check if the session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Remove the user from the session's participant list
        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$pull": {"participants": {"id": user_id}}}  # Using $pull to remove specific user
        )

        return {"message": "User removed from session successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Remove Quiz from a Session
def remove_quiz_from_session(session_id: str, quiz_id: str):
    try:
        # Validate session and quiz ID formats
        if not ObjectId.is_valid(session_id) or not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid session or quiz ID format")

        # Check if the session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Ensure the session currently has the provided quiz_id
        if str(session.get("quiz_id")) != str(quiz_id):
            raise HTTPException(status_code=400, detail="Quiz ID does not match session's quiz")

        # Remove the quiz from the session
        sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$unset": {"quiz_id": quiz_id}}  # Using $unset to remove the quiz ID
        )

        return {"message": "Quiz removed from session successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# Remove Interrupt from a Session
def remove_interrupt_from_session(session_id: str, interrupt_id: str):
    try:
        # Validate session and interrupt ID formats
        if not ObjectId.is_valid(session_id) or not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid session or interrupt ID format")

        # Check if the session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Remove the interrupt from the session
        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$pull": {"interrupts": {"_id": interrupt_id}}}  # Using $pull to remove specific interrupt
        )

        # If no document was modified, the interrupt was not found in the session
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Interrupt not found in session")

        return {"message": "Interrupt removed from session successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Delete a User
def delete_user(user_id: str):
    try:
        # Validate user ID format
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID")

        # Find quizzes created by the user and delete related questions
        user_quizzes = quizzes_collection.find({"creator_id": user_id})
        quiz_ids = [str(quiz["_id"]) for quiz in user_quizzes]
        questions_collection.delete_many({"quiz_id": {"$in": quiz_ids}})

        # Delete the user's quizzes, sessions, and interrupts
        quizzes_collection.delete_many({"creator_id": user_id})
        sessions_collection.delete_many({"creator_id": user_id})
        interrupts_collection.delete_many({"creator_id": user_id})

        # Finally, delete the user
        result = users_collection.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        return {"message": "User deleted successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def delete_session(session_id: str):
    try:
        # Validate session ID format
        if not ObjectId.is_valid(session_id):
            raise HTTPException(status_code=400, detail="Invalid session ID")

        # Set session_id to None in contests, interrupts, and quizzes linked to the session
        contests_collection.update_many({"session_id": session_id}, {"$set": {"session_id": None}})
        interrupts_collection.update_many({"session_id": session_id}, {"$set": {"session_id": None}})
        quizzes_collection.update_many({"session_id": session_id}, {"$set": {"session_id": None}})

        # Delete the session
        result = sessions_collection.delete_one({"_id": ObjectId(session_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")

        return {"message": "Session deleted successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def delete_contest(contest_id: str):
    try:
        # Validate contest ID format
        if not ObjectId.is_valid(contest_id):
            raise HTTPException(status_code=400, detail="Invalid contest ID")

        # Delete the contest
        result = contests_collection.delete_one({"_id": ObjectId(contest_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contest not found")

        return {"message": "Contest deleted successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def delete_quiz(quiz_id: str):
    try:
        # Validate quiz ID format
        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=400, detail="Invalid quiz ID")

        # Delete all questions associated with this quiz
        questions_collection.delete_many({"quiz_id": quiz_id})

        # Delete the quiz itself
        result = quizzes_collection.delete_one({"_id": ObjectId(quiz_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Quiz not found")

        return {"message": "Quiz deleted successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def delete_question(question_id: str):
    try:
        # Validate question ID format
        if not ObjectId.is_valid(question_id):
            raise HTTPException(status_code=400, detail="Invalid question ID")

        # Remove the question ID from any quiz that contains it
        quizzes_collection.update_many({"questions": question_id}, {"$pull": {"questions": question_id}})

        # Delete the question itself
        result = questions_collection.delete_one({"_id": ObjectId(question_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")

        return {"message": "Question deleted successfully"}

    except PyMongoError as e:
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def delete_interrupt(interrupt_id: str):
    try:
        # Validate interrupt ID format
        if not ObjectId.is_valid(interrupt_id):
            raise HTTPException(status_code=400, detail="Invalid interrupt ID")

        # Remove the interrupt from any session it is part of
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
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


