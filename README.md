# Creative.hack Platform

Creative.hack is a web application designed to facilitate KDDI's in-house ideathon and technical contest. The platform allows employees to submit business plans, vote for the best ideas, and collaborate on proof-of-concept (PoC) projects.

## Project Structure

The project is divided into two main parts:

- **Backend**: A FastAPI-based REST API that handles data storage, authentication, and business logic.
- **Frontend**: A Next.js application that provides the user interface for interacting with the platform.

## Features

### Business Plan Phase (First Half of the Year)
- Submit business plans with title, description, and other details
- Browse and search through submitted business plans
- Vote for favorite business plans
- Administrators can select business plans for the PoC phase

### PoC Phase (Second Half of the Year)
- Create PoC plans based on selected business plans or as standalone technical projects
- Join teams to collaborate on PoC projects
- Specify technical requirements and implementation details
- Track team membership and contributions

### General Features
- User authentication and authorization
- Notification system for important events (votes, selections, team changes)
- User profiles with department and division information
- Administrative tools for managing the platform

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python (v3.8 or later)
- PostgreSQL database

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd creative-hack-app/backend
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables (create a .env file):
   ```
   DATABASE_URL=postgresql://user:password@localhost/creative_hack
   SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. Run the development server:
   ```
   uvicorn app.main:app --reload
   ```

6. The API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd creative-hack-app/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. The application will be available at http://localhost:3000

## API Documentation

When the backend server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Notes

- The frontend uses Material-UI for components and styling
- Authentication is handled using JWT tokens
- The backend uses SQLAlchemy for database operations
- For demonstration purposes, the frontend currently uses mock data instead of making actual API calls

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
