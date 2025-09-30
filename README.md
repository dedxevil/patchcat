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

> A blazingly fast, browser-based API client for REST, GraphQL, and WebSockets, supercharged with an AI assistant. An open-source, privacy-first alternative to Postman and Hoppscotch.

![Patchcat Screenshot](https://i.ibb.co/C3FCyGmS/patchcat-screenshot.png)

## 🚀 The Perfect Open-Source Alternative to Postman and Hoppscotch

Patchcat is a modern API client that runs entirely in your browser. It's the lightweight, no-installation Postman alternative you've been waiting for. If you're looking for a free API client that respects your privacy and offers powerful features without the bloat, Patchcat is for you.

Why choose Patchcat over other API testing tools like Postman, Hoppscotch, or Insomnia?

-   **Zero Installation, Zero Accounts**: Patchcat is a browser-based API testing tool. No downloads, no sign-ups. Just open the URL and start working. It's the ultimate lightweight API tool.
-   **100% Private and Secure**: All your requests, history, and settings are stored exclusively in your browser's local storage. No cloud sync, no data collection. A true privacy-focused API client.
-   **Blazingly Fast**: Built with a minimal footprint, the interface is incredibly responsive. Test your APIs without the lag of heavy desktop applications.
-   **AI-Powered Assistance**: Patchcat isn't just a REST client; it's an intelligent API development partner. Integrated with the Gemini API, it analyzes responses to suggest test cases, making your API debugging workflow smarter and faster.
-   **Truly Portable**: Export your entire workspace to a single JSON file. Move between machines or share your setup with colleagues effortlessly.

Patchcat is designed for developers who need a powerful API sandbox without the overhead. It's the ideal free Postman alternative for modern web development.

## ✨ Key Features

-   **Multi-Protocol Support**: First-class support for **REST**, **GraphQL**, and **WebSockets** in a unified interface.
-   **AI-Powered Assistant**: Integrated with Google's Gemini API to automatically analyze responses and suggest relevant test cases for edge cases, validation, and error handling.
-   **Advanced GraphQL Client**:
    -   Automatic schema introspection.
    -   Interactive schema explorer.
-   **Real-time WebSocket Client**:
    -   Connect to `ws://` and `wss://` endpoints.
    -   View a real-time log of sent and received messages.
-   **Comprehensive REST Client**:
    -   Full support for all standard HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc.).
    -   Easy editors for query parameters, headers, and various body types (`raw`, `form-data`, `binary/file-upload`).
-   **Flexible Authentication**: Configure authentication globally (Bearer Token) or override on a per-tab basis.
-   **Intuitive Multi-Tab Interface**: Organize your workflow with multiple tabs. Duplicate, rename, and manage your requests with ease.
-   **Request History**: Automatically saves a log of your sent requests for quick re-use.
-   **Customizable UI**: Switch between multiple themes and fonts to tailor the experience to your liking.
-   **Workspace Portability**: Easily export and import your entire workspace.

## 🛠️ Tech Stack

-   **Frontend**: [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: React Context with `useReducer`
-   **AI Integration**: [Google Gemini API](https://ai.google.dev/)
-   **Dependencies**: Loaded via `importmap` for a build-free development experience.

## 🚀 Getting Started

Patchcat is designed to run without any complex build steps.

**1. Clone the repository:**
```bash
git clone https://github.com/your-repo/patchcat-api-client.git
cd patchcat-api-client
```

**2. Serve the files:**
You can use any simple static file server. Here are a couple of options:

-   **Using `npx` (no installation required):**
    ```bash
    npx serve
    ```
-   **Using Python:**
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