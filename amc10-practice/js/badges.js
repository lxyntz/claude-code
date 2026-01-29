/**
 * AMC10 Math Mastery System - Badges Module
 * Handles achievement badges and rewards
 */

const Badges = {
    // Storage key
    STORAGE_KEY: 'amc10_badges',

    // Badge definitions
    definitions: [
        // Beginner badges
        {
            id: 'first_step',
            name: 'First Step',
            nameZh: '初试锋芒',
            icon: '🎯',
            description: 'Complete your first question',
            descZh: '完成第一道题',
            condition: (stats) => stats.totalQuestions >= 1
        },
        {
            id: 'getting_started',
            name: 'Getting Started',
            nameZh: '入门学徒',
            icon: '📚',
            description: 'Complete 10 questions',
            descZh: '完成10道题',
            condition: (stats) => stats.totalQuestions >= 10
        },
        {
            id: 'warm_up',
            name: 'Warmed Up',
            nameZh: '热身完成',
            icon: '🔥',
            description: 'Complete 50 questions',
            descZh: '完成50道题',
            condition: (stats) => stats.totalQuestions >= 50
        },

        // Achievement badges
        {
            id: 'century',
            name: 'Century',
            nameZh: '百题斩',
            icon: '💯',
            description: 'Complete 100 questions',
            descZh: '完成100道题',
            condition: (stats) => stats.totalQuestions >= 100
        },
        {
            id: 'marathon',
            name: 'Marathon',
            nameZh: '马拉松',
            icon: '🏃',
            description: 'Complete 500 questions',
            descZh: '完成500道题',
            condition: (stats) => stats.totalQuestions >= 500
        },

        // Accuracy badges
        {
            id: 'sharp_mind',
            name: 'Sharp Mind',
            nameZh: '头脑清晰',
            icon: '🧠',
            description: 'Get 5 correct answers in a row',
            descZh: '连续答对5题',
            condition: (stats) => stats.currentStreak >= 5
        },
        {
            id: 'unstoppable',
            name: 'Unstoppable',
            nameZh: '势不可挡',
            icon: '⚡',
            description: 'Get 10 correct answers in a row',
            descZh: '连续答对10题',
            condition: (stats) => stats.currentStreak >= 10
        },
        {
            id: 'perfectionist',
            name: 'Perfectionist',
            nameZh: '完美主义',
            icon: '✨',
            description: 'Achieve 100% accuracy in a session (min 10 questions)',
            descZh: '单次练习正确率100%（至少10题）',
            condition: (stats) => stats.sessionQuestions >= 10 && stats.sessionAccuracy === 100
        },
        {
            id: 'high_achiever',
            name: 'High Achiever',
            nameZh: '高分达人',
            icon: '🌟',
            description: 'Maintain 80%+ overall accuracy (min 50 questions)',
            descZh: '总正确率保持80%以上（至少50题）',
            condition: (stats) => stats.totalQuestions >= 50 && stats.overallAccuracy >= 80
        },

        // Difficulty badges
        {
            id: 'easy_master',
            name: 'Easy Master',
            nameZh: '基础扎实',
            icon: '🟢',
            description: 'Complete 20 easy questions with 90%+ accuracy',
            descZh: '完成20道简单题，正确率90%以上',
            condition: (stats) => stats.easyTotal >= 20 && stats.easyAccuracy >= 90
        },
        {
            id: 'medium_challenger',
            name: 'Medium Challenger',
            nameZh: '中流砥柱',
            icon: '🟡',
            description: 'Complete 20 medium questions with 70%+ accuracy',
            descZh: '完成20道中等题，正确率70%以上',
            condition: (stats) => stats.mediumTotal >= 20 && stats.mediumAccuracy >= 70
        },
        {
            id: 'hard_conqueror',
            name: 'Hard Conqueror',
            nameZh: '难题克星',
            icon: '🔴',
            description: 'Complete 10 hard questions with 50%+ accuracy',
            descZh: '完成10道困难题，正确率50%以上',
            condition: (stats) => stats.hardTotal >= 10 && stats.hardAccuracy >= 50
        },

        // Topic badges
        {
            id: 'algebra_ace',
            name: 'Algebra Ace',
            nameZh: '代数高手',
            icon: '➗',
            description: 'Complete 30 algebra questions with 80%+ accuracy',
            descZh: '完成30道代数题，正确率80%以上',
            condition: (stats) => stats.algebraTotal >= 30 && stats.algebraAccuracy >= 80
        },
        {
            id: 'geometry_guru',
            name: 'Geometry Guru',
            nameZh: '几何大师',
            icon: '📐',
            description: 'Complete 30 geometry questions with 80%+ accuracy',
            descZh: '完成30道几何题，正确率80%以上',
            condition: (stats) => stats.geometryTotal >= 30 && stats.geometryAccuracy >= 80
        },
        {
            id: 'number_ninja',
            name: 'Number Ninja',
            nameZh: '数论忍者',
            icon: '🔢',
            description: 'Complete 20 number theory questions with 70%+ accuracy',
            descZh: '完成20道数论题，正确率70%以上',
            condition: (stats) => stats.numberTheoryTotal >= 20 && stats.numberTheoryAccuracy >= 70
        },
        {
            id: 'combo_king',
            name: 'Combo King',
            nameZh: '组合之王',
            icon: '🎲',
            description: 'Complete 20 combinatorics questions with 70%+ accuracy',
            descZh: '完成20道组合题，正确率70%以上',
            condition: (stats) => stats.combinatoricsTotal >= 20 && stats.combinatoricsAccuracy >= 70
        },

        // Consistency badges
        {
            id: 'daily_learner',
            name: 'Daily Learner',
            nameZh: '每日精进',
            icon: '📅',
            description: 'Practice for 3 consecutive days',
            descZh: '连续练习3天',
            condition: (stats) => stats.dayStreak >= 3
        },
        {
            id: 'weekly_warrior',
            name: 'Weekly Warrior',
            nameZh: '周周不断',
            icon: '🗓️',
            description: 'Practice for 7 consecutive days',
            descZh: '连续练习7天',
            condition: (stats) => stats.dayStreak >= 7
        },
        {
            id: 'monthly_master',
            name: 'Monthly Master',
            nameZh: '月度达人',
            icon: '🏆',
            description: 'Practice for 30 consecutive days',
            descZh: '连续练习30天',
            condition: (stats) => stats.dayStreak >= 30
        },

        // Special badges
        {
            id: 'note_taker',
            name: 'Note Taker',
            nameZh: '勤做笔记',
            icon: '📝',
            description: 'Create 10 notes',
            descZh: '创建10条笔记',
            condition: (stats) => stats.notesCount >= 10
        },
        {
            id: 'reviewer',
            name: 'Reviewer',
            nameZh: '温故知新',
            icon: '🔄',
            description: 'Review and master 5 wrong questions',
            descZh: '复习并掌握5道错题',
            condition: (stats) => stats.masteredWrong >= 5
        },
        {
            id: 'all_rounder',
            name: 'All-Rounder',
            nameZh: '全面发展',
            icon: '🎭',
            description: 'Complete questions from all 4 main topics',
            descZh: '完成所有4个主要考点的题目',
            condition: (stats) =>
                stats.algebraTotal > 0 &&
                stats.geometryTotal > 0 &&
                stats.numberTheoryTotal > 0 &&
                stats.combinatoricsTotal > 0
        }
    ],

    /**
     * Initialize badges module
     */
    init() {
        // Nothing special needed
    },

    /**
     * Get earned badges for current student
     */
    getEarnedBadges() {
        const badges = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const studentId = Auth.getStudentId();
        return badges[studentId] || [];
    },

    /**
     * Save earned badge
     */
    earnBadge(badgeId) {
        const badges = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        const studentId = Auth.getStudentId();

        if (!badges[studentId]) {
            badges[studentId] = [];
        }

        if (!badges[studentId].includes(badgeId)) {
            badges[studentId].push(badgeId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(badges));
            return true;
        }
        return false;
    },

    /**
     * Calculate current stats for badge checking
     */
    calculateStats() {
        const history = Practice.getHistory();
        const wrongQuestions = Practice.getWrongQuestions();
        const notes = Notes.getNotes();

        // Basic stats
        const totalQuestions = history.length;
        const correctCount = history.filter(h => h.isCorrect).length;
        const overallAccuracy = totalQuestions > 0 ? Math.round(correctCount / totalQuestions * 100) : 0;

        // Difficulty stats
        const byDifficulty = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
        history.forEach(h => {
            if (byDifficulty[h.difficulty]) {
                byDifficulty[h.difficulty].total++;
                if (h.isCorrect) byDifficulty[h.difficulty].correct++;
            }
        });

        // Topic stats
        const byTopic = { algebra: { total: 0, correct: 0 }, geometry: { total: 0, correct: 0 },
                        'number-theory': { total: 0, correct: 0 }, combinatorics: { total: 0, correct: 0 } };
        history.forEach(h => {
            h.topics.forEach(topic => {
                // Find main category
                for (const main of ['algebra', 'geometry', 'number-theory', 'combinatorics']) {
                    if (topic === main || (Topics[main] && Topics[main].subtopics[topic])) {
                        byTopic[main].total++;
                        if (h.isCorrect) byTopic[main].correct++;
                        break;
                    }
                }
            });
        });

        // Current streak (consecutive correct)
        let currentStreak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].isCorrect) currentStreak++;
            else break;
        }

        // Day streak
        const dayStreak = Practice.state ? Practice.calculateStreak(history) : 0;

        // Mastered wrong questions
        const masteredWrong = wrongQuestions.filter(w => w.status === 'mastered').length;

        return {
            totalQuestions,
            overallAccuracy,
            currentStreak,
            dayStreak,
            easyTotal: byDifficulty.easy.total,
            easyAccuracy: byDifficulty.easy.total > 0 ? Math.round(byDifficulty.easy.correct / byDifficulty.easy.total * 100) : 0,
            mediumTotal: byDifficulty.medium.total,
            mediumAccuracy: byDifficulty.medium.total > 0 ? Math.round(byDifficulty.medium.correct / byDifficulty.medium.total * 100) : 0,
            hardTotal: byDifficulty.hard.total,
            hardAccuracy: byDifficulty.hard.total > 0 ? Math.round(byDifficulty.hard.correct / byDifficulty.hard.total * 100) : 0,
            algebraTotal: byTopic.algebra.total,
            algebraAccuracy: byTopic.algebra.total > 0 ? Math.round(byTopic.algebra.correct / byTopic.algebra.total * 100) : 0,
            geometryTotal: byTopic.geometry.total,
            geometryAccuracy: byTopic.geometry.total > 0 ? Math.round(byTopic.geometry.correct / byTopic.geometry.total * 100) : 0,
            numberTheoryTotal: byTopic['number-theory'].total,
            numberTheoryAccuracy: byTopic['number-theory'].total > 0 ? Math.round(byTopic['number-theory'].correct / byTopic['number-theory'].total * 100) : 0,
            combinatoricsTotal: byTopic.combinatorics.total,
            combinatoricsAccuracy: byTopic.combinatorics.total > 0 ? Math.round(byTopic.combinatorics.correct / byTopic.combinatorics.total * 100) : 0,
            notesCount: notes.length,
            masteredWrong,
            sessionQuestions: Practice.state ? Practice.state.results.length : 0,
            sessionAccuracy: Practice.state && Practice.state.results.length > 0 ?
                Math.round(Practice.state.results.filter(r => r.isCorrect).length / Practice.state.results.length * 100) : 0
        };
    },

    /**
     * Check badges after answering a question
     */
    checkAfterAnswer(isCorrect, question) {
        this.checkAllBadges();
    },

    /**
     * Check badges after completing practice
     */
    checkAfterPractice(practiceState) {
        this.checkAllBadges();
    },

    /**
     * Check all badges and award new ones
     */
    checkAllBadges() {
        const stats = this.calculateStats();
        const earnedIds = this.getEarnedBadges();
        const newBadges = [];

        this.definitions.forEach(badge => {
            if (!earnedIds.includes(badge.id)) {
                try {
                    if (badge.condition(stats)) {
                        if (this.earnBadge(badge.id)) {
                            newBadges.push(badge);
                        }
                    }
                } catch (e) {
                    console.error('Error checking badge:', badge.id, e);
                }
            }
        });

        // Show toast for new badges
        if (newBadges.length > 0) {
            this.showBadgeToast(newBadges[0]);
        }

        return newBadges;
    },

    /**
     * Show badge earned toast
     */
    showBadgeToast(badge) {
        const toast = document.getElementById('badge-toast');
        const nameEl = document.getElementById('badge-toast-name');

        if (toast && nameEl) {
            nameEl.textContent = `${badge.icon} ${badge.nameZh} ${badge.name}`;
            toast.classList.remove('hidden');

            setTimeout(() => {
                toast.classList.add('hidden');
            }, 4000);
        }
    },

    /**
     * Render badges grid
     */
    renderBadgesGrid() {
        const gridEl = document.getElementById('badges-grid');
        if (!gridEl) return;

        const earnedIds = this.getEarnedBadges();

        gridEl.innerHTML = this.definitions.map(badge => {
            const isEarned = earnedIds.includes(badge.id);
            return `
                <div class="badge-item ${isEarned ? 'earned' : 'locked'}">
                    <span class="badge-icon">${badge.icon}</span>
                    <span class="badge-name">${badge.nameZh}</span>
                    <span class="badge-desc">${isEarned ? badge.name : badge.descZh}</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Get badges summary for display
     */
    getBadgesSummary() {
        const earnedIds = this.getEarnedBadges();
        return {
            earned: earnedIds.length,
            total: this.definitions.length,
            recent: this.definitions.filter(b => earnedIds.includes(b.id)).slice(-3)
        };
    }
};
