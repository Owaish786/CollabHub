"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { HardDrive, UploadCloud, File, Image as ImageIcon, FileText, Download, Loader2, FileIcon, FileArchive, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "@/components/providers/SocketProvider";

type FileData = {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: { _id: string; name: string; image?: string };
  createdAt: string;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />;
  if (mimeType.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (mimeType.includes("zip") || mimeType.includes("tar")) return <FileArchive className="h-8 w-8 text-yellow-500" />;
  return <FileIcon className="h-8 w-8 text-slate-500" />;
};

export default function DrivePage() {
  const params = useParams<{ workspaceId: string }>();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket, isConnected } = useSocket();

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${params.workspaceId}/files`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.workspaceId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    
    const handleNewFile = (newFile: FileData) => {
      setFiles((prev) => [newFile, ...prev]);
    };

    socket.on("new-file", handleNewFile);
    return () => {
      socket.off("new-file", handleNewFile);
    };
  }, [socket, isConnected]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`/api/workspaces/${params.workspaceId}/files`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setFiles((prev) => [data.data, ...prev]);
        if (socket && isConnected) {
          socket.emit("file-uploaded", {
            workspaceId: params.workspaceId,
            file: data.data
          });
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredFiles = files.filter(f => f.originalName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-indigo-600" />
            CollabHub Drive
          </h1>
          <p className="text-sm text-slate-500 mt-1">Securely store and share files with your team.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload File"}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
              <UploadCloud className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Your Drive is empty</h3>
            <p className="text-slate-500 mt-1 mb-6 max-w-sm">Upload images, documents, and archives to share them with your team.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Upload your first file
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div key={file._id} className="group relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden">
                <div className="flex items-center justify-center h-40 bg-slate-50 border-b border-slate-100 relative">
                   {file.mimeType.startsWith('image/') ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img src={`/api/files/${file._id}`} alt={file.originalName} className="h-full w-full object-cover" />
                   ) : (
                     getFileIcon(file.mimeType)
                   )}
                   
                   {/* Hover overlay with download action */}
                   <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                     <a 
                       href={`/api/files/${file._id}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-md"
                       title="View"
                     >
                       <File className="h-5 w-5" />
                     </a>
                     <a 
                       href={`/api/files/${file._id}?download=true`}
                       download
                       className="flex items-center justify-center h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-md"
                       title="Download"
                     >
                       <Download className="h-5 w-5" />
                     </a>
                   </div>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700 flex items-center justify-center shrink-0">
                         {file.uploadedBy?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-[100px]">{file.uploadedBy?.name ?? "Unknown"}</p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-right">
                    {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
