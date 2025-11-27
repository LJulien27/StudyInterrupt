from datetime import datetime

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from unittest.mock import patch
import mongomock
from pymongo.errors import PyMongoError

import main as main_module
from main import app  # Import your FastAPI app
import crud
from models import User

# Set up test client
client = TestClient(app)

# Mock MongoDB connection
@pytest.fixture(scope="function")
def mock_db():
    """Create a mock database for testing."""
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["test_db"]

    # Insert mock users
    mock_db.users.insert_many([
        {"_id": ObjectId("65b8ba98a6c4a46585522b55"), "username": "Andre", "email": "andre@example.com"},
        {"_id": ObjectId("65a69cd9185476aab56284df"), "username": "John", "email": "john@example.com"},
    ])

    # Insert mock sessions
    mock_db.sessions.insert_many([
        {"_id": ObjectId("65c8ba98a6c4a46585522b56"), "participants": [{"id": "65b8ba98a6c4a46585522b55", "username": "Andre"}], "creator_id": "65b8ba98a6c4a46585522b55",
         "quiz_id": "65f69cd9185476aab56284d1", "interrupts": [{"_id": "65f69cd9185476aab56284d4", "creator_id": "65b8ba98a6c4a46585522b55", "session_id": "65c8ba98a6c4a46585522b56"}] },
        {"_id": ObjectId("65d69cd9185476aab56284d2"), "participants": [{"id": "65a69cd9185476aab56284df", "username": "John"}] },
    ])

    # Insert mock contests
    mock_db.contests.insert_many([
        {"_id": ObjectId("65e8ba98a6c4a46585522b57"), "participants": [{"id": "65b8ba98a6c4a46585522b55", "username": "Andre"}], "session_id": "65c8ba98a6c4a46585522b56"},
    ])

    # Insert mock quizzes
    mock_db.quizzes.insert_many([
        {"_id": ObjectId("65f69cd9185476aab56284d1"), "creator_id": "65b8ba98a6c4a46585522b55", "session_id": "65c8ba98a6c4a46585522b56"},
    ])

    # Insert mock questions (Fixed invalid ObjectId)
    mock_db.questions.insert_many([
        {"_id": ObjectId("65f69cd9185476aab56284d3"), "quiz_id": "65f69cd9185476aab56284d1", "title": "test_title", "session_id": "65c8ba98a6c4a46585522b56"},
    ])

    # Insert mock interrupts (Fixed invalid ObjectId)
    mock_db.interrupts.insert_many([
        {"_id": ObjectId("65f69cd9185476aab56284d4"), "creator_id": "65b8ba98a6c4a46585522b55", "session_id": "65c8ba98a6c4a46585522b56"},
    ])

    return mock_db

# Patch MongoDB connection in CRUD functions
@pytest.fixture(autouse=True)
def patch_db(mock_db):
    # Patch CRUD collections
    with patch.object(crud, "users_collection", mock_db.users):
        with patch.object(crud, "sessions_collection", mock_db.sessions):
            with patch.object(crud, "contests_collection", mock_db.contests):
                with patch.object(crud, "quizzes_collection", mock_db.quizzes):
                    with patch.object(crud, "interrupts_collection", mock_db.interrupts):
                        with patch.object(crud, "questions_collection", mock_db.questions):
                            # Also patch collections imported directly by main (contests and contest_events)
                            with patch.object(main_module, "contests_collection", mock_db.contests):
                                with patch.object(main_module, "contest_events_collection", mock_db.contest_events):
                                    yield

# Sample valid and invalid IDs
VALID_USER_ID = "65b8ba98a6c4a46585522b55"
INVALID_USER_ID = "1234567890abcdef12345678"

VALID_SESSION_ID = "65c8ba98a6c4a46585522b56"
INVALID_SESSION_ID = "65f69cd9185476aab56284d5"

VALID_QUIZ_ID = "65f69cd9185476aab56284d1"
INVALID_QUIZ_ID = "65f69cd9185476aab56284d6"

VALID_QUESTION_ID = "65f69cd9185476aab56284d3"
INVALID_QUESTION_ID = "65f69cd9185476aab56284d7"

VALID_CONTEST_ID = "65e8ba98a6c4a46585522b57"
INVALID_CONTEST_ID = "65f69cd9185476aab56284d8"

VALID_INTERRUPT_ID = "65f69cd9185476aab56284d4"
INVALID_INTERRUPT_ID = "65f69cd9185476aab56284d9"


