Erducate - An AI-Powered ERD Assessment and Feedback Tool
An intelligent auto-grading system for Entity-Relationship Diagrams (ERD) designed to reduce lecturers' workload and enhance student learning through AI-powered feedback in ERD-based coursework.
Features

🤖 AI-Powered Auto-Grading: Automatically grades ERD diagrams using Meta Llama 4 Scout AI
📸 Image-Based Assessment: Lecturers upload answer schemes as images
📝 Custom Rubrics: Define grading criteria in text format
✏️ Review & Edit: Lecturers can review and modify AI-generated marks and feedback
📊 Instant Feedback: Students receive detailed feedback on their submissions

Tech Stack

Frontend: React 18
Build Tool: Vite
Styling: Vanilla CSS
AI Model: Meta Llama 4 Scout (via API)

Getting Started
Prerequisites

Node.js (v14 or higher)
npm or yarn

Installation

Clone the repository

bashgit clone https://github.com/edsoraya1208/erducate3.git
cd erducate3

Install dependencies

bashnpm install

Start the development server

bashnpm run dev

Open your browser and visit http://localhost:5173

Available Scripts

npm run dev - Start development server
npm run build - Build for production
npm run preview - Preview production build

How It Works

Lecturer uploads the answer scheme (image) and grading rubric (text)
Students submit their ERD diagrams
AI evaluates submissions against the answer scheme using the rubric
Lecturer reviews AI-generated marks and feedback
Students receive grades and personalized feedback

Project Status
🚧 Final Year Project (In Progress) - Actively developing this platform as part of my undergraduate final year project.
This project connects to Meta Llama 4 Scout API endpoint for AI-powered grading.
