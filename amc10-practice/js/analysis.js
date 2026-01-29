/**
 * AMC10 Math Mastery System - Analysis Module
 * Handles solution display, weakness diagnosis, and recommendations
 */

const Analysis = {
    // Storage key for topic stats
    STATS_KEY: 'amc10_topic_stats',

    /**
     * Show detailed solution for a question
     * @param {Object} question - The question object
     */
    showSolution(question) {
        // Solution content
        const solutionEl = document.getElementById('solution-content');
        if (solutionEl) {
            // Show both English and Chinese solutions
            solutionEl.innerHTML = `
                <div class="solution-en">
                    ${this.formatSolution(question.solution.en)}
                </div>
                <div class="solution-zh" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                    <strong style="color: var(--text-muted);">中文解析：</strong>
                    ${this.formatSolution(question.solution.zh)}
                </div>
            `;
        }

        // Key concepts
        const conceptsEl = document.getElementById('concepts-list');
        if (conceptsEl && question.concepts) {
            conceptsEl.innerHTML = question.concepts.map(concept => {
                const name = this.formatConceptName(concept);
                return `<span class="concept-tag">${name}</span>`;
            }).join('');
        }

        // Math terms
        const termsEl = document.getElementById('terms-list');
        if (termsEl && question.terms) {
            termsEl.innerHTML = question.terms.map(termId => {
                const term = getTermDefinition(termId);
                return `
                    <div class="term-item">
                        <strong>${term.en}</strong>
                        <span class="term-zh">${term.zh}</span>
                        <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">${term.def}</p>
                    </div>
                `;
            }).join('');
        }

        // Similar problems
        const similarEl = document.getElementById('similar-problems');
        if (similarEl && question.similar) {
            const similarQuestions = question.similar.map(id => {
                return QuestionBank.find(q => q.id === id);
            }).filter(q => q);

            if (similarQuestions.length > 0) {
                similarEl.innerHTML = similarQuestions.map(q => `
                    <div class="similar-item" data-id="${q.id}">
                        <strong>${q.year} AMC10${q.contest} #${q.number}</strong>
                        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
                            ${q.topics.map(t => getTopicName(t)).join(', ')}
                        </p>
                    </div>
                `).join('');

                // Add click handlers for similar problems
                similarEl.querySelectorAll('.similar-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = item.dataset.id;
                        this.showQuestionPreview(id);
                    });
                });
            } else {
                similarEl.innerHTML = '<p class="text-muted">暂无相似题目</p>';
            }
        }
    },

    /**
     * Format solution text with proper structure
     */
    formatSolution(text) {
        if (!text) return '';

        // Convert markdown-style bold to HTML
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert step markers
        formatted = formatted.replace(/^(Step \d+:|第.+步[：:])/gm, '<p class="step"><strong>$1</strong></p>');

        // Convert line breaks to paragraphs
        formatted = formatted.split('\n\n').map(p => {
            if (p.trim().startsWith('<p class="step">')) return p;
            if (p.trim().startsWith('$$')) return p;
            return `<p>${p}</p>`;
        }).join('');

        return formatted;
    },

    /**
     * Format concept name for display
     */
    formatConceptName(concept) {
        return concept.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    },

    /**
     * Show question preview modal
     */
    showQuestionPreview(questionId) {
        const question = QuestionBank.find(q => q.id === questionId);
        if (!question) return;

        alert(`${question.year} AMC10${question.contest} #${question.number}\n\n${question.question.en.substring(0, 200)}...`);
    },

    /**
     * Calculate topic mastery statistics
     */
    calculateTopicStats() {
        const history = Practice.getHistory();
        const stats = {};

        // Initialize all topics
        Object.keys(Topics).forEach(main => {
            stats[main] = { correct: 0, total: 0, subtopics: {} };
            Object.keys(Topics[main].subtopics).forEach(sub => {
                stats[main].subtopics[sub] = { correct: 0, total: 0 };
            });
        });

        // Aggregate from history
        history.forEach(record => {
            record.topics.forEach(topic => {
                // Find main category
                let mainCategory = null;
                for (const main of Object.keys(Topics)) {
                    if (Topics[main].subtopics[topic]) {
                        mainCategory = main;
                        break;
                    }
                    if (main === topic) {
                        mainCategory = main;
                        break;
                    }
                }

                if (mainCategory) {
                    stats[mainCategory].total++;
                    if (record.isCorrect) stats[mainCategory].correct++;

                    if (stats[mainCategory].subtopics[topic]) {
                        stats[mainCategory].subtopics[topic].total++;
                        if (record.isCorrect) stats[mainCategory].subtopics[topic].correct++;
                    }
                }
            });
        });

        return stats;
    },

    /**
     * Get weakness areas (topics with low accuracy)
     */
    getWeaknesses() {
        const stats = this.calculateTopicStats();
        const weaknesses = [];

        Object.keys(stats).forEach(main => {
            const mainStat = stats[main];
            if (mainStat.total >= 3) {
                const accuracy = mainStat.total > 0 ? mainStat.correct / mainStat.total : 0;
                if (accuracy < 0.6) {
                    weaknesses.push({
                        topic: main,
                        name: Topics[main].name,
                        nameZh: Topics[main].nameZh,
                        accuracy: accuracy,
                        total: mainStat.total
                    });
                }
            }

            // Check subtopics
            Object.keys(mainStat.subtopics).forEach(sub => {
                const subStat = mainStat.subtopics[sub];
                if (subStat.total >= 2) {
                    const accuracy = subStat.total > 0 ? subStat.correct / subStat.total : 0;
                    if (accuracy < 0.5) {
                        const subTopic = Topics[main].subtopics[sub];
                        weaknesses.push({
                            topic: sub,
                            name: subTopic.name,
                            nameZh: subTopic.nameZh,
                            accuracy: accuracy,
                            total: subStat.total,
                            parent: main
                        });
                    }
                }
            });
        });

        // Sort by accuracy (lowest first)
        return weaknesses.sort((a, b) => a.accuracy - b.accuracy);
    },

    /**
     * Get recommended questions based on weaknesses
     */
    getRecommendedQuestions(limit = 5) {
        const weaknesses = this.getWeaknesses();
        const wrongQuestions = Practice.getWrongQuestions();
        const history = Practice.getHistory();
        const doneIds = new Set(history.map(h => h.questionId));

        let recommended = [];

        // First, add unmastered wrong questions
        wrongQuestions
            .filter(w => w.status !== 'mastered')
            .slice(0, Math.ceil(limit / 2))
            .forEach(w => {
                recommended.push({
                    question: w.question,
                    reason: '错题复习 Review wrong answer'
                });
            });

        // Then, add questions from weak topics
        const weakTopics = weaknesses.slice(0, 3).map(w => w.topic);
        QuestionBank
            .filter(q => {
                if (doneIds.has(q.id)) return false;
                if (recommended.find(r => r.question.id === q.id)) return false;
                return q.topics.some(t => weakTopics.includes(t));
            })
            .slice(0, limit - recommended.length)
            .forEach(q => {
                recommended.push({
                    question: q,
                    reason: '强化薄弱考点 Strengthen weak areas'
                });
            });

        // Fill remaining with random questions not done
        if (recommended.length < limit) {
            QuestionBank
                .filter(q => !doneIds.has(q.id) && !recommended.find(r => r.question.id === q.id))
                .slice(0, limit - recommended.length)
                .forEach(q => {
                    recommended.push({
                        question: q,
                        reason: '拓展练习 Expand practice'
                    });
                });
        }

        return recommended;
    },

    /**
     * Render weakness dashboard
     */
    renderWeaknessDashboard() {
        const stats = this.calculateTopicStats();
        const ctx = document.getElementById('weakness-radar-chart');

        if (!ctx) return;

        // Prepare data for radar chart
        const labels = Object.keys(Topics).map(t => Topics[t].name);
        const data = Object.keys(Topics).map(t => {
            const stat = stats[t];
            return stat.total > 0 ? Math.round(stat.correct / stat.total * 100) : 50;
        });

        // Destroy existing chart if any
        if (window.weaknessChart) {
            window.weaknessChart.destroy();
        }

        window.weaknessChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: '掌握度 Mastery %',
                    data,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Render weakness details
        const detailsEl = document.getElementById('weakness-details');
        if (detailsEl) {
            const weaknesses = this.getWeaknesses();

            if (weaknesses.length === 0) {
                detailsEl.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <p style="font-size: 2rem;">🎉</p>
                        <p style="color: var(--text-muted);">表现很棒！暂未发现明显薄弱点</p>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">Great job! No significant weaknesses detected.</p>
                    </div>
                `;
            } else {
                detailsEl.innerHTML = `
                    <h4 style="margin-bottom: 1rem;">需要加强的考点 Areas to Improve</h4>
                    ${weaknesses.slice(0, 5).map(w => {
                        const percent = Math.round(w.accuracy * 100);
                        const color = percent < 30 ? '#ef4444' : percent < 50 ? '#f59e0b' : '#22c55e';
                        return `
                            <div class="weakness-item">
                                <span class="weakness-topic">${w.name}<br><small style="color: var(--text-muted);">${w.nameZh}</small></span>
                                <div class="weakness-bar">
                                    <div class="weakness-bar-fill" style="width: ${percent}%; background: ${color};"></div>
                                </div>
                                <span class="weakness-percent">${percent}%</span>
                            </div>
                        `;
                    }).join('')}
                `;
            }
        }

        // Render recommended questions
        const recommendedEl = document.getElementById('recommended-questions');
        if (recommendedEl) {
            const recommended = this.getRecommendedQuestions();

            if (recommended.length === 0) {
                recommendedEl.innerHTML = '<p class="text-muted">暂无推荐题目 No recommendations yet</p>';
            } else {
                recommendedEl.innerHTML = recommended.map(r => `
                    <div class="similar-item" style="margin-bottom: 0.5rem;" data-id="${r.question.id}">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong>${r.question.year} AMC10${r.question.contest} #${r.question.number}</strong>
                                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                                    ${r.question.topics.map(t => getTopicName(t)).join(', ')}
                                </p>
                            </div>
                            <span class="tag tag-difficulty-${r.question.difficulty}" style="font-size: 0.7rem;">
                                ${r.question.difficulty}
                            </span>
                        </div>
                        <p style="font-size: 0.75rem; color: var(--primary); margin-top: 0.25rem;">
                            ${r.reason}
                        </p>
                    </div>
                `).join('');
            }
        }
    },

    /**
     * Render review list (wrong questions)
     */
    renderReviewList(filter = 'all') {
        const reviewEl = document.getElementById('review-list');
        if (!reviewEl) return;

        let wrongQuestions = Practice.getWrongQuestions();

        // Apply filter
        if (filter !== 'all') {
            wrongQuestions = wrongQuestions.filter(w => w.status === filter);
        }

        if (wrongQuestions.length === 0) {
            reviewEl.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="font-size: 3rem;">📚</p>
                    <p style="color: var(--text-muted);">
                        ${filter === 'all' ? '暂无错题记录 No wrong answers yet' :
                          filter === 'mastered' ? '暂无已掌握的题目' : '暂无此状态的题目'}
                    </p>
                </div>
            `;
            return;
        }

        reviewEl.innerHTML = wrongQuestions.map(w => {
            const q = w.question;
            return `
                <div class="review-item" data-id="${q.id}">
                    <span class="review-status ${w.status}"></span>
                    <div class="review-info">
                        <div class="review-title">${q.year} AMC10${q.contest} #${q.number}</div>
                        <div class="review-meta">
                            ${q.topics.map(t => getTopicName(t)).join(', ')}
                        </div>
                    </div>
                    <div class="review-attempts">
                        尝试 ${w.attempts} 次
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Render history list
     */
    renderHistoryList() {
        const historyEl = document.getElementById('history-list');
        if (!historyEl) return;

        const history = Practice.getHistory();

        if (history.length === 0) {
            historyEl.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="font-size: 3rem;">📝</p>
                    <p style="color: var(--text-muted);">暂无练习记录 No practice history yet</p>
                </div>
            `;
            return;
        }

        // Show last 50 records
        const recent = history.slice(-50).reverse();

        historyEl.innerHTML = recent.map(h => {
            const date = new Date(h.timestamp);
            const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="history-item">
                    <span class="history-date">${dateStr} ${timeStr}</span>
                    <div class="history-content">
                        ${h.year} AMC10${h.contest} #${h.number}
                    </div>
                    <span class="history-result ${h.isCorrect ? 'correct' : 'incorrect'}">
                        ${h.isCorrect ? '✓ 正确' : '✗ 错误'}
                    </span>
                </div>
            `;
        }).join('');
    },

    /**
     * Render history chart
     */
    renderHistoryChart() {
        const ctx = document.getElementById('history-line-chart');
        if (!ctx) return;

        const history = Practice.getHistory();

        // Group by date
        const byDate = {};
        history.forEach(h => {
            const date = h.timestamp.split('T')[0];
            if (!byDate[date]) {
                byDate[date] = { correct: 0, total: 0 };
            }
            byDate[date].total++;
            if (h.isCorrect) byDate[date].correct++;
        });

        // Get last 14 days
        const dates = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const labels = dates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        });

        const accuracyData = dates.map(d => {
            const stat = byDate[d];
            if (!stat || stat.total === 0) return null;
            return Math.round(stat.correct / stat.total * 100);
        });

        const countData = dates.map(d => {
            const stat = byDate[d];
            return stat ? stat.total : 0;
        });

        // Destroy existing chart
        if (window.historyChart) {
            window.historyChart.destroy();
        }

        window.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '正确率 Accuracy %',
                        data: accuracyData,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: '做题数 Questions',
                        data: countData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: '正确率 %'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        title: {
                            display: true,
                            text: '题目数'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
};