#GET requests
@pytest.mark.parametrize("user_id, expected_username, expected_email", [
    ("65b8ba98a6c4a46585522b55", "Andre", "andre@example.com"),
    ("65a69cd9185476aab56284df", "John", "john@example.com"),
])
def test_get_user_details(user_id, expected_username, expected_email):
    """Test if the retrieved user's username and email are correct."""
    response = client.get(f"/users/{user_id}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {user_id}"
    assert response.headers["content-type"] == "application/json"

    user_data = response.json()
    assert "username" in user_data, f"Username missing in response for {user_id}"
    assert "email" in user_data, f"Email missing in response for {user_id}"

    assert user_data["username"] == expected_username, f"Incorrect username for {user_id}"
    assert user_data["email"] == expected_email, f"Incorrect email for {user_id}"

@pytest.mark.parametrize("user_id, expected_sessions", [
    (VALID_USER_ID, [{"id": VALID_SESSION_ID, "participants": [{"id": VALID_USER_ID, "username": "Andre"}], "quiz_id": "65f69cd9185476aab56284d1", "interrupts": [{"_id": ObjectId("65f69cd9185476aab56284d4"), "creator_id": "65b8ba98a6c4a46585522b55", "session_id": "65c8ba98a6c4a46585522b56"}] }]),
])
def test_get_user_sessions_details(user_id, expected_sessions):
    """Test if the retrieved user sessions contain correct details."""
    response = client.get(f"/users/{user_id}/sessions")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {user_id}"
    assert response.headers["content-type"] == "application/json"

    sessions_data = response.json()["sessions"]
    assert isinstance(sessions_data, list), f"Expected list, got {type(sessions_data)} for {user_id}"

    for expected_session in expected_sessions:
        session = next((s for s in sessions_data if s["_id"] == expected_session["id"]), None)
        assert session, f"Session {expected_session['id']} not found for user {user_id}"
        assert "participants" in session, f"Participants missing in session {expected_session['id']}"
        assert session["participants"] == expected_session["participants"], f"Incorrect participants in session {expected_session['id']}"

@pytest.mark.parametrize("user_id, expected_contests", [
    (VALID_USER_ID, [{"id": VALID_CONTEST_ID, "participants": [{'id': '65b8ba98a6c4a46585522b55', 'username': 'Andre'}]}]),
])
def test_get_user_contests_details(user_id, expected_contests):
    """Test if the retrieved user contests contain correct details."""
    response = client.get(f"/users/{user_id}/contests")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {user_id}"
    assert response.headers["content-type"] == "application/json"

    contests_data = response.json()["contests"]
    assert isinstance(contests_data, list), f"Expected list, got {type(contests_data)} for {user_id}"

    for expected_contest in expected_contests:
        contest = next((c for c in contests_data if c["_id"] == expected_contest["id"]), None)
        assert contest, f"Contest {expected_contest['id']} not found for user {user_id}"
        assert "participants" in contest, f"Participants missing in contest {expected_contest['id']}"
        assert contest["participants"] == expected_contest["participants"], f"Incorrect participants in contest {expected_contest['id']}"

@pytest.mark.parametrize("user_id, expected_interrupts", [
    (VALID_USER_ID, [{"id": VALID_INTERRUPT_ID, "creator_id": VALID_USER_ID}]),
])
def test_get_user_interrupts_details(user_id, expected_interrupts):
    """Test if the retrieved user interrupts contain correct details."""
    response = client.get(f"/users/{user_id}/interrupts")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {user_id}"
    assert response.headers["content-type"] == "application/json"

    interrupts_data = response.json()["interrupts"]
    assert isinstance(interrupts_data, list), f"Expected list, got {type(interrupts_data)} for {user_id}"

    for expected_interrupt in expected_interrupts:
        interrupt = next((i for i in interrupts_data if i["_id"] == expected_interrupt["id"]), None)
        assert interrupt, f"Interrupt {expected_interrupt['id']} not found for user {user_id}"
        assert "creator_id" in interrupt, f"Creator ID missing in interrupt {expected_interrupt['id']}"
        assert interrupt["creator_id"] == expected_interrupt["creator_id"], f"Incorrect creator ID in interrupt {expected_interrupt['id']}"

@pytest.mark.parametrize("user_id, expected_quizzes", [
    (VALID_USER_ID, [{"id": VALID_QUIZ_ID, "creator_id": VALID_USER_ID}]),
])
def test_get_user_quizzes_details(user_id, expected_quizzes):
    """Test if the retrieved user quizzes contain correct details."""
    response = client.get(f"/users/{user_id}/quizzes")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {user_id}"
    assert response.headers["content-type"] == "application/json"

    quizzes_data = response.json()["quizzes"]
    assert isinstance(quizzes_data, list), f"Expected list, got {type(quizzes_data)} for {user_id}"

    for expected_quiz in expected_quizzes:
        quiz = next((q for q in quizzes_data if q["_id"] == expected_quiz["id"]), None)
        assert quiz, f"Quiz {expected_quiz['id']} not found for user {user_id}"
        assert "creator_id" in quiz, f"Creator ID missing in quiz {expected_quiz['id']}"
        assert quiz["creator_id"] == expected_quiz["creator_id"], f"Incorrect creator ID in quiz {expected_quiz['id']}"

@pytest.mark.parametrize("session_id", [
    (VALID_SESSION_ID)
])

def test_get_session_contests_details(session_id):
    """Test if the retrieved session contests contain correct details."""
    response = client.get(f"/sessions/{session_id}/contests")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {session_id}"
    assert response.headers["content-type"] == "application/json"

    contest_data = response.json()["contest"]
    assert contest_data['_id'] == VALID_CONTEST_ID
    assert contest_data['session_id'] == VALID_SESSION_ID

@pytest.mark.parametrize("session_id, expected_quizzes", [
    (VALID_SESSION_ID, [{"id": VALID_QUIZ_ID, "session_id": VALID_SESSION_ID}]),
])
def test_get_session_quizzes_details(session_id, expected_quizzes):
    """Test if the retrieved session quizzes contain correct details."""
    response = client.get(f"/sessions/{session_id}/quizzes")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {session_id}"
    assert response.headers["content-type"] == "application/json"

    quizzes_data = response.json()["quizzes"]
    assert isinstance(quizzes_data, list), f"Expected list, got {type(quizzes_data)} for {session_id}"

    for expected_quiz in expected_quizzes:
        quiz = next((q for q in quizzes_data if q["_id"] == expected_quiz["id"]), None)
        assert quiz, f"Quiz {expected_quiz['id']} not found for session {session_id}"
        assert "creator_id" in quiz, f"Creator ID missing in quiz {expected_quiz['id']}"
        assert quiz["session_id"] == expected_quiz["session_id"], f"Incorrect session ID in quiz {expected_quiz['id']}"

@pytest.mark.parametrize("session_id, expected_interrupts", [
    (VALID_SESSION_ID, [{"id": VALID_INTERRUPT_ID, "session_id": VALID_SESSION_ID}]),
])
def test_get_session_interrupts_details(session_id, expected_interrupts):
    """Test if the retrieved session interrupts contain correct details."""
    response = client.get(f"/sessions/{session_id}/interrupts")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {session_id}"
    assert response.headers["content-type"] == "application/json"

    interrupts_data = response.json()["interrupts"]
    assert isinstance(interrupts_data, list), f"Expected list, got {type(interrupts_data)} for {session_id}"

    for expected_interrupt in expected_interrupts:
        interrupt = next((i for i in interrupts_data if i["_id"] == expected_interrupt["id"]), None)
        assert interrupt, f"Interrupt {expected_interrupt['id']} not found for session {session_id}"
        assert "session_id" in interrupt, f"Session ID missing in interrupt {expected_interrupt['id']}"
        assert interrupt["session_id"] == expected_interrupt["session_id"], f"Incorrect session ID in interrupt {expected_interrupt['id']}"

@pytest.mark.parametrize("quiz_id, expected_quiz", [
    (VALID_QUIZ_ID, {"id": VALID_QUIZ_ID, "creator_id": VALID_USER_ID}),
])
def test_get_quiz_details(quiz_id, expected_quiz):
    """Test if the retrieved quiz contains correct details."""
    response = client.get(f"/quizzes/{quiz_id}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {quiz_id}"
    assert response.headers["content-type"] == "application/json"

    quiz_data = response.json()
    assert quiz_data, f"Empty response for quiz {quiz_id}"

    assert "_id" in quiz_data, f"ID missing in quiz {quiz_id}"
    assert quiz_data["_id"] == expected_quiz["id"], f"Incorrect ID in quiz {quiz_id}"

    assert "creator_id" in quiz_data, f"Creator ID missing in quiz {quiz_id}"
    assert quiz_data["creator_id"] == expected_quiz["creator_id"], f"Incorrect creator ID in quiz {quiz_id}"


@pytest.mark.parametrize("quiz_id, expected_questions", [
    (VALID_QUIZ_ID, [{"id": VALID_QUESTION_ID, "quiz_id": VALID_QUIZ_ID, "title": "test_title"}]),
])
def test_get_quiz_questions_details(quiz_id, expected_questions):
    """Test if the retrieved quiz questions contain correct details."""
    response = client.get(f"/quizzes/{quiz_id}/questions")
    assert response.status_code == 200, f"Expected 200, got {response.status_code} for {quiz_id}"
    assert response.headers["content-type"] == "application/json"

    questions_data = response.json()["questions"]
    assert isinstance(questions_data, list), f"Expected list, got {type(questions_data)} for {quiz_id}"

    for expected_question in expected_questions:
        question = next((q for q in questions_data if q["_id"] == expected_question["id"]), None)
        assert question, f"Question {expected_question['id']} not found for quiz {quiz_id}"

        assert "quiz_id" in question, f"Quiz ID missing in question {expected_question['id']}"
        assert question["quiz_id"] == expected_question[
            "quiz_id"], f"Incorrect quiz ID in question {expected_question['id']}"

        assert "title" in question, f"Title missing in question {expected_question['id']}"
        assert question["title"] == expected_question["title"], f"Incorrect title in question {expected_question['id']}"


@pytest.mark.parametrize("endpoint, expected_status", [
    ("/users/", 200),
])
def test_get_valid_requests(endpoint, expected_status):
    """Test GET requests for valid IDs."""
    response = client.get(endpoint)
    assert response.status_code == expected_status, f"Failed on {endpoint}"
    assert response.headers["content-type"] == "application/json"
    assert response.json(), f"Empty response on {endpoint}"



@pytest.mark.parametrize("endpoint", [
    f"/users/{INVALID_USER_ID}",
    f"/users/{INVALID_USER_ID}/sessions",
    f"/users/{INVALID_USER_ID}/contests",
    f"/users/{INVALID_USER_ID}/interrupts",
    f"/users/{INVALID_USER_ID}/quizzes",
    f"/sessions/{INVALID_SESSION_ID}/contests",
    f"/sessions/{INVALID_SESSION_ID}/quizzes",
    f"/session/{INVALID_SESSION_ID}/interrupts",
    f"/quizzes/{INVALID_QUIZ_ID}",
    f"/quizzes/{INVALID_QUIZ_ID}/questions",
])
def test_get_invalid_requests(endpoint):
    """Test GET requests with invalid IDs."""
    response = client.get(endpoint)
    assert response.status_code == 404, f"Expected 404 on {endpoint}, got {response.status_code}"

INVALID_ID = "invalid"

@pytest.mark.parametrize("endpoint", [
    f"/users/{INVALID_ID}",
    f"/users/{INVALID_ID}/sessions",
    f"/users/{INVALID_ID}/contests",
    f"/users/{INVALID_ID}/interrupts",
    f"/users/{INVALID_ID}/quizzes",
    f"/sessions/{INVALID_ID}/contests",
    f"/sessions/{INVALID_ID}/quizzes",
    f"/sessions/{INVALID_ID}/interrupts",
    f"/quizzes/{INVALID_ID}",
    f"/quizzes/{INVALID_ID}/questions",
])
def test_get_invalid_id_requests(endpoint):
    """Test GET requests with invalid IDs."""
    response = client.get(endpoint)
    assert response.status_code == 400, f"Expected 400 on {endpoint}, got {response.status_code}"


# POST requests

# ✅ Test Adding a User Successfully
def test_add_user_success(mock_db):
    # Prepare mock user data for a successful request
    mock_user = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword",
        "google_id": "google",
        "created_at": datetime.now().isoformat(),
        "default_session_length": 180,
        "default_min_range": 30,
        "default_max_range": 30
    }

    # Make POST request to create a user
    response = client.post("/users", json=mock_user)

    # Check if status code is 200 (successful user creation)
    assert response.status_code == 200

    # Parse response data
    response_data = response.json()

    # Check that the returned username and email match the input
    assert response_data["username"] == mock_user["username"]
    assert response_data["email"] == mock_user["email"]
    # Ensure password is not exposed in the response (important for security)
    # assert "password" not in response_data

# ✅ Test Adding a User with Missing Fields
def test_add_user_missing_fields():
    # Prepare incomplete mock user data (username is missing)
    incomplete_user = {
        "username": "",
        "email": "test@example.com",
        "password": "securepassword",
        "google_id": "google",
        "created_at": datetime.now().isoformat(),
        "default_session_length": 180,
        "default_min_range": 30,
        "default_max_range": 30
    }

    # Make POST request to create a user with missing fields
    response = client.post("/users", json=incomplete_user)

    # Check if status code is 400 (Bad Request due to missing fields)
    assert response.status_code == 400
    # Ensure the error message indicates missing username, email, and password
    assert response.json()["detail"] == "Username, email, and google_id are required"

# ✅ Test Adding a User with Duplicate Email
def test_add_user_duplicate_email(mock_db):
    # Prepare mock user data for a duplicate email scenario
    mock_user = {
        "username": "testuser",
        "email": "andre@example.com",
        "password": "securepassword",
        "google_id": "google",
        "created_at": datetime.now().isoformat(),
        "default_session_length": 180,
        "default_min_range": 30,
        "default_max_range": 30
    }

    # Make POST request to create a user
    response = client.post("/users", json=mock_user)

    # Check if status code is 409 (Conflict due to duplicate email)
    assert response.status_code == 409
    # Ensure the error message indicates email is already registered
    assert response.json()["detail"] == "Email already registered"


def test_create_user_session_success(mock_db):


    # Create a mock session
    mock_session = {
        "start_time": datetime.now().isoformat(),
        "end_time": datetime.now().isoformat(),
        "creator_id": VALID_USER_ID,
        "participants": [{"id": VALID_USER_ID, "username": "Andre"}],
        "quizz_ids": None,
        "duration": 0,
        "is_public": False,
    }

    # Send POST request
    response = client.post(f"/sessions", json=mock_session)

    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert "creator_id" in data
    assert data["creator_id"] == VALID_USER_ID
    assert "start_time" in data
    assert "end_time" in data
    assert "participants" in data

def test_create_contest_success(mock_db):

    # Create a mock contest
    mock_contest = {
        "grades": [1, 2, 3],
        "participants": [{"id": VALID_USER_ID, "username": "testuser"}],
        "session_id": VALID_SESSION_ID,
    }

    # Send POST request
    response = client.post(f"/contests", json=mock_contest)

    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert "session_id" in data
    assert data["session_id"] == VALID_SESSION_ID
    assert "grades" in data
    assert "participants" in data
    assert len(data["participants"]) > 0
    assert data["participants"][0]["id"] == VALID_USER_ID

def test_create_quiz_success(mock_db):
    # Create a mock quiz
    mock_quiz = {
        "title": "Sample Quiz",
        "creator_id": VALID_USER_ID,
        "session_id": VALID_SESSION_ID,
        "created_at": datetime.now().isoformat(),
    }

    # Send POST request
    response = client.post(f"/quizzes", json=mock_quiz)

    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert "title" in data
    assert data["title"] == "Sample Quiz"
    assert "creator_id" in data
    assert data["creator_id"] == VALID_USER_ID
    assert "session_id" in data
    assert data["session_id"] == VALID_SESSION_ID

def test_create_interrupt_success(mock_db):

    # Create a mock interrupt
    mock_interrupt = {
        "type": 1,
        "link": "http://example.com",
        "interrupt_time": datetime.now().isoformat(),
        "creator_id": VALID_USER_ID,
        "session_id": VALID_SESSION_ID  # Optional session_id (could be None for no session association)
    }

    # Send POST request
    response = client.post(f"/interrupts", json=mock_interrupt)

    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert "type" in data
    assert data["type"] == 1
    assert "link" in data
    assert data["link"] == "http://example.com"
    assert "interrupt_time" in data
    assert data["interrupt_time"] == mock_interrupt["interrupt_time"]
    assert "creator_id" in data
    assert data["creator_id"] == VALID_USER_ID
    assert "session_id" in data
    assert data["session_id"] == VALID_SESSION_ID

def test_join_contest_creates_event(mock_db):
    # Join contest as a new user
    new_user = {"id": "user-new-1", "username": "Bob"}
    response = client.post(f"/contests/{VALID_CONTEST_ID}/join", json=new_user)
    assert response.status_code == 200
    assert response.json() == {"message": "joined"}

    # Ensure event was created in contest_events
    ev = mock_db.contest_events.find_one({"contest_id": VALID_CONTEST_ID, "type": "user_joined"})
    assert ev is not None
    assert ev["payload"]["user"]["id"] == "user-new-1"


def test_submit_score_increments_and_creates_event(mock_db):
    # Submit a score delta for existing user
    body = {"user_id": VALID_USER_ID, "username": "Andre", "delta": 2}
    response = client.post(f"/contests/{VALID_CONTEST_ID}/submit", json=body)
    assert response.status_code == 200
    data = response.json()
    assert "players" in data
    # find the player
    player = next((p for p in data["players"] if p["id"] == VALID_USER_ID), None)
    assert player is not None
    assert player["score"] == 2

    # Confirm event recorded
    ev = mock_db.contest_events.find_one({"contest_id": VALID_CONTEST_ID, "type": "score_update"})
    assert ev is not None
    assert ev["payload"]["user_id"] == VALID_USER_ID


def test_get_events_after_submit(mock_db):
    # perform a submit then query events
    body = {"user_id": VALID_USER_ID, "username": "Andre", "delta": 1}
    resp = client.post(f"/contests/{VALID_CONTEST_ID}/submit", json=body)
    assert resp.status_code == 200

    events_resp = client.get(f"/contests/{VALID_CONTEST_ID}/events")
    assert events_resp.status_code == 200
    payload = events_resp.json()
    assert "events" in payload
    assert any(e.get("type") == "score_update" for e in payload["events"]), "expected score_update event"


def test_register_webhook_and_persist(mock_db):
    reg = {"url": "https://example.test/hook", "secret": "shhh"}
    resp = client.post(f"/contests/{VALID_CONTEST_ID}/webhooks", json=reg)
    assert resp.status_code == 201
    data = resp.json()
    assert "webhook" in data
    hook = data["webhook"]
    assert hook["url"] == reg["url"]

    # Ensure contest doc now contains the webhook entry
    contest_doc = mock_db.contests.find_one({"_id": ObjectId(VALID_CONTEST_ID)})
    assert contest_doc is not None
    hooks = contest_doc.get("webhooks") or []
    assert any(h.get("url") == reg["url"] for h in hooks)


def test_get_scores_returns_players_list(mock_db):
    resp = client.get(f"/contests/{VALID_CONTEST_ID}/scores")
    assert resp.status_code == 200
    data = resp.json()
    assert "players" in data
    players = data["players"]
    assert isinstance(players, list)
    assert any(p.get("id") == VALID_USER_ID for p in players)

def test_create_question_success(mock_db):

    # Create a mock question
    mock_question = {
        "type": 1,
        "text": "What is FastAPI?",
        "body": "Explain FastAPI and its benefits.",
        "answer": "FastAPI is a modern web framework for building APIs with Python.",
        "quiz_id": VALID_QUIZ_ID # Ensure the quiz ID exists in the mock DB
    }

    # Send POST request
    response = client.post(f"/questions", json=mock_question)

    # Assertions
    assert response.status_code == 201
    data = response.json()
    assert "type" in data
    assert data["type"] == 1
    assert "text" in data
    assert data["text"] == "What is FastAPI?"
    assert "body" in data
    assert data["body"] == "Explain FastAPI and its benefits."
    assert "answer" in data
    assert data["answer"] == "FastAPI is a modern web framework for building APIs with Python."
    assert "quiz_id" in data
    assert data["quiz_id"] == VALID_QUIZ_ID


#PUT tests

# ✅ Test Updating a User Successfully
def test_update_user_success(mock_db):
    # Prepare mock user data for updating the user
    mock_user = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword",
        "google_id": "google",
        "created_at": datetime.now().isoformat(),
        "default_session_length": 180,
        "default_min_range": 30,
        "default_max_range": 30
    }

    # Make PUT request to update the user
    response = client.put(f"/users/{VALID_USER_ID}", json=mock_user)

    # Check if status code is 200 (successful user update)
    assert response.status_code == 200
    # Ensure the success message is returned
    assert response.json()["message"] == "User updated successfully"

