from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from typing import Dict, List, Optional, Any
from fastapi.encoders import jsonable_encoder
import datetime

import crud
from models import User, Session, Contest, Quizz, Interrupt, Question, Username

from init_db import init_db

# New imports for DB-level operations and webhook delivery
from database import contests_collection, contest_events_collection, quizzes_collection, questions_collection
from bson import ObjectId
import httpx
import hmac
import hashlib
import uuid
import json
from pydantic import BaseModel
class SubmitPayload(BaseModel):
    user_id: str
    username: Optional[str] = None
    delta: int = 0
    submission_id: Optional[str] = None


class WebhookRegistration(BaseModel):
    url: str
    secret: Optional[str] = None

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

# Queue & worker for webhook delivery
webhook_queue: "asyncio.Queue[tuple[str, dict]]" = asyncio.Queue()


def enqueue_webhook(contest_id: str, event_doc: dict):
    try:
        webhook_queue.put_nowait((contest_id, event_doc))
    except Exception:
        # best-effort: if queue is full or there's an issue, ignore silently
        pass


async def deliver_webhooks_loop():
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                contest_id, event_doc = await webhook_queue.get()
                # fetch contest doc and its webhooks
                try:
                    contest = contests_collection.find_one({"_id": ObjectId(contest_id)})
                except Exception:
                    contest = None
                webhooks = (contest or {}).get("webhooks") or []
                for hook in webhooks:
                    url = hook.get("url")
                    secret = hook.get("secret")
                    if not url:
                        continue
                    payload = json.dumps(event_doc, default=str)
                    headers = {"Content-Type": "application/json"}
                    if secret:
                        sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
                        headers["X-SI-Signature"] = sig
                    # attempt delivery with retries
                    attempts = 0
                    while attempts < 3:
                        try:
                            resp = await client.post(url, content=payload, headers=headers)
                            if 200 <= resp.status_code < 300:
                                break
                        except Exception:
                            pass
                        attempts += 1
                        await asyncio.sleep(2 ** attempts)
            except Exception as e:
                # log and continue
                print("Error in webhook delivery loop:", e)
                await asyncio.sleep(1)

