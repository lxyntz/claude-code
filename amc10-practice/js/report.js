/**
 * AMC10 Math Mastery System - Report Module
 * Handles growth reports and visualizations
 */

const Report = {
    // Current period
    currentPeriod: 'week',

    /**
     * Initialize report module
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPeriod = btn.dataset.period;
                this.renderReport();
            });
        });

        // Export button
        document.getElementById('btn-export-report')?.addEventListener('click', () => this.exportReport());
    },

    /**
     * Get history filtered by period
     */
    getFilteredHistory() {
        const history = Practice.getHistory();
        const now = new Date();

        let startDate;
        switch (this.currentPeriod) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'all':
            default:
                return history;
        }

        return history.filter(h => new Date(h.timestamp) >= startDate);
    },

    /**
     * Render the complete report
     */
    renderReport() {
        const history = this.getFilteredHistory();

        this.renderSummaryStats(history);
        this.renderAbilityChart(history);
        this.renderTopicsChart(history);
        this.renderSuggestions(history);
    },

    /**
     * Render summary statistics
     */
    renderSummaryStats(history) {
        const el = document.getElementById('report-summary-stats');
        if (!el) return;

        const total = history.length;
        const correct = history.filter(h => h.isCorrect).length;
        const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;

        // Calculate by difficulty
        const byDiff = { easy: { t: 0, c: 0 }, medium: { t: 0, c: 0 }, hard: { t: 0, c: 0 } };
        history.forEach(h => {
            if (byDiff[h.difficulty]) {
                byDiff[h.difficulty].t++;
                if (h.isCorrect) byDiff[h.difficulty].c++;
            }
        });

        // Calculate practice days
        const uniqueDays = new Set(history.map(h => h.timestamp.split('T')[0])).size;

        // Calculate avg per day
        const avgPerDay = uniqueDays > 0 ? Math.round(total / uniqueDays * 10) / 10 : 0;

        const periodText = this.currentPeriod === 'week' ? '本周' :
                          this.currentPeriod === 'month' ? '本月' : '累计';

        el.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">${periodText}做题</p>
                    <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">${total} 题</p>
                </div>
                <div>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">正确率</p>
                    <p style="font-size: 1.5rem; font-weight: bold; color: ${accuracy >= 70 ? 'var(--success)' : accuracy >= 50 ? 'var(--warning)' : 'var(--danger)'};">${accuracy}%</p>
                </div>
                <div>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">练习天数</p>
                    <p style="font-size: 1.5rem; font-weight: bold;">${uniqueDays} 天</p>
                </div>
                <div>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">日均做题</p>
                    <p style="font-size: 1.5rem; font-weight: bold;">${avgPerDay} 题</p>
                </div>
            </div>

            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">难度分布</p>
                <div style="display: flex; gap: 1rem; font-size: 0.875rem;">
                    <span style="color: var(--success);">🟢 简单: ${byDiff.easy.t}题 (${byDiff.easy.t > 0 ? Math.round(byDiff.easy.c / byDiff.easy.t * 100) : 0}%)</span>
                    <span style="color: var(--warning);">🟡 中等: ${byDiff.medium.t}题 (${byDiff.medium.t > 0 ? Math.round(byDiff.medium.c / byDiff.medium.t * 100) : 0}%)</span>
                    <span style="color: var(--danger);">🔴 困难: ${byDiff.hard.t}题 (${byDiff.hard.t > 0 ? Math.round(byDiff.hard.c / byDiff.hard.t * 100) : 0}%)</span>
                </div>
            </div>
        `;
    },

    /**
     * Render ability trend chart
     */
    renderAbilityChart(history) {
        const ctx = document.getElementById('report-ability-chart');
        if (!ctx) return;

        // Group by date and calculate rolling accuracy
        const byDate = {};
        history.forEach(h => {
            const date = h.timestamp.split('T')[0];
            if (!byDate[date]) byDate[date] = { correct: 0, total: 0 };
            byDate[date].total++;
            if (h.isCorrect) byDate[date].correct++;
        });

        const dates = Object.keys(byDate).sort();
        const labels = dates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        });

        // Calculate cumulative accuracy
        let cumCorrect = 0, cumTotal = 0;
        const cumulativeAccuracy = dates.map(d => {
            cumCorrect += byDate[d].correct;
            cumTotal += byDate[d].total;
            return Math.round(cumCorrect / cumTotal * 100);
        });

        // Daily accuracy
        const dailyAccuracy = dates.map(d =>
            Math.round(byDate[d].correct / byDate[d].total * 100)
        );

        if (window.abilityChart) {
            window.abilityChart.destroy();
        }

        window.abilityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '累计正确率',
                        data: cumulativeAccuracy,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: '当日正确率',
                        data: dailyAccuracy,
                        borderColor: '#22c55e',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: '正确率 %'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    /**
     * Render topics mastery chart
     */
    renderTopicsChart(history) {
        const ctx = document.getElementById('report-topics-chart');
        if (!ctx) return;

        // Calculate by topic
        const byTopic = {};
        Object.keys(Topics).forEach(main => {
            byTopic[main] = { total: 0, correct: 0 };
        });

        history.forEach(h => {
            h.topics.forEach(topic => {
                for (const main of Object.keys(Topics)) {
                    if (topic === main || (Topics[main].subtopics && Topics[main].subtopics[topic])) {
                        byTopic[main].total++;
                        if (h.isCorrect) byTopic[main].correct++;
                        break;
                    }
                }
            });
        });

        const labels = Object.keys(Topics).map(t => Topics[t].nameZh);
        const accuracies = Object.keys(Topics).map(t =>
            byTopic[t].total > 0 ? Math.round(byTopic[t].correct / byTopic[t].total * 100) : 0
        );
        const counts = Object.keys(Topics).map(t => byTopic[t].total);

        if (window.topicsChart) {
            window.topicsChart.destroy();
        }

        window.topicsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: '正确率 %',
                        data: accuracies,
                        backgroundColor: accuracies.map(a =>
                            a >= 80 ? 'rgba(34, 197, 94, 0.7)' :
                            a >= 60 ? 'rgba(245, 158, 11, 0.7)' :
                            'rgba(239, 68, 68, 0.7)'
                        ),
                        yAxisID: 'y'
                    },
                    {
                        label: '题目数',
                        data: counts,
                        type: 'line',
                        borderColor: '#64748b',
                        backgroundColor: 'transparent',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
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
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    /**
     * Render learning suggestions
     */
    renderSuggestions(history) {
        const el = document.getElementById('report-suggestions');
        if (!el) return;

        const suggestions = [];

        // Calculate stats
        const total = history.length;
        const correct = history.filter(h => h.isCorrect).length;
        const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;

        // Suggestion based on overall accuracy
        if (total < 10) {
            suggestions.push({
                icon: '📚',
                text: '建议每天做5-10道题，建立稳定的练习习惯',
                textEn: 'Try to practice 5-10 questions daily to build a consistent routine'
            });
        } else if (accuracy < 50) {
            suggestions.push({
                icon: '🎯',
                text: '正确率偏低，建议从简单题开始，打好基础',
                textEn: 'Focus on easier problems first to build a strong foundation'
            });
        } else if (accuracy < 70) {
            suggestions.push({
                icon: '📈',
                text: '进步空间大！建议仔细阅读错题解析，理解每一步',
                textEn: 'Review wrong answers carefully and understand each step'
            });
        } else {
            suggestions.push({
                icon: '⭐',
                text: '表现优秀！可以挑战更多中等和困难题目',
                textEn: 'Great job! Try more medium and hard problems'
            });
        }

        // Topic-specific suggestions
        const weaknesses = Analysis.getWeaknesses();
        if (weaknesses.length > 0) {
            const weakestTopic = weaknesses[0];
            suggestions.push({
                icon: '🔍',
                text: `${weakestTopic.nameZh}（${weakestTopic.name}）是薄弱考点，建议加强练习`,
                textEn: `Focus more on ${weakestTopic.name} to improve`
            });
        }

        // Practice frequency suggestion
        const uniqueDays = new Set(history.map(h => h.timestamp.split('T')[0])).size;
        const avgPerDay = uniqueDays > 0 ? Math.round(total / uniqueDays) : 0;

        if (avgPerDay > 20) {
            suggestions.push({
                icon: '⚖️',
                text: '练习量很大！注意劳逸结合，保持效率',
                textEn: 'High volume! Remember to balance practice with rest'
            });
        } else if (avgPerDay < 3 && total > 0) {
            suggestions.push({
                icon: '💪',
                text: '建议增加每日练习量，持续积累',
                textEn: 'Try to practice more questions each day'
            });
        }

        // Wrong question review
        const wrongQuestions = Practice.getWrongQuestions();
        const unreviewedWrong = wrongQuestions.filter(w => w.status === 'unmastered').length;
        if (unreviewedWrong > 5) {
            suggestions.push({
                icon: '🔄',
                text: `有 ${unreviewedWrong} 道错题待复习，记得定期回顾`,
                textEn: `You have ${unreviewedWrong} wrong answers to review`
            });
        }

        el.innerHTML = suggestions.map(s => `
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius);">
                <span style="font-size: 1.25rem;">${s.icon}</span>
                <div>
                    <p style="margin-bottom: 0.25rem;">${s.text}</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">${s.textEn}</p>
                </div>
            </div>
        `).join('');
    },

    /**
     * Export report as PDF or image
     */
    exportReport() {
        // For simplicity, we'll just print the report modal
        const reportContent = document.getElementById('report-content');
        if (!reportContent) return;

        // Create a printable version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>AMC10 成长报告 - Growth Report</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem; }
                    h1 { color: #4f46e5; }
                    .section { margin: 2rem 0; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; }
                </style>
            </head>
            <body>
                <h1>📊 AMC10 成长报告</h1>
                <p>学生: ${Auth.getStudentName()} | 导出时间: ${new Date().toLocaleString('zh-CN')}</p>
                <hr>
                ${reportContent.innerHTML}
                <footer style="margin-top: 2rem; text-align: center; color: #64748b;">
                    AMC10 数学精进系统 | Math Mastery System
                </footer>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Report.init();
});
