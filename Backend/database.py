# This is the model for the database
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os

# Connect to the local MongoDB server
uri = os.getenv("MONGODB_URI")
print(uri)

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
db = client["study_interrupt"]  # Access the "study_interrupt" database


# Define collections for different entities
users_collection = db["users"]
sessions_collection = db["sessions"]
quizzes_collection = db["quizzes"]
interrupts_collection = db["interrupts"]
contests_collection = db["contests"]
questions_collection = db["questions"]