# Create a new session
@app.post("/sessions", status_code=201)
async def add_user_session(session: Session):
    # add a check here to see if it's a public session or not
    session = crud.create_user_session(session)
    print(session)
    # Always backfill interrupt.session_id for interrupts referenced by this session.
    # This ensures private sessions' interrupts are linked to the session in the DB.
    try:
        interrupts = []
        for interrupt_id in session.get('interrupt_ids') or []:
            interrupt = crud.get_interrupt_by_id(interrupt_id)
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
        # Persist a "game_start" event for the contest so clients can poll for it
        contest_id = session.get('contest_id')
        # Ensure a contest document exists (if not, create a minimal one)
        try:
            if contest_id:
                try:
                    maybe = crud.get_contest_by_id(contest_id)
                    contest_doc = maybe
                except Exception:
                    # create a minimal contest doc
                    new_contest = {
                        "participants": [],
                        "session_id": session.get('_id'),
                        "created_at": datetime.datetime.utcnow(),
                        "webhooks": [],
                    }
                    created = contests_collection.insert_one(new_contest)
                    contest_id = str(created.inserted_id)
                    contest_doc = contests_collection.find_one({"_id": ObjectId(contest_id)})
            else:
                # no contest id: create a new contest doc
                new_contest = {
                    "participants": [],
                    "session_id": session.get('_id'),
                    "created_at": datetime.datetime.utcnow(),
                    "webhooks": [],
                }
                created = contests_collection.insert_one(new_contest)
                contest_id = str(created.inserted_id)
                contest_doc = contests_collection.find_one({"_id": ObjectId(contest_id)})
        except Exception:
            contest_doc = None

        quizzes = []
        for quiz_id in session.get('quizz_ids') or []:
            quiz = crud.get_quiz_by_id(quiz_id)
            quiz["session_id"] = session['_id']
            quiz_obj = Quizz(**quiz)
            crud.update_quiz(quiz['_id'], quiz_obj)
            quiz_final = crud.get_quiz_by_id(quiz['_id'])
            quizzes.append(quiz_final)

        # Build players view from contest_doc (if available)
        players = []
        try:
            if contest_doc:
                parts = contest_doc.get('participants') or []
                for p in parts:
                    players.append({
                        'id': p.get('id'),
                        'username': p.get('username'),
                        'score': p.get('score', 0)
                    })
        except Exception:
            players = []

        # For public sessions, ensure each participant has access to the quizzes
        # included in this session. We implement this by creating per-player copies
        # of the session quizzes (if they don't already exist) with creator_id set
        # to the participant so they will appear in that player's quiz list.
        try:
            participants = session.get('participants') or []
            for p in participants:
                pid = p.get('id')
                if not pid:
                    continue
                # skip the original creator
                if pid == session.get('creator_id'):
                    continue
                for q in quizzes:
                    try:
                        orig_quiz_id = q.get('_id')
                        if not orig_quiz_id:
                            continue
                        # Avoid duplicating quizzes the participant already has for this session
                        existing = quizzes_collection.find_one({"creator_id": pid, "title": q.get('title'), "session_id": session.get('_id')})
                        if existing:
                            continue

                        # Load the original quiz document to copy full fields
                        try:
                            orig = quizzes_collection.find_one({"_id": ObjectId(orig_quiz_id)})
                        except Exception:
                            orig = None
                        if not orig:
                            continue

                        # Prepare new quiz doc for the participant
                        new_quiz = dict(orig)
                        new_quiz.pop('_id', None)
                        new_quiz['creator_id'] = pid
                        # set session_id to this session so quiz is associated
                        new_quiz['session_id'] = session.get('_id')
                        new_quiz['created_at'] = datetime.datetime.utcnow()

                        ins = quizzes_collection.insert_one(new_quiz)
                        new_quiz_id = str(ins.inserted_id)

                        # Copy questions for the quiz (if any)
                        try:
                            for ques in list(questions_collection.find({"quiz_id": orig_quiz_id})):
                                nq = dict(ques)
                                nq.pop('_id', None)
                                nq['quiz_id'] = new_quiz_id
                                questions_collection.insert_one(nq)
                        except Exception:
                            # best-effort: continue even if questions copy fails
                            pass
                    except Exception:
                        # fail safe per-quiz copy
                        continue
        except Exception as e:
            print('Failed to copy session quizzes to participants:', e)

        payload = {
            "session": session,
            "quizzes": quizzes,
            "interrupts": interrupts,
            "players": players,
            "contest_id": contest_id,
        }

        serializable_payload = jsonable_encoder(payload)
        # persist event
        event_doc = {
            "contest_id": contest_id,
            "type": "game_start",
            "payload": serializable_payload,
            "created_at": datetime.datetime.utcnow(),
        }
        try:
            contest_events_collection.insert_one(event_doc)
            enqueue_webhook(contest_id, event_doc)
        except Exception as e:
            print("Failed to persist game_start event:", e)
    return session


@app.post("/contests", status_code=201)
async def create_contest_route(contest: Contest):
    """Create a new contest document. The frontend expects POST /contests to create a public contest.

    This uses the existing CRUD helper `create_contest` which inserts into the contests_collection
    and returns the created document with an `_id` string.
    """
    try:
        created = crud.create_contest(contest)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/interrupts", status_code=201)
async def create_interrupt_route(interrupt: Interrupt):
    """Create a new interrupt (used by the frontend CreateSession flow)."""
    try:
        created = crud.create_interrupt(interrupt)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quizzes", status_code=201)
async def create_quiz_route(quiz: Quizz):
    """Create a new quiz (used by QuizCreate component)."""
    try:
        created = crud.create_quiz(quiz)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/questions", status_code=201)
async def create_question_route(question: Question):
    """Create a new question for a quiz."""
    try:
        created = crud.create_question(question)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# PUT endpoints for updating resources (forward to crud helpers)
