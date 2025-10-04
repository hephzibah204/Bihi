import React from 'react';

// This is a mock Rich Text Editor that uses a simple textarea.
// In a real application, this would be a wrapper around a library like Quill, Tiptap, or Slate.
const RichTextEditor = ({ value, onChange }) => {
    return (
        <textarea
            className="input-field w-full"
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your content here..."
        />
    );
};

export default RichTextEditor;
