# 🏆 Donghu Quiz Competition System 🧠
This repository is designed for quiz competitions at the Donghu training base. It supports importing questions from various formats, such as JSON and XLSX, provided they adhere to the correct format. Users can select questions by first filtering by "Question type" and then choosing a specific question from the filtered list. 📝✅

# Docker Deployment 🐳
To deploy this system using Docker, navigate to the project root directory and run the following command:

```bash
docker-compose up -d --build
```

This command will build the necessary Docker images and start the services in detached mode.

Accessing the Application:
Once the deployment is complete, the application will be accessible on port 5173.
You can open it in your web browser using one of the following addresses:

Local Access: http://localhost:5173
Server Access: http://YOUR_SERVER_IP:5173 (Replace YOUR_SERVER_IP with the public IP address of your cloud server where Docker is running.)
Enjoy your quiz competition! 🎉
