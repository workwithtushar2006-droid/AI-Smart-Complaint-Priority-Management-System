📌 Overview

This project is an AI-powered complaint management system designed for smart cities. The goal of this system is to help city authorities automatically prioritize citizen complaints based on urgency and category.

In many cities, complaints such as potholes, garbage overflow, water leakage, and broken streetlights are handled manually. This often causes delays in solving critical problems. Our system uses AI to classify complaints and assign an urgency score so that important issues are addressed first.

🚀 Features

Complaint submission form (Name, Location, Description)

AI-based complaint classification (Road, Electricity, Water, Sanitation, etc.)

Urgency scoring from 1 to 5

AI-generated short summary

Admin dashboard sorted by priority

Data stored in MongoDB

🛠️ Tech Stack

Node.js

Express.js

MongoDB

OpenAI API

HTML, CSS

⚙️ How It Works

User submits a complaint.

The backend sends the complaint description to the AI API.

AI returns:

Complaint category

Urgency score

Short summary

Data is saved in the database.

Admin dashboard shows complaints sorted by highest urgency first.

🎯 Purpose

This project demonstrates how AI can be used in day-to-day civic management to improve efficiency and reduce response time for critical public issues.
