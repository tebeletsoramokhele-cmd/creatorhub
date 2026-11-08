
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import CreatorDashboard from "./components/CreatorDashboard";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/content";

const AUTH_URL =
  process.env.REACT_APP_AUTH_URL || "http://localhost:5000/api/auth";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [contents, setContents] = useState([]);
  const [showComments, setShowComments] = useState({});

  // Creator login information
  const [token, setToken] = useState(
    () => localStorage.getItem("creatorToken") || ""
  );

  const [creator, setCreator] = useState(() => {
    const savedCreator = localStorage.getItem("creatorUser");

    try {
      return savedCreator ? JSON.parse(savedCreator) : null;
    } catch {
      return null;
    }
  });

  // Authentication form information
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch content from MongoDB
  const fetchContents = useCallback(async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // Register or log in creator
  const handleAuthentication = async (e) => {
    e.preventDefault();

    setAuthMessage("");
    setAuthError("");
    setAuthLoading(true);

    const isRegistering = authMode === "register";

    const endpoint = isRegistering
      ? `${AUTH_URL}/register`
      : `${AUTH_URL}/login`;

    const requestData = isRegistering
      ? {
          name: authName,
          email: authEmail,
          password: authPassword
        }
      : {
          email: authEmail,
          password: authPassword
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (isRegistering) {
        setAuthMessage(
          "Registration successful! You can now log in."
        );

        setAuthMode("login");
        setAuthName("");
        setAuthPassword("");
      } else {
        localStorage.setItem("creatorToken", data.token);
        localStorage.setItem(
          "creatorUser",
          JSON.stringify(data.user)
        );

        setToken(data.token);
        setCreator(data.user);

        setAuthMessage("");
        setAuthError("");
        setAuthPassword("");

        setShowAuth(false);
        setShowDashboard(true);

        fetchContents();
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Log out creator
  const handleLogout = () => {
    localStorage.removeItem("creatorToken");
    localStorage.removeItem("creatorUser");

    setToken("");
    setCreator(null);
    setShowDashboard(false);
    setShowAuth(false);
    setAuthMode("login");
  };

  // Update content (protected creator action)
  const updateContent = useCallback(async (id, updatedData) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error("Failed to update content");
    }

    const updatedContent = await response.json();

    setContents((previousContents) =>
      previousContents.map((item) =>
        item._id === id ? updatedContent : item
      )
    );

    return updatedContent;
  }, [token]);

  // Automatically publish scheduled content
  useEffect(() => {
    const publishScheduledContent = async () => {
      if (!token) return;

      const now = new Date();

      const scheduledContents = contents.filter(
        (content) =>
          content.status === "Scheduled" &&
          content.publicationDate &&
          new Date(content.publicationDate) <= now
      );

      for (const content of scheduledContents) {
        try {
          await updateContent(content._id, {
            status: "Published"
          });
        } catch (error) {
          console.error("Scheduled publishing failed:", error);
        }
      }
    };

    publishScheduledContent();

    const timer = setInterval(publishScheduledContent, 10000);

    return () => clearInterval(timer);
  }, [contents, token, updateContent]);

  // Like content (public viewer action)
  const handleLike = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/like`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to like content");
      }

      const updatedContent = await response.json();

      setContents((previousContents) =>
        previousContents.map((item) =>
          item._id === id ? updatedContent : item
        )
      );
    } catch (error) {
      console.error("Error liking content:", error);
      alert("Unable to like content. Please try again.");
    }
  };

  // Record content views
  const handleView = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/view`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Failed to record view");
      }

      const updatedContent = await response.json();

      setContents((previousContents) =>
        previousContents.map((item) =>
          item._id === id ? updatedContent : item
        )
      );
    } catch (error) {
      console.error("Error counting views:", error);
      alert("Unable to record this view.");
    }
  };

  // Share content
  const handleShare = (id) => {
    const link = `${window.location.origin}/?content=${id}`;

    navigator.clipboard.writeText(link)
      .then(() => alert("Content link copied successfully!"))
      .catch(() => alert("Unable to copy link."));
  };

  // Post viewer comments
  const handleComment = async (e, id) => {
    e.preventDefault();

    const name = e.target.elements.name.value.trim();
    const message = e.target.elements.message.value.trim();

    if (!name || !message) return;

    try {
      const response = await fetch(`${API_URL}/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.message || "Failed to post comment"
        );
      }

      const updatedContent = await response.json();

      setContents((previousContents) =>
        previousContents.map((item) =>
          item._id === id ? updatedContent : item
        )
      );

      e.target.reset();
    } catch (error) {
      console.error("Error posting comment:", error);

      alert(
        error.message || "Unable to post comment. Please try again."
      );
    }
  };

  // Search and filter published content
  const filteredContents = contents.filter((content) => {
    const isPublished = content.status === "Published";

    const matchesSearch =
      (content.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (content.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      content.category === selectedCategory;

    return isPublished && matchesSearch && matchesCategory;
  });

  // Show dashboard only when creator is logged in
  if (showDashboard && token) {
    return (
      <CreatorDashboard
        contents={contents}
        setContents={setContents}
        onBack={() => setShowDashboard(false)}
        onLogout={handleLogout}
        token={token}
        creator={creator}
      />
    );
  }

  // Login and registration page
  if (showAuth) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>CreatorHub</h1>

          <h2>
            {authMode === "login"
              ? "Creator Login"
              : "Create Creator Account"}
          </h2>

          <p>
            {authMode === "login"
              ? "Log in to manage your content."
              : "Register to become a CreatorHub creator."}
          </p>

          {authMessage && (
            <p className="auth-success">{authMessage}</p>
          )}

          {authError && (
            <p className="auth-error">{authError}</p>
          )}

          <form onSubmit={handleAuthentication}>
            {authMode === "register" && (
              <input
                type="text"
                placeholder="Full name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              minLength={8}
              required
            />

            <button type="submit" disabled={authLoading}>
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Log In"
                  : "Register"}
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login" ? "register" : "login"
                );
                setAuthMessage("");
                setAuthError("");
              }}
            >
              {authMode === "login" ? " Register" : " Log In"}
            </button>
          </p>

          <button
            className="back-button"
            onClick={() => {
              setShowAuth(false);
              setAuthMessage("");
              setAuthError("");
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <h2>CreatorHub</h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#content">Content</a>
          <a href="#about">About</a>

          <button
            onClick={() => {
              if (token) {
                setShowDashboard(true);
              } else {
                setShowAuth(true);
                setAuthMode("login");
              }
            }}
          >
            {token ? "Creator Dashboard" : "Creator Login"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero" id="home">
        <div className="hero-content">
          <h1>
            Welcome to CreatorHub – Discover, Explore and Get Inspired!
          </h1>

          <p>
            Discover educational content, technology,
            entertainment and lifestyle ideas.
          </p>

          <button
            onClick={() => {
              document.getElementById("content")?.scrollIntoView({
                behavior: "smooth"
              });
            }}
          >
            Explore Content
          </button>
        </div>
      </header>

      {/* About Section */}
      <section className="about" id="about">
        <h2>Meet Your Creator</h2>

        <p>
          Hello! I'm a content creator passionate about
          sharing knowledge, ideas and creativity.
          Explore my latest articles, videos and projects.
        </p>
      </section>

      {/* Featured Content */}
      <section className="content-section" id="content">
        <h2>Featured Content</h2>

        <p>Discover the latest content from your creator.</p>

        {/* Search and Category Filter */}
        <div className="content-controls">
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Education">Education</option>
            <option value="Technology">Technology</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Entertainment">Entertainment</option>
          </select>
        </div>

        {/* Content Cards */}
        <div className="content-grid">
          {filteredContents.length > 0 ? (
            filteredContents.map((content) => {
              const approvedComments = (content.comments || []).filter(
                (comment) =>
                  !comment.status || comment.status === "Approved"
              );

              return (
                <div className="content-card" key={content._id}>
                  <div className="card-image">
                    {content.thumbnail ? (
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="content-thumbnail"
                      />
                    ) : (
                      <span className="no-image">
                        No image uploaded
                      </span>
                    )}
                  </div>

                  <h3>{content.title}</h3>

                  <p>{content.description}</p>

                  {content.mediaUrl && (
                    <a
                      href={content.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-link"
                    >
                      View {content.type || "Content"}
                    </a>
                  )}

                  <span>{content.category}</span>

                  <p>👁️ Views: {content.views || 0}</p>

                  {/* Engagement Buttons */}
                  <div className="engagement">
                    <button onClick={() => handleLike(content._id)}>
                      ❤️ Like ({content.likes || 0})
                    </button>

                    <button onClick={() => handleShare(content._id)}>
                      🔗 Share
                    </button>

                    <button onClick={() => handleView(content._id)}>
                      View Content
                    </button>

                    <button
                      onClick={() =>
                        setShowComments((previous) => ({
                          ...previous,
                          [content._id]: !previous[content._id]
                        }))
                      }
                    >
                      💬 Comments ({approvedComments.length})
                    </button>
                  </div>

                  {/* Comment Section */}
                  {showComments[content._id] && (
                    <div className="comment-section">
                      <h4>Viewer Comments</h4>

                      {approvedComments.length > 0 ? (
                        approvedComments.map((comment, index) => (
                          <div
                            className="comment"
                            key={comment._id || index}
                          >
                            <strong>{comment.name}</strong>
                            <p>{comment.message}</p>
                          </div>
                        ))
                      ) : (
                        <p>
                          No approved comments yet.
                          Be the first to comment!
                        </p>
                      )}

                      {/* Add Comment Form */}
                      <form
                        onSubmit={(e) =>
                          handleComment(e, content._id)
                        }
                      >
                        <input
                          type="text"
                          name="name"
                          placeholder="Your name"
                          required
                        />

                        <textarea
                          name="message"
                          placeholder="Write your comment..."
                          required
                        />

                        <button type="submit">
                          Post Comment
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No content found. Try another search.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 CreatorHub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
