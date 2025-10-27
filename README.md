# FileConverter

A simple multimedia converter with a Java Spring Boot backend and a React + Vite frontend.

## How to Run

You must run two separate servers in two separate terminals.

### 1. Run the Backend (Java)

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Run the Spring Boot server:
    ```bash
    ./mvnw spring-boot:run
    ```
    (On Windows PowerShell, use: `.\mvnw.cmd spring-boot:run`)

The server will start on **`http://localhost:8080`**.

### 2. Run the Frontend (React)

1.  Open a **second terminal** and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies (only required the first time):
    ```bash
    npm install
    ```
3.  Run the Vite development server:
    ```bash
    npm run dev
    ```

The application will be available at **`http://localhost:5173`** (or a similar port shown in your terminal).