# ✅ Test Updating a Session Successfully
def test_update_session_success(mock_db):
    # Prepare mock session data for updating the session
    mock_session = {
        "start_time": datetime.now().isoformat(),
        "end_time": datetime.now().isoformat(),
        "creator_id": VALID_USER_ID,
        "interrupts": [],
        "participants": [{"id": VALID_USER_ID, "username": "testuser"}],
        "quizz_ids":None ,
        "duration": 0,
        "is_public": False,
    }

    # Make PUT request to update the session
    response = client.put(f"/sessions/{VALID_SESSION_ID}", json=mock_session)

    # Check if status code is 200 (successful session update)
    assert response.status_code == 200
    # Ensure the success message is returned
    assert response.json()["message"] == "Session updated successfully"

# ✅ Test Updating a Contest Successfully
def test_update_contest_success(mock_db):
    # Prepare mock contest data for updating the contest
    mock_contest = {
        "grades": [1, 2, 3],
        "participants": [{"id": VALID_USER_ID, "username": "testuser"}],
        "session_id": VALID_SESSION_ID,
    }

    # Make PUT request to update the contest
    response = client.put(f"/contests/{VALID_CONTEST_ID}", json=mock_contest)

    # Check if status code is 200 (successful contest update)
    assert response.status_code == 200
    # Ensure the success message is returned
    assert response.json()["message"] == "Contest updated successfully"

