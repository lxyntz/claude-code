/**
 * AMC10 Math Mastery System - Practice Module
 * Handles question display, timing, answer checking, and practice flow
 */

const Practice = {
    // Current practice state
    state: {
        questions: [],
        currentIndex: 0,
        selectedAnswer: null,
        answered: false,
        mode: 'practice', // 'practice', 'timed', 'exam'
        timerInterval: null,
        timeElapsed: 0,
        timeLimit: 0, // 0 means no limit
        results: [],
        startTime: null
    },

    // Storage key for practice history
    HISTORY_KEY: 'amc10_practice_history',
    WRONG_KEY: 'amc10_wrong_questions',

    /**
     * Initialize practice module
     */
    init() {
        this.bindEvents();
        this.loadFilters();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Start practice button
        document.getElementById('btn-start-practice')?.addEventListener('click', () => this.startPractice());

        // Navigation buttons
        document.getElementById('btn-prev-question')?.addEventListener('click', () => this.prevQuestion());
        document.getElementById('btn-next-question')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('btn-submit-answer')?.addEventListener('click', () => this.submitAnswer());

        // Add note button
        document.getElementById('btn-add-note')?.addEventListener('click', () => this.openQuickNote());
    },

    /**
     * Load filter options
     */
    loadFilters() {
        // Load years
        const yearSelect = document.getElementById('filter-year');
        if (yearSelect) {
            const years = getYears();
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
        }

        // Load topics
        const topicSelect = document.getElementById('filter-topic');
        if (topicSelect) {
            Object.keys(Topics).forEach(mainTopic => {
                const topic = Topics[mainTopic];
                const optgroup = document.createElement('optgroup');
                optgroup.label = `${topic.name} (${topic.nameZh})`;

                Object.keys(topic.subtopics).forEach(subId => {
                    const sub = topic.subtopics[subId];
                    const option = document.createElement('option');
                    option.value = subId;
                    option.textContent = `${sub.name} (${sub.nameZh})`;
                    optgroup.appendChild(option);
                });

                topicSelect.appendChild(optgroup);
            });
        }
    },

    /**
     * Start a practice session
     */
    startPractice() {
        // Get filter values
        const year = document.getElementById('filter-year')?.value || 'all';
        const contest = document.getElementById('filter-contest')?.value || 'all';
        const difficulty = document.getElementById('filter-difficulty')?.value || 'all';
        const topic = document.getElementById('filter-topic')?.value || 'all';
        const mode = document.getElementById('filter-mode')?.value || 'practice';

        // Filter questions
        let questions = [...QuestionBank];

        if (year !== 'all') {
            questions = questions.filter(q => q.year === parseInt(year));
        }
        if (contest !== 'all') {
            questions = questions.filter(q => q.contest === contest);
        }
        if (difficulty !== 'all') {
            questions = questions.filter(q => q.difficulty === difficulty);
        }
        if (topic !== 'all') {
            questions = questions.filter(q => q.topics.includes(topic));
        }

        if (questions.length === 0) {
            alert('没有找到符合条件的题目 No questions found matching your criteria');
            return;
        }

        // Shuffle for variety (except in exam mode)
        if (mode !== 'exam') {
            questions = this.shuffle(questions);
        }

        // Initialize state
        this.state = {
            questions,
            currentIndex: 0,
            selectedAnswer: null,
            answered: false,
            mode,
            timerInterval: null,
            timeElapsed: 0,
            timeLimit: mode === 'exam' ? 75 * 60 : 0, // 75 minutes for exam
            results: [],
            startTime: new Date()
        };

        // Show practice area
        document.getElementById('practice-area')?.classList.remove('hidden');
        document.querySelector('.filter-panel')?.classList.add('hidden');

        // Start timer
        this.startTimer();

        // Display first question
        this.displayQuestion();
    },

    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        const updateTimer = () => {
            this.state.timeElapsed++;
            const display = document.getElementById('timer-value');
            if (display) {
                if (this.state.mode === 'exam' && this.state.timeLimit > 0) {
                    const remaining = this.state.timeLimit - this.state.timeElapsed;
                    if (remaining <= 0) {
                        this.endPractice();
                        return;
                    }
                    display.textContent = this.formatTime(remaining);
                    // Warning when 5 minutes left
                    if (remaining === 300) {
                        display.style.color = '#ef4444';
                    }
                } else {
                    display.textContent = this.formatTime(this.state.timeElapsed);
                }
            }
        };

        this.state.timerInterval = setInterval(updateTimer, 1000);
    },

    /**
     * Format seconds to MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },

    /**
     * Display current question
     */
    displayQuestion() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        // Update progress
        document.getElementById('question-progress').textContent =
            `${this.state.currentIndex + 1} / ${this.state.questions.length}`;
        document.getElementById('question-source').textContent =
            `${q.year} AMC10${q.contest} #${q.number}`;

        // Update tags
        const tagsContainer = document.getElementById('question-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';

            // Difficulty tag
            const diffTag = document.createElement('span');
            diffTag.className = `tag tag-difficulty-${q.difficulty}`;
            diffTag.textContent = q.difficulty === 'easy' ? '简单 Easy' :
                                  q.difficulty === 'medium' ? '中等 Medium' : '困难 Hard';
            tagsContainer.appendChild(diffTag);

            // Topic tags
            q.topics.forEach(topic => {
                const topicTag = document.createElement('span');
                topicTag.className = 'tag tag-topic';
                topicTag.textContent = getTopicName(topic);
                tagsContainer.appendChild(topicTag);
            });
        }

        // Question text (English)
        const enText = document.getElementById('question-text-en');
        if (enText) {
            enText.innerHTML = q.question.en;
        }

        // Question text (Chinese)
        const zhText = document.getElementById('question-text-zh');
        if (zhText) {
            zhText.innerHTML = q.question.zh;
        }

        // Choices
        const choicesContainer = document.getElementById('choices-container');
        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            const labels = ['A', 'B', 'C', 'D', 'E'];

            q.choices.forEach((choice, index) => {
                const div = document.createElement('div');
                div.className = 'choice-item';
                div.dataset.choice = labels[index];

                div.innerHTML = `
                    <span class="choice-label">${labels[index]}</span>
                    <span class="choice-text">${choice}</span>
                `;

                div.addEventListener('click', () => this.selectChoice(labels[index]));
                choicesContainer.appendChild(div);
            });
        }

        // Reset state for new question
        this.state.selectedAnswer = null;
        this.state.answered = false;

        // Update navigation buttons
        document.getElementById('btn-prev-question').disabled = this.state.currentIndex === 0;
        document.getElementById('btn-submit-answer').disabled = false;
        document.getElementById('btn-submit-answer').textContent = '提交答案 Submit';

        // Hide analysis panel
        document.getElementById('analysis-panel')?.classList.add('hidden');

        // Render LaTeX
        this.renderMath();
    },

    /**
     * Render LaTeX math
     */
    renderMath() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false
            });
        }
    },

    /**
     * Select a choice
     */
    selectChoice(choice) {
        if (this.state.answered) return;

        this.state.selectedAnswer = choice;

        // Update UI
        document.querySelectorAll('.choice-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.choice === choice) {
                item.classList.add('selected');
            }
        });
    },

    /**
     * Submit answer
     */
    submitAnswer() {
        if (this.state.answered) {
            // Already answered, move to next
            this.nextQuestion();
            return;
        }

        if (!this.state.selectedAnswer) {
            alert('请选择一个答案 Please select an answer');
            return;
        }

        const q = this.state.questions[this.state.currentIndex];
        const isCorrect = this.state.selectedAnswer === q.answer;

        // Record result
        this.state.results.push({
            questionId: q.id,
            selected: this.state.selectedAnswer,
            correct: q.answer,
            isCorrect,
            timeSpent: this.state.timeElapsed
        });

        // Mark as answered
        this.state.answered = true;

        // Update UI
        document.querySelectorAll('.choice-item').forEach(item => {
            item.classList.add('disabled');
            if (item.dataset.choice === q.answer) {
                item.classList.add('correct');
            } else if (item.dataset.choice === this.state.selectedAnswer && !isCorrect) {
                item.classList.add('incorrect');
            }
        });

        // Show result
        const analysisPanel = document.getElementById('analysis-panel');
        const resultTitle = document.getElementById('analysis-result-title');
        const resultIcon = document.getElementById('analysis-result-icon');

        if (isCorrect) {
            resultTitle.textContent = '回答正确！Correct!';
            resultTitle.className = 'text-success';
            resultIcon.textContent = '✓';
            resultIcon.className = 'analysis-result-icon text-success';
        } else {
            resultTitle.textContent = '回答错误 Incorrect';
            resultTitle.className = 'text-danger';
            resultIcon.textContent = '✗';
            resultIcon.className = 'analysis-result-icon text-danger';

            // Save to wrong questions
            this.saveWrongQuestion(q);
        }

        // Show solution
        Analysis.showSolution(q);

        // Show analysis panel
        analysisPanel?.classList.remove('hidden');

        // Update button
        const submitBtn = document.getElementById('btn-submit-answer');
        if (submitBtn) {
            submitBtn.textContent = this.state.currentIndex < this.state.questions.length - 1
                ? '下一题 Next' : '完成 Finish';
        }

        // Check badges
        Badges.checkAfterAnswer(isCorrect, q);

        // Render math in solution
        this.renderMath();

        // Save history
        this.saveHistory(q, isCorrect);
    },

    /**
     * Save wrong question
     */
    saveWrongQuestion(question) {
        let wrongQuestions = JSON.parse(localStorage.getItem(this.WRONG_KEY) || '{}');
        const studentId = Auth.getStudentId();

        if (!wrongQuestions[studentId]) {
            wrongQuestions[studentId] = {};
        }

        if (!wrongQuestions[studentId][question.id]) {
            wrongQuestions[studentId][question.id] = {
                questionId: question.id,
                firstWrong: new Date().toISOString(),
                attempts: 0,
                lastAttempt: null,
                status: 'unmastered' // unmastered, reviewing, mastered
            };
        }

        wrongQuestions[studentId][question.id].attempts++;
        wrongQuestions[studentId][question.id].lastAttempt = new Date().toISOString();

        localStorage.setItem(this.WRONG_KEY, JSON.stringify(wrongQuestions));
    },

    /**
     * Save practice history
     */
    saveHistory(question, isCorrect) {
        let history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '{}');
        const studentId = Auth.getStudentId();

        if (!history[studentId]) {
            history[studentId] = [];
        }

        history[studentId].push({
            questionId: question.id,
            year: question.year,
            contest: question.contest,
            number: question.number,
            topics: question.topics,
            difficulty: question.difficulty,
            isCorrect,
            timestamp: new Date().toISOString()
        });

        // Keep only last 1000 records
        if (history[studentId].length > 1000) {
            history[studentId] = history[studentId].slice(-1000);
        }

        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    },

    /**
     * Go to previous question
     */
    prevQuestion() {
        if (this.state.currentIndex > 0) {
            this.state.currentIndex--;
            this.displayQuestion();
        }
    },

    /**
     * Go to next question
     */
    nextQuestion() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.state.currentIndex++;
            this.displayQuestion();
        } else {
            this.endPractice();
        }
    },

    /**
     * End practice session
     */
    endPractice() {
        // Stop timer
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        // Calculate stats
        const totalQuestions = this.state.results.length;
        const correctCount = this.state.results.filter(r => r.isCorrect).length;
        const accuracy = totalQuestions > 0 ? Math.round(correctCount / totalQuestions * 100) : 0;

        // Show summary
        alert(`练习完成！Practice Complete!\n\n` +
              `题目数 Questions: ${totalQuestions}\n` +
              `正确数 Correct: ${correctCount}\n` +
              `正确率 Accuracy: ${accuracy}%\n` +
              `用时 Time: ${this.formatTime(this.state.timeElapsed)}`);

        // Check badges for completion
        Badges.checkAfterPractice(this.state);

        // Reset UI
        document.getElementById('practice-area')?.classList.add('hidden');
        document.querySelector('.filter-panel')?.classList.remove('hidden');

        // Update stats displays
        this.updateStatsDisplay();
    },

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '{}');
        const studentId = Auth.getStudentId();
        const studentHistory = history[studentId] || [];

        // Total questions
        document.getElementById('stat-total-questions').textContent = studentHistory.length;

        // Accuracy
        if (studentHistory.length > 0) {
            const correct = studentHistory.filter(h => h.isCorrect).length;
            const accuracy = Math.round(correct / studentHistory.length * 100);
            document.getElementById('stat-accuracy').textContent = accuracy + '%';
        }

        // Streak (consecutive days)
        const streak = this.calculateStreak(studentHistory);
        document.getElementById('stat-streak').textContent = streak;

        // Total time (estimated)
        const totalTime = Math.round(studentHistory.length * 3 / 60); // Assume 3 min per question
        document.getElementById('stat-time').textContent = totalTime + 'h';
    },

    /**
     * Calculate practice streak
     */
    calculateStreak(history) {
        if (history.length === 0) return 0;

        const dates = [...new Set(history.map(h => h.timestamp.split('T')[0]))].sort().reverse();
        let streak = 0;
        let today = new Date().toISOString().split('T')[0];

        for (const date of dates) {
            const expected = new Date(today);
            expected.setDate(expected.getDate() - streak);
            const expectedStr = expected.toISOString().split('T')[0];

            if (date === expectedStr) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * Open quick note for current question
     */
    openQuickNote() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        const modal = document.getElementById('quick-note-modal');
        const questionText = document.getElementById('quick-note-question');

        if (questionText) {
            questionText.textContent = `${q.year} AMC10${q.contest} #${q.number}`;
        }

        modal?.classList.add('active');

        // Store current question id for saving
        modal.dataset.questionId = q.id;
    },

    /**
     * Get wrong questions for review
     */
    getWrongQuestions() {
        const wrongQuestions = JSON.parse(localStorage.getItem(this.WRONG_KEY) || '{}');
        const studentId = Auth.getStudentId();
        const studentWrong = wrongQuestions[studentId] || {};

        return Object.values(studentWrong).map(wrong => {
            const question = QuestionBank.find(q => q.id === wrong.questionId);
            return { ...wrong, question };
        }).filter(w => w.question);
    },

    /**
     * Get practice history
     */
    getHistory() {
        const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '{}');
        const studentId = Auth.getStudentId();
        return history[studentId] || [];
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Practice.init();
});
