from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from typing import Dict, List
from fastapi.encoders import jsonable_encoder

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
    "http://localhost:3000",
    "chrome-extension://pgnklflkklbaboaffcbnaiknpoglbnci"# React development server
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
@app.get("/users/exists/{google_id}")
async def check_if_user_with_google_id(google_id: str):
    return crud.get_user_with_google_id(google_id)

@app.get("/users/{username}")
async def get_user_by_username(username: str):
    return crud.get_user_by_id(username)

# Fetch all users
@app.get("/users/")
async def get_users():
    return crud.get_users()

@app.get("/sessions/{id}")
async def get_session(id: str):
    return crud.get_session_by_id(id)

@app.get("/contests/{id}")
async def get_contest(id: str):
    return crud.get_contest_by_id(id)

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

class UserConnection:
    def __init__(self, id: str, username: str, websocket: WebSocket):
        self.id = id
        self.username = username
        self.score = 0
        self.websocket = websocket



class ActiveContest:
    def __init__(self, contest_id: str):
        self.contest_id = contest_id
        self.participants: List[UserConnection] = []
        self.hasStarted = False

    async def broadcast(self, message: dict):
        disconnected = []
        for user in self.participants:
            #try:
            await user.websocket.send_json(message)
            #except Exception:
                #disconnected.append(user)
        # remove disconnected users
        for user in disconnected:
            self.participants.remove(user)

    def get_scores_dict(self):
        return [
            {
                "id": user.id,
                "username": user.username,
                "score": user.score
            }
            for user in self.participants
        ]

    async def broadcast_scores(self):
        players = [
            {"username": u.username, "id": u.id, "score": u.score}
            for u in self.participants
        ]
        await self.broadcast({
            "type": "score_update",
            "players": players
        })

# POST methods for creating new resources
contests: Dict[str, ActiveContest] = {}

# Create a new session
@app.post("/sessions", status_code=201)
async def add_user_session(session: Session):
    # add a check here to see if it's a public session or not
    session = create_user_session(session)
    print(session)
    # Always backfill interrupt.session_id for interrupts referenced by this session.
    # This ensures private sessions' interrupts are linked to the session in the DB.
    try:
        interrupts = []
        for interrupt_id in session.get('interrupt_ids') or []:
            interrupt = await get_interrupt_by_id(interrupt_id)
            # interrupt returned from helper has '_id' as a string
            interrupt["session_id"] = session['_id']
            interrupt_obj = Interrupt(**interrupt)  # convert dict to model
            # Use the DB string id (interrupt['_id']) when updating
            try:
                crud.update_interrupt(interrupt['_id'], interrupt_obj)
            except Exception:
                # best-effort: try using the original interrupt_id if present
                try:
                    crud.update_interrupt(interrupt_id, interrupt_obj)
                except Exception as e:
                    print('Failed to backfill interrupt session_id for', interrupt_id, e)
            # fetch the updated interrupt for potential use
            try:
                interrupt_final = crud.get_interrupt_by_id(interrupt['_id'])
            except Exception:
                try:
                    interrupt_final = crud.get_interrupt_by_id(interrupt_id)
                except Exception:
                    interrupt_final = None
            if interrupt_final:
                interrupts.append(interrupt_final)
    except Exception as e:
        print('Error while backfilling interrupts for session:', e)
    if session['is_public']:
       print("In Sessions")
       print("Handler PID:", os.getpid())
       for cid, c in contests.items():
           print(f"\n🏁 Contest ID: {cid}")
           print(f"Has started: {c.hasStarted}")
           print("Participants:")
           for p in c.participants:
               print(f" - {p.username} (id={p.id}, score={p.score})")
       contest = contests[session['contest_id']]

       quizzes = []
       for quiz_id in session['quizz_ids']:
           quiz = await get_quiz_by_id(quiz_id)
           quiz["session_id"] = session['_id']
           quiz_obj = Quizz(**quiz)  # ✅ convert dict into a Pydantic model
           crud.update_quiz(quiz['_id'], quiz_obj)
           quiz_final = crud.get_quiz_by_id(quiz['_id'])
           quizzes.append(quiz_final )

      # interrupts are backfilled above (always); keep the `interrupts` list for broadcast
      # (the variable `interrupts` was populated in the unconditional backfill block)

       players = [
           {"username": u.username, "id": u.id, "score": u.score}
           for u in contest.participants
       ]

       print("Session contest participants:")
       for p in contest.participants:
           print(f" - {p.username} (id={p.id}, score={p.score})")

           # 1. Create the full payload object first
           payload = {
               "session": session,
               "quizzes": quizzes,
               "interrupts": interrupts,
               "players": players,
           }

           # 2. Use jsonable_encoder to make it serializable
           serializable_payload = jsonable_encoder(payload)

           # 3. Broadcast the serializable version
           await contest.broadcast({
               "type": "game_start",
               "payload": serializable_payload  # <-- Use the encoded payload
           })
    return session


@app.post("/contests", status_code=201)
async def add_user_contest(contest: Contest):
    print("Received contest:", contest)
    print("As dict:", contest.dict())  # more readable
    created_contest = create_contest(contest)
    print("created contest:", created_contest)
    contests[created_contest["_id"]] = ActiveContest(created_contest["_id"])
    #create_room(created_contest)
    return created_contest

@app.websocket("/ws/{contest_id}/{username}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, contest_id: str, username: str, user_id: str):
    await websocket.accept()

    # Retrieve the contest
    contest = contests[contest_id]
    print("in websocket")
    print("Handler PID:", os.getpid())
    user = UserConnection(user_id, username=username, websocket=websocket)

    if contest.hasStarted:
        await websocket.send_json({"type": "can_not_join",  "text": "session has already started"})
        await websocket.close(code=4001)
        return
    if len(contest.participants) > 5:
        await websocket.send_json({"type": "can_not_join",  "text": "session is full"})
        await websocket.close(code=4001)
        return

    contest.participants.append(user)

    for cid, c in contests.items():
        print(f"\n🏁 Contest ID: {cid}")
        print(f"Has started: {c.hasStarted}")
        print("Participants:")
        for p in c.participants:
            print(f" - {p.username} (id={p.id}, score={p.score})")

    # NEW (Fixed)
    players = [
        {"username": u.username, "id": u.id, "score": u.score}
        for u in contest.participants
    ]
    await contest.broadcast({"type": "user_joined", "payload": {"players": players}})

    try:
        while True:
            data = await websocket.receive_json()
            # --- Player answered ---
            contest.broadcast(data)


    except WebSocketDisconnect:

        try:
            print("in disconnect")
            contest.participants.remove(user)

            await contest.broadcast({"type": "user_left", "payload": {"username": username}})

            print(f"User {username} disconnected from contest {contest_id}")

        except ValueError:

            print(f"⚠️ Tried to remove user {username} not in participants list of {contest_id}")

        # If no one is left, clean up the contest

        if len(contest.participants) == 0:

            del contests[contest_id]

            print(f"Contest {contest_id} deleted (no participants left)")

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

#at line 118 we create the contest
#line 383 in crud


# Run the application using Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