# ✅ Test Updating a Quiz Successfully
def test_update_quiz_success(mock_db):
    # Prepare mock quiz data for updating the quiz
    mock_quiz = {
        "title": "Sample Quiz",
        "creator_id": VALID_USER_ID,
        "session_id": None,
        "created_at": datetime.now().isoformat(),
        "questions": [
            "65f69cd9185476aab56284d3",  # Example question ID
            "65f69cd9185476aab56284d4"
        ]
    }

    # Make PUT request to update the quiz
    response = client.put(f"/quizzes/{VALID_QUIZ_ID}", json=mock_quiz)

    # Check if status code is 200 (successful quiz update)
    assert response.status_code == 200
    # Ensure the success message is returned
    assert response.json()["message"] == "Quiz updated successfully"

# ✅ Test Updating an Interrupt Successfully
def test_update_interrupt_success(mock_db):
    # Prepare mock interrupt data for updating the interrupt
    mock_interrupt = {
        "type": 1,
        "link": "http://example.com",
        "interrupt_time": datetime.now().isoformat(),
        "creator_id": VALID_USER_ID,
        "session_id": VALID_SESSION_ID  # Optional session_id (could be None for no session association)
    }

    # Make PUT request to update the interrupt
    response = client.put(f"/interrupts/{VALID_INTERRUPT_ID}", json=mock_interrupt)

    # Check if status code is 200 (successful interrupt update)
    assert response.status_code == 200
    # Ensure the success message is returned
    assert response.json()["message"] == "Interrupt updated successfully"

