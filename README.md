<p align="center">
  <h1 align="center">Patchcat API Client</h1>
</p>

<p align="center">
  <img alt="Technology" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="Technology" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Technology" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img alt="Technology" src="https://img.shields.io/badge/Gemini_API-8E75B1?style=for-the-badge&logo=google-gemini&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" />
</p>

> A blazingly fast, browser-based API client for REST, GraphQL, and WebSockets, supercharged with an AI assistant.

![Patchcat Screenshot](https://storage.googleapis.com/aici-prod-user-data/public/a752e259-26d1-4389-9d95-207d6d5337b5.png)

## 🚀 Introduction

Patchcat is a modern, Postman-like API client that runs entirely in your browser. No installation, no accounts, no cloud sync—just a powerful tool to test your APIs with a focus on speed and developer experience. Built with React and TypeScript, it leverages your browser's local storage to persist your work, offering a seamless and private testing environment.

Whether you're debugging a complex GraphQL endpoint, monitoring a WebSocket feed, or simply hitting a REST API, Patchcat provides a clean, intuitive, and feature-rich interface to get the job done.

## ✨ Key Features

- **Multi-Protocol Support**: First-class support for **REST**, **GraphQL**, and **WebSockets** in a unified interface.
- **AI-Powered Assistant**: Integrated with Google's Gemini API to automatically analyze responses and suggest relevant test cases for edge cases, validation, and error handling.
- **Advanced GraphQL Client**:
    - Automatic schema introspection.
    - Interactive schema explorer.
    - Autocompletion for queries and variables based on the fetched schema (coming soon!).
- **Real-time WebSocket Client**:
    - Connect to `ws://` and `wss://` endpoints.
    - View a real-time log of sent and received messages.
    - Send messages interactively.
- **Comprehensive REST Client**:
    - Full support for all standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc.).
    - Easy-to-use editors for query parameters, headers, and various body types (`raw`, `form-data`, `binary/file-upload`).
- **Flexible Authentication**: Configure authentication globally or override on a per-tab basis. Supports Bearer Token.
- **Intuitive Multi-Tab Interface**: Organize your workflow with multiple tabs. Duplicate, rename, and manage your requests with ease.
- **Request History**: Automatically saves a log of your sent requests for quick re-use.
- **Zero Backend, 100% Private**: Runs entirely in your browser. All data is stored in your local storage, ensuring your work remains private.
- **Customizable UI**: Switch between multiple themes (Supabase, VS Code, Google Material) and fonts to tailor the experience to your liking.
- **Workspace Portability**: Easily export your entire workspace (tabs, history, settings) to a JSON file and import it on another machine.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context with `useReducer`
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **Dependencies**: Loaded via `importmap` for a build-free development experience.

## 🚀 Getting Started

Patchcat is designed to run without any complex build steps.

**1. Clone the repository:**
```bash
git clone https://github.com/your-repo/patchcat-api-client.git
cd patchcat-api-client
```

**2. Serve the files:**
You can use any simple static file server. Here are a couple of options:

- **Using `npx` (no installation required):**
  ```bash
  npx serve
  ```
- **Using Python:**
  ```bash
  # Python 3
  python -m http.server
  # Python 2
  python -m SimpleHTTPServer
  ```

**3. Open in your browser:**
Navigate to the local URL provided by your server (e.g., `http://localhost:3000`).

## ⚙️ Configuration

To use the AI Assistant features, you need to provide your own Google Gemini API key.

1.  Click the **Settings** icon in the bottom-left corner.
2.  Navigate to the **AI Assistant** section.
3.  Enter your Gemini API key in the input field. The key is stored securely in your browser's local storage and is never sent anywhere except to Google's servers.
4.  Enable the "Enable AI Assistant" toggle.

## 🤝 Contributing

Contributions are welcome! If you have a feature request, bug report, or want to contribute to the code, please feel free to open an issue or submit a pull request.

1.  **Fork the repository.**
2.  **Create a new branch** (`git checkout -b feature/your-feature-name`).
3.  **Make your changes.**
4.  **Commit your changes** (`git commit -m 'Add some feature'`).
5.  **Push to the branch** (`git push origin feature/your-feature-name`).
6.  **Open a Pull Request.**

## 📄 License

This project is licensed under the MIT License.
