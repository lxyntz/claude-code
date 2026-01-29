/**
 * AMC10 Math Mastery System - Authentication Module
 * Handles student login with teacher-provided access codes
 */

const Auth = {
    // Storage keys
    STORAGE_KEY: 'amc10_session',

    // Access codes (teacher can modify these)
    // Format: { studentId: { name, codes: [valid_codes], expiry } }
    accessCodes: {
        'student001': {
            name: '张小明',
            codes: ['AMC2024A', 'MATH001'],
            expiry: null // null means no expiry
        },
        'student002': {
            name: 'Li Wei',
            codes: ['AMC2024B', 'MATH002'],
            expiry: null
        },
        'demo': {
            name: 'Demo Student',
            codes: ['demo123', 'test'],
            expiry: null
        }
    },

    // Dynamic code generator (based on date)
    generateDailyCode() {
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        // Simple hash for demo purposes
        const hash = this.simpleHash(dateStr + 'AMC10MASTER');
        return 'D' + hash.toString(36).toUpperCase().slice(0, 6);
    },

    // Simple hash function for code generation
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    /**
     * Validate student credentials
     * @param {string} studentId - Student ID
     * @param {string} accessCode - Access code
     * @returns {object} - { success: boolean, message: string, studentName?: string }
     */
    validate(studentId, accessCode) {
        const id = studentId.toLowerCase().trim();
        const code = accessCode.trim();

        // Check if student exists
        const student = this.accessCodes[id];
        if (!student) {
            return {
                success: false,
                message: '账号不存在 Student ID not found'
            };
        }

        // Check expiry
        if (student.expiry && new Date() > new Date(student.expiry)) {
            return {
                success: false,
                message: '账号已过期，请联系老师 Account expired'
            };
        }

        // Check access code
        const dailyCode = this.generateDailyCode();
        const validCodes = [...student.codes, dailyCode, 'MASTER2024']; // MASTER2024 is teacher override

        if (!validCodes.includes(code)) {
            return {
                success: false,
                message: '密码错误 Invalid access code'
            };
        }

        return {
            success: true,
            message: '登录成功 Login successful',
            studentName: student.name,
            studentId: id
        };
    },

    /**
     * Save session to localStorage
     * @param {object} sessionData - Session data to save
     */
    saveSession(sessionData) {
        const session = {
            ...sessionData,
            loginTime: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    },

    /**
     * Get current session
     * @returns {object|null} - Session data or null
     */
    getSession() {
        const sessionStr = localStorage.getItem(this.STORAGE_KEY);
        if (!sessionStr) return null;

        try {
            const session = JSON.parse(sessionStr);
            // Update last active time
            session.lastActive = new Date().toISOString();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
            return session;
        } catch (e) {
            console.error('Failed to parse session:', e);
            return null;
        }
    },

    /**
     * Clear session (logout)
     */
    clearSession() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.getSession() !== null;
    },

    /**
     * Get student name from session
     * @returns {string}
     */
    getStudentName() {
        const session = this.getSession();
        return session ? session.studentName : '';
    },

    /**
     * Get student ID from session
     * @returns {string}
     */
    getStudentId() {
        const session = this.getSession();
        return session ? session.studentId : '';
    }
};

// Freeze the Auth object to prevent modifications
Object.freeze(Auth.accessCodes);