# ✅ Test Updating a Question Successfully
def test_update_question_success(mock_db):
    # Prepare mock question data for updating the question
    mock_question = {
        "type": 1,
        "text": "What is FastAPI?",
        "body": "Explain FastAPI and its benefits.",
        "answer": "FastAPI is a modern web framework for building APIs with Python.",
        "quiz_id": VALID_QUIZ_ID
    }

    # Make PUT request to update the question
    response = client.put(f"/questions/{VALID_QUESTION_ID}", json=mock_question)

    # Check if status code is 200 (successful question update)
    assert response.status_code == 200
    # Ensure the success message is returned
    assert response.json()["message"] == "Question updated successfully"


NEW_USERS = [{"id": "65a69cd9185476aab56284df", "username": "John"}]
EXISTING_USER = [{"id": "65b8ba98a6c4a46585522b55", "username": "Andre"}]

def test_add_users_to_contest_success():
    """Test adding new users to an existing contest."""
    response = client.patch(f"/contests/{VALID_CONTEST_ID}/add-users", json=NEW_USERS)
    assert response.status_code == 200
    assert response.json() == {"message": "Users added to contest successfully"}

def test_add_users_already_exists():
    """Test when all users are already in the contest."""
    response = client.patch(f"/contests/{VALID_CONTEST_ID}/add-users", json=EXISTING_USER)
    assert response.status_code == 200
    assert response.json() == {"message": "No new users added (users may already exist in the contest)"}

