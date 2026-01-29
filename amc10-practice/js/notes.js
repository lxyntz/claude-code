/**
 * AMC10 Math Mastery System - Notes Module
 * Handles global notes functionality
 */

const Notes = {
    // Storage key
    STORAGE_KEY: 'amc10_notes',

    // Current note being edited
    currentNoteId: null,

    /**
     * Initialize notes module
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // New note button
        document.getElementById('btn-new-note')?.addEventListener('click', () => this.newNote());

        // Save note button
        document.getElementById('btn-save-note')?.addEventListener('click', () => this.saveNote());

        // Cancel note button
        document.getElementById('btn-cancel-note')?.addEventListener('click', () => this.cancelNote());

        // Save quick note button
        document.getElementById('btn-save-quick-note')?.addEventListener('click', () => this.saveQuickNote());

        // Search notes
        document.getElementById('notes-search')?.addEventListener('input', (e) => this.searchNotes(e.target.value));

        // Note content preview (live LaTeX)
        document.getElementById('note-content')?.addEventListener('input', (e) => this.updatePreview(e.target.value));
    },

    /**
     * Get all notes for current student
     */
    getNotes() {
        const notes = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const studentId = Auth.getStudentId();
        return notes[studentId] || [];
    },

    /**
     * Save notes for current student
     */
    saveNotes(notesList) {
        const notes = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const studentId = Auth.getStudentId();
        notes[studentId] = notesList;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    },

    /**
     * Create new note
     */
    newNote() {
        this.currentNoteId = null;
        document.getElementById('note-title').value = '';
        document.getElementById('note-tags').value = '';
        document.getElementById('note-content').value = '';
        document.getElementById('note-preview').innerHTML = '';

        // Focus on title
        document.getElementById('note-title')?.focus();
    },

    /**
     * Load note for editing
     */
    loadNote(noteId) {
        const notes = this.getNotes();
        const note = notes.find(n => n.id === noteId);

        if (!note) return;

        this.currentNoteId = noteId;
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-tags').value = note.tags.join(', ');
        document.getElementById('note-content').value = note.content;
        this.updatePreview(note.content);

        // Highlight in list
        document.querySelectorAll('.note-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === noteId);
        });
    },

    /**
     * Save current note
     */
    saveNote() {
        const title = document.getElementById('note-title')?.value.trim();
        const tagsInput = document.getElementById('note-tags')?.value.trim();
        const content = document.getElementById('note-content')?.value.trim();

        if (!title || !content) {
            alert('请填写标题和内容 Please fill in title and content');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
        const notes = this.getNotes();

        if (this.currentNoteId) {
            // Update existing note
            const index = notes.findIndex(n => n.id === this.currentNoteId);
            if (index !== -1) {
                notes[index] = {
                    ...notes[index],
                    title,
                    tags,
                    content,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Create new note
            const newNote = {
                id: 'note_' + Date.now(),
                title,
                tags,
                content,
                questionId: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            notes.unshift(newNote);
            this.currentNoteId = newNote.id;
        }

        this.saveNotes(notes);
        this.renderNotesList();

        // Show success feedback
        const saveBtn = document.getElementById('btn-save-note');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '已保存 ✓';
            saveBtn.disabled = true;
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 1500);
        }
    },

    /**
     * Cancel editing
     */
    cancelNote() {
        this.currentNoteId = null;
        document.getElementById('note-title').value = '';
        document.getElementById('note-tags').value = '';
        document.getElementById('note-content').value = '';
        document.getElementById('note-preview').innerHTML = '';

        // Remove active state from list
        document.querySelectorAll('.note-list-item').forEach(item => {
            item.classList.remove('active');
        });
    },

    /**
     * Save quick note (from question)
     */
    saveQuickNote() {
        const modal = document.getElementById('quick-note-modal');
        const content = document.getElementById('quick-note-content')?.value.trim();
        const questionId = modal?.dataset.questionId;

        if (!content) {
            alert('请填写笔记内容 Please enter note content');
            return;
        }

        const notes = this.getNotes();
        const question = QuestionBank.find(q => q.id === questionId);

        const newNote = {
            id: 'note_' + Date.now(),
            title: question ? `${question.year} AMC10${question.contest} #${question.number}` : '快速笔记',
            tags: question ? question.topics : [],
            content,
            questionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        notes.unshift(newNote);
        this.saveNotes(notes);

        // Close modal
        modal?.classList.remove('active');
        document.getElementById('quick-note-content').value = '';

        // Show success
        alert('笔记已保存 Note saved!');
    },

    /**
     * Delete note
     */
    deleteNote(noteId) {
        if (!confirm('确定删除这条笔记吗？Delete this note?')) return;

        const notes = this.getNotes();
        const filtered = notes.filter(n => n.id !== noteId);
        this.saveNotes(filtered);

        if (this.currentNoteId === noteId) {
            this.cancelNote();
        }

        this.renderNotesList();
    },

    /**
     * Search notes
     */
    searchNotes(query) {
        const notes = this.getNotes();
        const q = query.toLowerCase();

        const filtered = q ? notes.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.tags.some(t => t.toLowerCase().includes(q))
        ) : notes;

        this.renderNotesList(filtered);
    },

    /**
     * Update preview with LaTeX rendering
     */
    updatePreview(content) {
        const previewEl = document.getElementById('note-preview');
        if (!previewEl) return;

        // Simple markdown-like formatting
        let html = content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        previewEl.innerHTML = html;

        // Render LaTeX
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(previewEl, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ],
                throwOnError: false
            });
        }
    },

    /**
     * Render notes list
     */
    renderNotesList(notesList = null) {
        const listEl = document.getElementById('notes-list');
        if (!listEl) return;

        const notes = notesList || this.getNotes();

        if (notes.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <p>暂无笔记</p>
                    <p style="font-size: 0.875rem;">No notes yet</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = notes.map(note => {
            const date = new Date(note.updatedAt);
            const dateStr = date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="note-list-item ${note.id === this.currentNoteId ? 'active' : ''}" data-id="${note.id}">
                    <div class="note-list-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-list-date">${dateStr}</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('.note-list-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.id);
            });
        });
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Get notes count for display
     */
    getNotesCount() {
        return this.getNotes().length;
    },

    /**
     * Export notes as text
     */
    exportNotes() {
        const notes = this.getNotes();
        if (notes.length === 0) {
            alert('没有笔记可导出 No notes to export');
            return;
        }

        let content = '# AMC10 学习笔记\n\n';
        content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        content += '---\n\n';

        notes.forEach((note, index) => {
            content += `## ${index + 1}. ${note.title}\n\n`;
            content += `标签: ${note.tags.join(', ') || '无'}\n`;
            content += `创建时间: ${new Date(note.createdAt).toLocaleString('zh-CN')}\n\n`;
            content += `${note.content}\n\n`;
            content += '---\n\n';
        });

        // Download as file
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AMC10_Notes_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Notes.init();
});