@app.put("/users/{user_id}", status_code=200)
async def put_update_user(user_id: str, user: User):
    try:
        return crud.update_user(user_id, user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/sessions/{session_id}", status_code=200)
async def put_update_session(session_id: str, session: Session):
    try:
        return crud.update_user_session(session_id, session)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/quizzes/{quiz_id}", status_code=200)
async def put_update_quiz(quiz_id: str, quiz: Quizz):
    try:
        return crud.update_quiz(quiz_id, quiz)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/interrupts/{interrupt_id}", status_code=200)
async def put_update_interrupt(interrupt_id: str, interrupt: Interrupt):
    try:
        return crud.update_interrupt(interrupt_id, interrupt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/contests/{id}", status_code=200)
async def put_update_contest(id: str, contest: Contest):
    """Update an existing contest document."""
    try:
        return crud.update_contest(id, contest)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def contest_cleanup_loop():
    while True:
        try:
            now = datetime.datetime.utcnow()
            # find contests with end_time set
            for doc in contests_collection.find({"end_time": {"$exists": True}, "ended": {"$ne": True}}):
                try:
                    end_val = doc.get('end_time')
                    end_dt = None
                    if isinstance(end_val, str):
                        try:
                            end_dt = datetime.datetime.fromisoformat(end_val)
                        except Exception:
                            end_dt = None
                    elif isinstance(end_val, datetime.datetime):
                        end_dt = end_val
                    if end_dt:
                        # normalize naive
                        if end_dt.tzinfo is not None:
                            end_dt = end_dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
                        if now > end_dt:
                            cid = str(doc.get('_id'))
                            # persist game_over event
                            event_doc = {"contest_id": cid, "type": "game_over", "payload": {}, "created_at": now}
                            try:
                                contest_events_collection.insert_one(event_doc)
                                enqueue_webhook(cid, event_doc)
                            except Exception:
                                pass
                            # mark contest as ended
                            try:
                                contests_collection.update_one({"_id": doc.get('_id')}, {"$set": {"ended": True}})
                            except Exception:
                                pass
                except Exception:
                    continue
        except Exception as e:
            print('Error in contest cleanup loop:', e)
        await asyncio.sleep(30)


@app.on_event('startup')
async def start_background_tasks():
    # start webhook delivery worker and contest cleanup worker
    asyncio.create_task(deliver_webhooks_loop())
    asyncio.create_task(contest_cleanup_loop())


@app.post("/contests/{contest_id}/join", status_code=200)
async def join_contest(contest_id: str, user: Username):
    # add user to contest participants if not present
    try:
        # normalize id
        try:
            oid = ObjectId(contest_id)
        except Exception:
            raise HTTPException(status_code=400, detail="invalid contest id")
        user_dict = user.model_dump()
        # use $addToSet to avoid duplicates based on entire object
        contests_collection.update_one({"_id": oid}, {"$addToSet": {"participants": user_dict}})
        # persist event
        event_doc = {
            "contest_id": contest_id,
            "type": "user_joined",
            "payload": {"user": user_dict},
            "created_at": datetime.datetime.utcnow(),
        }
        contest_events_collection.insert_one(event_doc)
        enqueue_webhook(contest_id, event_doc)
        return {"message": "joined"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/contests/{contest_id}/submit", status_code=200)
async def submit_score(contest_id: str, body: SubmitPayload):
    try:
        try:
            oid = ObjectId(contest_id)
        except Exception:
            raise HTTPException(status_code=400, detail="invalid contest id")

        now = datetime.datetime.utcnow()
        # Attempt to increment existing participant score atomically
        res = contests_collection.update_one(
            {"_id": oid, "participants.id": body.user_id},
            {"$inc": {"participants.$.score": int(body.delta)}, "$set": {"participants.$.last_updated": now}}
        )
        if res.modified_count == 0:
            # participant not found - push as new participant
            new_part = {"id": body.user_id, "username": body.username or "", "score": int(body.delta), "last_updated": now}
            contests_collection.update_one({"_id": oid}, {"$push": {"participants": new_part}})

        # Read updated players
        contest_doc = contests_collection.find_one({"_id": oid})
        participants = contest_doc.get('participants') or []
        players = [{'id': p.get('id'), 'username': p.get('username'), 'score': p.get('score', 0)} for p in participants]

        # persist event
        event_doc = {
            "contest_id": contest_id,
            "type": "score_update",
            "payload": {"user_id": body.user_id, "delta": body.delta, "players": players},
            "created_at": now,
        }
        contest_events_collection.insert_one(event_doc)
        enqueue_webhook(contest_id, event_doc)

        return {"players": players}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/contests/{contest_id}/events")
async def get_contest_events(contest_id: str, since: Optional[str] = None):
    try:
        query = {"contest_id": contest_id}
        if since:
            try:
                ts = datetime.datetime.fromisoformat(since)
                query["created_at"] = {"$gt": ts}
            except Exception:
                raise HTTPException(status_code=400, detail="invalid since timestamp")
        docs = list(contest_events_collection.find(query).sort("created_at", 1).limit(200))
        for d in docs:
            d["_id"] = str(d["_id"])
            if isinstance(d.get("created_at"), datetime.datetime):
                d["created_at"] = d["created_at"].isoformat()
        return {"events": docs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/contests/{contest_id}/webhooks", status_code=201)
async def register_webhook(contest_id: str, reg: WebhookRegistration):
    try:
        try:
            oid = ObjectId(contest_id)
        except Exception:
            raise HTTPException(status_code=400, detail="invalid contest id")
        hook = {"id": uuid.uuid4().hex, "url": reg.url, "secret": reg.secret, "created_at": datetime.datetime.utcnow()}
        contests_collection.update_one({"_id": oid}, {"$push": {"webhooks": hook}})
        return {"webhook": hook}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/contests/{id}/scores")
async def get_contest_scores(id: str):
    # Read contest from DB and normalize participants into player list
    try:
        try:
            contest_doc = contests_collection.find_one({"_id": ObjectId(id)})
        except Exception:
            # try via crud helper (which raises on not found)
            contest_doc = crud.get_contest_by_id(id)
        if not contest_doc:
            return {"players": []}
        participants = contest_doc.get('participants') or []
        players = []
        # participants may be list of dicts with id/username/score
        for p in participants:
            if isinstance(p, dict):
                players.append({
                    'id': p.get('id'),
                    'username': p.get('username'),
                    'score': p.get('score', 0)
                })
        return {"players": players}
    except Exception:
        return {"players": []}

# websockets removed: clients should use POST /contests/{id}/join, POST /contests/{id}/submit and poll
@app.put("/questions/{id}", status_code=200)
async def edit_question(id: str, question: Question):
    return crud.update_question(id, question)


# PATCH methods for partial updates

# Add users to an existing contest
@app.patch("/contests/{id}/add-users", status_code=200)
async def patch_add_users_to_contest(id: str, users: list[Username]):
    return crud.add_users_to_contest(id, users)

# Add users to an existing session
@app.patch("/sessions/{id}/add-users", status_code=200)
async def patch_add_users_to_session(id: str, users: list[Username]):
    return crud.add_users_to_session(id, users)

# Link a quiz to a specific session
@app.patch("/sessions/{id}/add-quiz/{quiz_id}", status_code=200)
async def patch_add_quiz_to_session(id: str, quiz_id: str):
    return crud.add_quiz_to_session(id, quiz_id)

# Link an interrupt to a specific session
@app.patch("/sessions/{session_id}/add-interrupt/{interrupt_id}", status_code=200)
async def patch_add_interrupt(session_id: str, interrupt_id: str):
    return crud.add_interrupt_to_session(session_id, interrupt_id)

# DELETE methods for removing resources

# Remove a user from a contest
@app.delete("/contests/{contest_id}/remove-user/{user_id}", status_code=200)
async def delete_users_from_contest(contest_id: str, user_id: str):
    return crud.remove_user_from_contest(contest_id, user_id)

# Remove a user from a session
@app.delete("/sessions/{session_id}/remove-user/{user_id}", status_code=200)
async def delete_users_from_session(session_id: str, user_id: str):
    return crud.remove_user_from_session(session_id, user_id)

# Unlink a quiz from a session
@app.delete("/sessions/{session_id}/remove-quiz/{quiz_id}", status_code=200)
async def delete_quiz_from_session(session_id: str, quiz_id: str):
    return crud.remove_quiz_from_session(session_id, quiz_id)

# Unlink an interrupt from a session
@app.delete("/sessions/{session_id}/remove-interrupt/{interrupt_id}", status_code=200)
async def delete_remove_interrupt(session_id: str, interrupt_id: str):
    return crud.remove_interrupt_from_session(session_id, interrupt_id)

# Delete individual resources

# Delete a user by ID
@app.delete("/users/{user_id}", status_code=200)
async def delete_user_route(user_id: str):
    return crud.delete_user(user_id)

# Delete a session by ID
@app.delete("/sessions/{session_id}", status_code=200)
async def delete_session_route(session_id: str):
    return crud.delete_session(session_id)

# Delete a contest by ID
@app.delete("/contests/{contest_id}", status_code=200)
async def delete_contest_route(contest_id: str):
    return crud.delete_contest(contest_id)

# Delete a quiz by ID
@app.delete("/quizzes/{quiz_id}", status_code=200)
async def delete_quiz_route(quiz_id: str):
    return crud.delete_quiz(quiz_id)

# Delete a question by ID
@app.delete("/questions/{question_id}", status_code=200)
async def delete_question_route(question_id: str):
    return crud.delete_question(question_id)

# Delete an interrupt by ID
@app.delete("/interrupts/{interrupt_id}", status_code=200)
async def delete_interrupt_route(interrupt_id: str):
    return crud.delete_interrupt(interrupt_id)

#at line 118 we create the contest
#line 383 in crud


# Run the application using Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