def test_add_users_invalid_contest_id():
    """Test when contest ID format is invalid."""
    response = client.patch(f"/contests/{INVALID_ID}/add-users", json=NEW_USERS)
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid contest ID format"

def test_add_users_contest_not_found(mock_db):
    """Test when contest is not found."""
    non_existent_contest_id = str(ObjectId())
    response = client.patch(f"/contests/{non_existent_contest_id}/add-users", json=NEW_USERS)
    assert response.status_code == 404
    assert response.json()["detail"] == "Contest not found"

def test_add_users_to_session_success():
    """Test adding new users to an existing session."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-users", json=NEW_USERS)
    assert response.status_code == 200
    assert response.json() == {"message": "Users added to session successfully"}

def test_add_users_session_already_exists():
    """Test when all users are already in the session."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-users", json=EXISTING_USER)
    assert response.status_code == 200
    assert response.json() == {"message": "No new users added (users may already exist in the session)"}

def test_add_users_invalid_session_id():
    """Test when session ID format is invalid."""
    response = client.patch(f"/sessions/{INVALID_ID}/add-users", json=NEW_USERS)
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid session ID format"

def test_add_users_session_not_found(mock_db):
    """Test when session is not found."""
    non_existent_session_id = str(ObjectId())
    response = client.patch(f"/sessions/{non_existent_session_id}/add-users", json=NEW_USERS)
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"

