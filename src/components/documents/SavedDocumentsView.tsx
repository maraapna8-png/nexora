import React, { useRef, useState } from 'react';
import {
  FileText,
  Trash2,
  Sparkles,
  UploadCloud,
  Search,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Loader2,
  Calendar,
  HardDrive
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { SavedDocument } from '../../types';

interface SavedDocumentsViewProps {
  onOpenChat: () => void;
}

export const SavedDocumentsView: React.FC<SavedDocumentsViewProps> = ({ onOpenChat }) => {
  const {
    savedDocuments,
    deleteDocumentFromLibrary,
    analyzeDocumentInChat,
    addAttachmentFiles
  } = useChat();

  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredDocs = savedDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    doc.extractedTextPreview.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      await addAttachmentFiles(e.target.files);
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleAction = async (docRecord: SavedDocument, type: 'summary' | 'mcq' | 'notes' | 'open') => {
    await analyzeDocumentInChat(docRecord, type);
    onOpenChat();
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 max-w-6xl mx-auto w-full">
      {/* Hidden file uploader */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
        className="hidden"
      />

      {/* Top Banner & Upload action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-amber-400" />
            <span>Saved Documents & Files</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your uploaded PDFs, research materials, and saved AI reports for instant analysis.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing PDF...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Upload New PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search saved documents by title or content..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredDocs.length}</span> documents
        </div>
      </div>

      {/* Documents Grid / Empty State */}
      <div className="mt-6">
        {filteredDocs.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No saved documents yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Upload a PDF document or save an AI analysis response to build your persistent knowledge base.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors"
            >
              Upload your first document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-800 text-amber-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-100 truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Document ready for analysis
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteDocumentFromLibrary(doc.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preview Snippet */}
                  <p className="text-[11px] text-slate-400 line-clamp-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 mb-3 font-mono">
                    {doc.extractedTextPreview || 'No text preview available.'}
                  </p>

                  {/* Metadata pills */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    {doc.chunkCount > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {doc.chunkCount} chunks
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick AI Actions for this Document */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleAction(doc, 'summary')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                    title="Summarize document"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Summary</span>
                  </button>

                  <button
                    onClick={() => handleAction(doc, 'mcq')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-violet-600/30 text-slate-300 hover:text-violet-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                    title="Generate MCQs"
                  >
                    <HelpCircle className="w-3 h-3 text-violet-400" />
                    <span>MCQs</span>
                  </button>

                  <button
                    onClick={() => handleAction(doc, 'notes')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                    title="Create study notes"
                  >
                    <BookOpen className="w-3 h-3 text-emerald-400" />
                    <span>Notes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
