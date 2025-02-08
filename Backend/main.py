from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from bson import ObjectId

# Connect to MongoDB
myClient = MongoClient("mongodb://localhost:27017/")
mydb = myClient["mydatabase"]
mycol = mydb["users"]

# Initialize FastAPI app
app = FastAPI(title="Fast Mongo API")


@app.post("/users/{name}")
async def add_user(name: str):
    doc = {"name": name}
    result = mycol.insert_one(doc)
    return {"inserted_id": str(result.inserted_id)}


@app.get("/users/{id}")
async def get_user_by_id(id: str):
    try:
        obj_id = ObjectId(id)  # Convert string to ObjectId
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    user = mycol.find_one({"_id": obj_id})

    if user:
        user["_id"] = str(user["_id"])  # Convert ObjectId to string
        return user
    else:
        raise HTTPException(status_code=404, detail="User not found")


@app.get("/users/")
async def get_users():
    users = []
    for x in mycol.find():
        x["_id"] = str(x["_id"])  # Convert ObjectId to string
        users.append(x)
    return {"users": users}