def test_add_quiz_to_session_success():
    """Test adding a quiz to an existing session."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-quiz/{VALID_QUIZ_ID}")
    assert response.status_code == 200
    assert response.json() == {"message": "Quiz added to session successfully"}

def test_add_quiz_invalid_session_id():
    """Test when session ID format is invalid."""
    response = client.patch(f"/sessions/{INVALID_ID}/add-quiz/{VALID_QUIZ_ID}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid session ID format"

def test_add_quiz_invalid_quiz_id():
    """Test when quiz ID format is invalid."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-quiz/{INVALID_ID}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid quiz ID format"

def test_add_quiz_session_not_found(mock_db):
    """Test when session is not found."""
    non_existent_session_id = str(ObjectId())
    response = client.patch(f"/sessions/{non_existent_session_id}/add-quiz/{VALID_QUIZ_ID}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"

def test_add_interrupt_to_session_success():
    """Test successfully adding an interrupt to a session."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-interrupt/{VALID_INTERRUPT_ID}")

    assert response.status_code == 200
    assert response.json() == {"message": "Interrupt added to session successfully"}

def test_add_interrupt_to_session_invalid_session():

    response = client.patch(f"/sessions/{INVALID_SESSION_ID }/add-interrupt/{VALID_INTERRUPT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}


def test_add_interrupt_to_session_invalid_interrupt():
    """Test adding a non-existent interrupt to a session."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-interrupt/{INVALID_INTERRUPT_ID}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Interrupt not found"}

def test_add_interrupt_to_session_invalid_session_id():
    """Test passing an invalid session ID format."""
    response = client.patch(f"/sessions/{INVALID_ID}/add-interrupt/{VALID_INTERRUPT_ID}")

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid session or interrupt ID format"}

def test_add_interrupt_to_session_invalid_interrupt_id():
    """Test passing an invalid interrupt ID format."""
    response = client.patch(f"/sessions/{VALID_SESSION_ID}/add-interrupt/{INVALID_ID}")
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid session or interrupt ID format"}

# DELETE tests
def test_remove_user_from_contest_success():
    """Test successfully removing users from a contest."""
    response = client.delete(f"/contests/{VALID_CONTEST_ID}/remove-user/{VALID_USER_ID}",)
    assert response.status_code == 200
    assert response.json() == {"message": "User removed from contest successfully"}

def test_remove_user_from_session_success():
    """Test successfully removing users from a contest."""
    response = client.delete(f"/sessions/{VALID_SESSION_ID}/remove-user/{VALID_USER_ID}", )
    assert response.status_code == 200
    assert response.json() == {"message": "User removed from session successfully"}

def test_remove_quiz_from_session_success():
    """Test successfully removing users from a contest."""
    response = client.delete(f"/sessions/{VALID_SESSION_ID}/remove-quiz/{VALID_QUIZ_ID}", )
    assert response.status_code == 200
    assert response.json() == {"message": "Quiz removed from session successfully"}

