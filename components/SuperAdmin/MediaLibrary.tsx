import React, { useState, useEffect, useRef } from 'react';

interface MediaFile {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'video' | 'document' | 'other';
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
    folder?: string;
    tags?: string[];
}

interface Folder {
    id: string;
    name: string;
    itemCount: number;
}

const MediaLibrary = () => {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [folders, setFolders] = useState<Folder[]>([
        { id: 'all', name: 'All Files', itemCount: 0 },
        { id: 'images', name: 'Images', itemCount: 0 },
        { id: 'documents', name: 'Documents', itemCount: 0 },
        { id: 'videos', name: 'Videos', itemCount: 0 }
    ]);
    const [activeFolder, setActiveFolder] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock data
    useEffect(() => {
        const mockFiles: MediaFile[] = [
            {
                id: '1',
                name: 'school-logo.png',
                url: 'https://via.placeholder.com/300x200',
                type: 'image',
                size: 245000,
                uploadedAt: new Date(Date.now() - 86400000),
                uploadedBy: 'Admin',
                folder: 'images',
                tags: ['logo', 'branding']
            },
            {
                id: '2',
                name: 'student-handbook.pdf',
                url: '',
                type: 'document',
                size: 1024000,
                uploadedAt: new Date(Date.now() - 172800000),
                uploadedBy: 'Admin',
                folder: 'documents'
            },
            {
                id: '3',
                name: 'welcome-video.mp4',
                url: '',
                type: 'video',
                size: 5240000,
                uploadedAt: new Date(Date.now() - 259200000),
                uploadedBy: 'Admin',
                folder: 'videos'
            }
        ];
        setFiles(mockFiles);

        // Update folder counts
        setFolders(prev => prev.map(folder => ({
            ...folder,
            itemCount: folder.id === 'all' ? mockFiles.length :
                       mockFiles.filter(f => f.folder === folder.id).length
        })));
    }, []);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles) return;

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload
        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            
            // Simulate progress
            await new Promise(resolve => setTimeout(resolve, 500));
            setUploadProgress(((i + 1) / uploadedFiles.length) * 100);

            // Determine file type
            let type: MediaFile['type'] = 'other';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.includes('pdf') || file.type.includes('document')) type = 'document';

            const newFile: MediaFile = {
                id: Date.now().toString() + i,
                name: file.name,
                url: URL.createObjectURL(file),
                type,
                size: file.size,
                uploadedAt: new Date(),
                uploadedBy: 'Admin',
                folder: type === 'image' ? 'images' : type === 'document' ? 'documents' : type === 'video' ? 'videos' : 'all'
            };

            setFiles(prev => [newFile, ...prev]);
        }

        setIsUploading(false);
        setUploadProgress(0);
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Delete ${selectedFiles.length} file(s)?`)) {
            setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
            setSelectedFiles([]);
        }
    };

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev => 
            prev.includes(fileId) 
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: MediaFile['type']) => {
        switch (type) {
            case 'image': return '🖼️';
            case 'video': return '🎥';
            case 'document': return '📄';
            default: return '📎';
        }
    };

    const filteredFiles = files.filter(file => {
        const matchesFolder = activeFolder === 'all' || file.folder === activeFolder;
        const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFolder && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Media Library</h1>
                <p className="text-green-100">Manage all your images, documents, and media files</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleFileSelect}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="mr-2">⬆️</span>
                            Upload Files
                        </button>
                        {selectedFiles.length > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <span className="mr-2">🗑️</span>
                                Delete ({selectedFiles.length})
                            </button>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
                            >
                                ⊞
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600">Uploading...</span>
                            <span className="text-sm font-medium text-blue-600">{uploadProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
            />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Folders */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4">Folders</h3>
                        <div className="space-y-1">
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => setActiveFolder(folder.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                        activeFolder === folder.id
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>📁 {folder.name}</span>
                                        <span className="text-sm text-slate-500">{folder.itemCount}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Files Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-96">
                        {filteredFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                <span className="text-6xl mb-4">📁</span>
                                <p className="text-lg font-medium">No files found</p>
                                <p className="text-sm">Upload some files to get started</p>
                            </div>
                        ) : (
                            <div>
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredFiles.map(file => (
                                            <div
                                                key={file.id}
                                                className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                                                    selectedFiles.includes(file.id)
                                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                                        : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                                onClick={() => toggleFileSelection(file.id)}
                                            >
                                                {file.type === 'image' ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.name}
                                                        className="w-full h-32 object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                                                        <span className="text-4xl">{getFileIcon(file.type)}</span>
                                                    </div>
                                                )}
                                                <div className="p-2">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                                </div>
                                                {selectedFiles.includes(file.id) && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-xs">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredFiles.map(file => (
                                            <div
                                                key={file.id}
                                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedFiles.includes(file.id)
                                                        ? 'bg-blue-50 border-2 border-blue-500'
                                                        : 'hover:bg-slate-50 border border-slate-200'
                                                }`}
                                                onClick={() => toggleFileSelection(file.id)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{file.name}</p>
                                                        <p className="text-sm text-slate-500">
                                                            {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                                                        View
                                                    </button>
                                                    <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaLibrary;