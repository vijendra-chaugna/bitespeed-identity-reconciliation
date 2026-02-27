
# Bitespeed Identity Reconciliation Service

A backend service that identifies and consolidates customer identities across multiple purchases using email and phone number matching. Helps link different orders made with different contact information to the same person.

## Features

- Identify customers based on email and/or phone number
- Link multiple contact records belonging to the same customer
- Automatically create secondary contacts when new information is provided
- Consolidate primary contacts when connections are discovered
- RESTful API with JSON responses

## 🛠 Tech Stack

   - Backend: Node.js + Express(TypeScript)
   - Database: MySQL
   - Deployed on Render.com

## API Endpoint

### POST /identify

Identifies or creates a contact based on the provided email and/or phone number.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```
**Response:**
```json

{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}  
``` 

## Installation & Usage

npm install
npm start




~ Developed for a hiring process at Bitespeed :=> Backend Task: Identity Reconciliation 
