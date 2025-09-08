# SDE-1 Take-Home Assessment: Task Management System

## Overview
This assessment evaluates your problem-solving skills, attention to detail, and coding practices through building a task management system. You have **2-3 days** to complete this project.

**Important**: We encourage the use of AI tools and want you to document what tools you used and how they helped you in your README.

## Project Requirements

### Core Features
Build a task management system with the following capabilities:

1. **Task CRUD Operations**
   - Create, read, update, and delete tasks
   - Each task should have: title, description, status (todo/in-progress/done), priority (low/medium/high), due date, and created/updated timestamps

2. **Task Filtering & Search**
   - Filter tasks by status, priority, and due date ranges
   - Search tasks by title and description
   - Sort tasks by various fields (created date, due date, priority)

3. **Task Assignment**
   - Assign tasks to users (simple user management)
   - View tasks assigned to a specific user
   - Handle unassigned tasks

### Technical Stack
- **Backend**: Node.js with Express
- **Frontend**: React.js (build a minimal frontend to test your API)
- **Database**: PostgreSQL
- **Testing**: Include unit tests for your backend logic

### Edge Cases to Consider
- What happens when a task is deleted but has dependencies?
- How do you handle invalid date inputs?
- What if a user tries to assign a task to a non-existent user?
- How do you handle concurrent updates to the same task?
- What happens with very long task descriptions or titles?

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd sde-assessment-test
   ```

2. **Start the Database**
   ```bash
   docker-compose up -d
   ```
   This will start PostgreSQL and automatically create the schema with sample data.

3. **Database Connection**
   - Host: localhost
   - Port: 5432
   - Database: task_management
   - Username: postgres
   - Password: password

4. **Verify Setup**
   ```bash
   # Connect to the database to verify
   docker exec -it task_management_db psql -U postgres -d task_management
   ```

5. **Build Your Application**
   - Create your Node.js backend API
   - Build a minimal React frontend to test your API
   - The frontend should be simple but functional

### Database Schema
The database comes pre-configured with:
- `users` table with sample users
- `tasks` table with sample tasks
- Proper relationships and constraints
- Sample data for testing

## Evaluation Criteria

### Code Quality (40%)
- Clean, readable code structure
- Proper error handling
- Consistent coding style
- Appropriate use of async/await or promises

### Functionality (30%)
- All required features implemented correctly
- Edge cases handled appropriately
- API design and consistency
- Frontend integration with backend API
- Database query optimization (bonus points)

### Testing (20%)
- Unit tests for business logic
- Test coverage for critical paths
- Proper test structure and naming

### Documentation (10%)
- Clear README with setup instructions
- API documentation
- Code comments where necessary
- Documentation of AI tools used

## Submission Requirements

### How to Submit
1. **Fork this repository** to your own GitHub account
2. **Clone your forked repository:**
   ```bash
   git clone https://github.com/[your-username]/sde-assessment-test.git
   cd sde-assessment-test
   ```

3. **Complete your work and commit regularly:**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push origin main
   ```

4. **Submit the link to your forked repository** to the hiring team

**Note**: Work on the `main` branch of your forked repository. This keeps your work separate from other candidates.

### What to Include
1. **Code Repository**
   - Well-structured project with clear separation of concerns
   - All source code and tests
   - Package.json with all dependencies

2. **Documentation**
   - README.md with:
     - Setup and run instructions
     - API endpoints documentation
     - How to test the application
     - List of AI tools used and how they helped
     - Any assumptions made or design decisions

3. **Testing Instructions**
   - How to run your tests
   - How to test the API endpoints
   - How to run and test the frontend
   - How to verify the full application works



## Questions?
If you have any questions about the requirements or need clarification on edge cases, feel free to reach out. We value clear communication and reasonable assumptions.

Good luck! 🚀