def test_remove_interrupt_from_session_success():
    """Test successfully removing users from a contest."""
    response = client.delete(f"/sessions/{VALID_SESSION_ID}/remove-interrupt/{VALID_INTERRUPT_ID}", )
    assert response.status_code == 200
    assert response.json() == {"message": "Interrupt removed from session successfully"}

def test_delete_user_success(mock_db):
    """Test successfully deleting a user and cleaning up related data."""
    # Send the delete request
    response = client.delete(f"/users/{VALID_USER_ID}")

    # Assert successful deletion
    assert response.status_code == 200
    assert response.json() == {"message": "User deleted successfully"}

    # Verify user is deleted
    assert mock_db.users.find_one({"_id": ObjectId(VALID_USER_ID)}) is None

    # Verify session is deleted
    assert mock_db.sessions.find_one({"_id": ObjectId(VALID_SESSION_ID)}) is None

    # Verify quiz is deleted
    assert mock_db.quizzes.find_one({"_id": ObjectId(VALID_QUIZ_ID)}) is None

    # Verify question is deleted
    assert mock_db.questions.find_one({"_id": ObjectId(VALID_QUESTION_ID)}) is None

def test_delete_session_success(mock_db):
    #Test successfully deleting a user and cleaning up related data.
    # Send the delete request
    response = client.delete(f"/sessions/{VALID_SESSION_ID}")

    related_collections = ["contests", "interrupts", "quizzes"]

    # Assert successful deletion
    assert response.status_code == 200
    assert response.json() == {"message": "Session deleted successfully"}

    # Verify session is deleted
    assert mock_db.sessions.find_one({"_id": ObjectId(VALID_SESSION_ID)}) is None

    for collection in related_collections:
        assert mock_db[collection].count_documents({"session_id": VALID_SESSION_ID}) == 0


def test_delete_contest_success(mock_db):
    # Test successfully deleting a user and cleaning up related data.
    # Send the delete request
    response = client.delete(f"/contests/{VALID_CONTEST_ID}")

    # Assert successful deletion
    assert response.status_code == 200
    assert response.json() == {"message": "Contest deleted successfully"}

    # Verify session is deleted
    assert mock_db.sessions.find_one({"_id": ObjectId(VALID_CONTEST_ID)}) is None

def test_delete_quiz_success(mock_db):
    # Test successfully deleting a user and cleaning up related data.
    # Send the delete request


    response = client.delete(f"/quizzes/{VALID_QUIZ_ID}")

    # Assert successful deletion
    assert response.status_code == 200
    assert response.json() == {"message": "Quiz deleted successfully"}

    # Verify session is deleted
    assert mock_db.sessions.find_one({"_id": ObjectId(VALID_QUIZ_ID)}) is None

    assert mock_db["questions"].count_documents({"quiz_id": VALID_QUIZ_ID}) == 0

def test_delete_question_success(mock_db):
    # Test successfully deleting a user and cleaning up related data.
    # Send the delete request

    response = client.delete(f"/questions/{VALID_QUESTION_ID}")

    # Assert successful deletion
    assert response.status_code == 200
    assert response.json() == {"message": "Question deleted successfully"}

    # Verify session is deleted
    assert mock_db.sessions.find_one({"_id": ObjectId(VALID_CONTEST_ID)}) is None

def test_delete_interrupt_success(mock_db):
    response = client.delete(f"/interrupts/{VALID_INTERRUPT_ID}")

    assert response.status_code == 200
    assert response.json() == {"message": "Interrupt deleted successfully"}

    # Verify the interrupt is deleted
    assert mock_db.interrupts.find_one({"_id": ObjectId(VALID_INTERRUPT_ID)}) is None

    # Verify the interrupt is removed from the session's interrupts list
    session = mock_db.sessions.find_one({"_id": ObjectId(VALID_SESSION_ID)})
    assert VALID_INTERRUPT_ID not in [i["_id"] for i in session["interrupts"]]

def test_delete_user_invalid(mock_db):
    """Test deleting a user that does not exist."""
    response = client.delete(f"/users/{INVALID_USER_ID}")
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}

def test_delete_session_invalid(mock_db):
    """Test deleting a session that does not exist."""
    response = client.delete(f"/sessions/{INVALID_SESSION_ID}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}

def test_delete_contest_invalid(mock_db):
    """Test deleting a contest that does not exist."""
    response = client.delete(f"/contests/{INVALID_CONTEST_ID}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Contest not found"}

def test_delete_quiz_invalid(mock_db):
    """Test deleting a quiz that does not exist."""
    response = client.delete(f"/quizzes/{INVALID_QUIZ_ID}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Quiz not found"}

def test_delete_question_invalid(mock_db):
    """Test deleting a question that does not exist."""
    response = client.delete(f"/questions/{INVALID_QUESTION_ID}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Question not found"}

def test_delete_interrupt_invalid(mock_db):
    """Test deleting an interrupt that does not exist."""
    response = client.delete(f"/interrupts/{INVALID_INTERRUPT_ID}")
    assert response.status_code == 404
    assert response.json() == {"detail": "Interrupt not found"}


