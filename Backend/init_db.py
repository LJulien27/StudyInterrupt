from pymongo import MongoClient
from models import User
from datetime import datetime

def init_db():
    client = MongoClient("mongodb://localhost:27017/")
    db = client.study_interrupt
    users_collection = db.users

    # Check if the default user already exists
    if users_collection.count_documents({"email": "testuser@example.com"}) == 0:
        # Create a default user
        default_user = User(
            username="testuser",
            email="testuser@example.com",
            password="password123",
            created_at=datetime.now(),
            default_session_length=180,
            default_min_range=30,
            default_max_range=30
        )
        users_collection.insert_one(default_user.dict())
        print("Default user created.")
    else:
        print("Default user already exists.")

if __name__ == "__main__":
    init_db()