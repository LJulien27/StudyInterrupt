#This is the model for the database
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["study_interrupt"]

users_collection = db["users"]
sessions_collection = db["sessions"]
quizzes_collection = db["quizzes"]
interrupts_collection = db["interrupts"]
contests_collection = db["contests"]
questions_collection = db["questions"]