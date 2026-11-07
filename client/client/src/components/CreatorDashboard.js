

import React, { useState } from "react";

const API_URL = "http://localhost:5000/api/content";

function CreatorDashboard({
  contents,
  setContents,
  onBack,
  onLogout,
  token,
  creator
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Education");
  const [type, setType] = useState("Article");
  const [status, setStatus] = useState("Draft");
  const [editingId, setEditingId] = useState(null);

  const [thumbnail, setThumbnail] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [publicationDate, setPublicationDate] = useState("");

  // Headers for protected requests
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  });

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Education");
    setType("Article");
    setStatus("Draft");
    setThumbnail("");
    setMediaUrl("");
    setPublicationDate("");
    setEditingId(null);
  };

  // Add or update content
  const handleSubmit = async (e) => {
    e.preventDefault();

    const contentData = {
      title,
      description,
      category,
      type,
      status,
      thumbnail,
      mediaUrl,
      publicationDate: publicationDate || null
    };

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/${editingId}`
          : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: getHeaders(),
          body: JSON.stringify(contentData)
        }
      );

      const savedContent = await response.json();

      if (!response.ok) {
        throw new Error(
          savedContent.message || "Could not save content"
        );
      }

      if (editingId) {
        setContents((previous) =>
          previous.map((item) =>
            item._id === editingId ? savedContent : item
          )
        );

        alert("Content updated successfully!");
      } else {
        setContents((previous) => [savedContent, ...previous]);

        alert("Content added successfully!");
      }

      resetForm();

    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving content: " + error.message);
    }
  };

  // Format date for datetime-local input
  const formatDate = (date) => {
    if (!date) return "";

    const localDate = new Date(date);
    const timezoneOffset =
      localDate.getTimezoneOffset() * 60000;

    return new Date(localDate.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, 16);
  };

  // Edit content
  const handleEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setType(item.type || "Article");
    setStatus(item.status || "Draft");
    setThumbnail(item.thumbnail || "");
    setMediaUrl(item.mediaUrl || "");
    setPublicationDate(formatDate(item.publicationDate));

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Delete content
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this content?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not delete content"
        );
      }

      setContents((previous) =>
        previous.filter((item) => item._id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      alert("Content deleted successfully!");

    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message);
    }
  };

  // Update content in MongoDB
  const updateContent = async (id, changes) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(changes)
      });

      const updatedContent = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedContent.message || "Could not update content"
        );
      }

      setContents((previous) =>
        previous.map((item) =>
          item._id === id ? updatedContent : item
        )
      );

      return updatedContent;

    } catch (error) {
      console.error("Update error:", error);
      alert(error.message);
      return null;
    }
  };

  // Publish or unpublish content
  const handlePublish = async (item) => {
    const newStatus =
      item.status === "Published" ? "Draft" : "Published";

    const result = await updateContent(item._id, {
      status: newStatus
    });

    if (result) {
      alert(
        newStatus === "Published"
          ? "Content published successfully!"
          : "Content moved to drafts!"
      );
    }
  };

  // Approve or hide a comment
  const handleCommentStatus = async (
    contentId,
    commentIndex,
    newStatus
  ) => {
    const item = contents.find(
      (content) => content._id === contentId
    );

    if (!item) return;

    const updatedComments = (item.comments || []).map(
      (comment, index) =>
        index === commentIndex
          ? { ...comment, status: newStatus }
          : comment
    );

    await updateContent(contentId, {
      comments: updatedComments
    });
  };

  // Delete viewer comment
  const handleDeleteComment = async (
    contentId,
    commentIndex
  ) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    const item = contents.find(
      (content) => content._id === contentId
    );

    if (!item) return;

    const updatedComments = (item.comments || []).filter(
      (_, index) => index !== commentIndex
    );

    await updateContent(contentId, {
      comments: updatedComments
    });
  };

  // Dashboard statistics
  const published = contents.filter(
    (item) => item.status === "Published"
  ).length;

  const drafts = contents.filter(
    (item) => item.status === "Draft"
  ).length;

  const scheduled = contents.filter(
    (item) => item.status === "Scheduled"
  ).length;

  const totalViews = contents.reduce(
    (total, item) => total + (item.views || 0),
    0
  );

  const totalLikes = contents.reduce(
    (total, item) => total + (item.likes || 0),
    0
  );

  const totalComments = contents.reduce(
    (total, item) => total + (item.comments || []).length,
    0
  );

  return (
    <div className="dashboard">

      {/* Dashboard Header */}
      <header className="dashboard-header">

        <div>
          <h1>Creator Dashboard</h1>
          <p>Welcome, {creator?.name || "Creator"}!</p>
        </div>

        <div className="manage-buttons">
          <button onClick={onBack}>
            Back to Viewer Portal
          </button>

          <button onClick={onLogout}>
            Logout
          </button>
        </div>

      </header>

      {/* Dashboard Overview */}
      <h2>Dashboard Overview</h2>

      <div className="stats-container">

        <div className="stat-card">
          <h3>Total Content</h3>
          <p>{contents.length}</p>
        </div>

        <div className="stat-card">
          <h3>Published</h3>
          <p>{published}</p>
        </div>

        <div className="stat-card">
          <h3>Drafts</h3>
          <p>{drafts}</p>
        </div>

        <div className="stat-card">
          <h3>Scheduled</h3>
          <p>{scheduled}</p>
        </div>

        <div className="stat-card">
          <h3>Total Views</h3>
          <p>{totalViews}</p>
        </div>

        <div className="stat-card">
          <h3>Total Likes</h3>
          <p>{totalLikes}</p>
        </div>

        <div className="stat-card">
          <h3>Viewer Comments</h3>
          <p>{totalComments}</p>
        </div>

      </div>

      {/* Add or Edit Content */}
      <div className="dashboard-form">

        <h2>
          {editingId ? "Edit Content" : "Add New Content"}
        </h2>

        <form onSubmit={handleSubmit}>

          <label>Content Title</label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter content title"
            required
          />

          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter content description"
            required
          />

          <label>Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Education</option>
            <option>Technology</option>
            <option>Entertainment</option>
            <option>Lifestyle</option>
          </select>

          <label>Content Type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>Article</option>
            <option>Video</option>
            <option>Image</option>
            <option>Podcast</option>
          </select>

          <label>Thumbnail/Image URL</label>

          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            placeholder="Enter image URL"
          />

          <label>Media URL</label>

          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="Enter video, podcast or media link"
          />

          <label>Publication Date</label>

          <input
            type="datetime-local"
            value={publicationDate}
            onChange={(e) => setPublicationDate(e.target.value)}
          />

          <label>Publication Status</label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Draft</option>
            <option>Published</option>
            <option>Scheduled</option>
          </select>

          <button type="submit">
            {editingId ? "Update Content" : "Add Content"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel Editing
            </button>
          )}

        </form>

      </div>

      {/* Manage Content */}
      <div className="manage-content">

        <h2>Manage Your Content</h2>

        {contents.length > 0 ? (

          contents.map((item) => (

            <div className="manage-card" key={item._id}>

              <div>
                <h3>{item.title}</h3>

                <p>
                  {item.category} | {item.type || "Article"}
                </p>

                <p>Status: {item.status || "Draft"}</p>

                {item.publicationDate && (
                  <p>
                    Publication date:{" "}
                    {new Date(item.publicationDate).toLocaleString()}
                  </p>
                )}

                <p>
                  Views: {item.views || 0} | Likes: {item.likes || 0}
                </p>
              </div>

              <div className="manage-buttons">

                <button onClick={() => handleEdit(item)}>
                  Edit
                </button>

                <button onClick={() => handlePublish(item)}>
                  {item.status === "Published"
                    ? "Unpublish"
                    : "Publish"}
                </button>

                <button onClick={() => handleDelete(item._id)}>
                  Delete
                </button>

              </div>

            </div>

          ))

        ) : (

          <p>You have not added any content yet.</p>

        )}

      </div>

      {/* Comment Moderation */}
      <div className="manage-content">

        <h2>Viewer Comment Moderation</h2>

        {contents.map((item) => (

          (item.comments || []).length > 0 && (

            <div className="manage-card" key={item._id}>

              <h3>{item.title}</h3>

              {(item.comments || []).map((comment, index) => (

                <div className="comment-moderation" key={index}>

                  <p>
                    <strong>{comment.name || "Viewer"}:</strong>{" "}
                    {comment.message}
                  </p>

                  <p>
                    Status: {comment.status || "Approved"}
                  </p>

                  <div className="manage-buttons">

                    <button
                      onClick={() =>
                        handleCommentStatus(
                          item._id,
                          index,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        handleCommentStatus(
                          item._id,
                          index,
                          "Hidden"
                        )
                      }
                    >
                      Hide
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteComment(item._id, index)
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )

        ))}

        {totalComments === 0 && (
          <p>No viewer comments yet.</p>
        )}

      </div>

    </div>
  );
}

export default CreatorDashboard;
