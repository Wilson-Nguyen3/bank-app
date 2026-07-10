document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let loggedInUser = null;
    let selectedRole = 'EMPLOYEE'; // Default role for login screen

    // Selectors
    const authCard = document.getElementById('auth-card');
    const dashboardView = document.getElementById('dashboard-view');
    const tabEmployee = document.getElementById('tab-employee');
    const tabEmployer = document.getElementById('tab-employer');
    const loginForm = document.getElementById('login-form');
    const loginIdInput = document.getElementById('login-id');
    const loginPasswordInput = document.getElementById('login-password');
    const authMessage = document.getElementById('auth-message');
    const formTitle = document.getElementById('form-title');

    // Dashboard Selectors
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayRole = document.getElementById('user-display-role');
    const btnSignout = document.getElementById('btn-signout');
    const employeePanel = document.getElementById('employee-panel');
    const employerPanel = document.getElementById('employer-panel');

    // Employee Panel Selectors
    const empProfileName = document.getElementById('emp-profile-name');
    const empProfileId = document.getElementById('emp-profile-id');
    const empProfilePayroll = document.getElementById('emp-profile-payroll');

    // Employer Panel Forms & Messages
    const registerForm = document.getElementById('register-form');
    const regNameInput = document.getElementById('reg-name');
    const regIdInput = document.getElementById('reg-id');
    const regRoleSelect = document.getElementById('reg-role');
    const regPayrollInput = document.getElementById('reg-dob-payroll');
    const regPasswordInput = document.getElementById('reg-password');
    const registerMessage = document.getElementById('register-message');

    const payrollForm = document.getElementById('payroll-form');
    const payrollTargetSelect = document.getElementById('payroll-target-id');
    const payrollNewAmountInput = document.getElementById('payroll-new-amount');
    const payrollMessage = document.getElementById('payroll-message');

    const rosterTbody = document.getElementById('roster-tbody');
    const rosterCountSpan = document.getElementById('roster-count');

    // Tab Switch Logic
    tabEmployee.addEventListener('click', () => {
        selectedRole = 'EMPLOYEE';
        tabEmployee.classList.add('active');
        tabEmployer.classList.remove('active');
        formTitle.textContent = 'Employee Access';
        loginIdInput.placeholder = 'e.g. EMP101';
        clearMessage(authMessage);
    });

    tabEmployer.addEventListener('click', () => {
        selectedRole = 'EMPLOYER';
        tabEmployer.classList.add('active');
        tabEmployee.classList.remove('active');
        formTitle.textContent = 'Employer Access';
        loginIdInput.placeholder = 'e.g. MGR101';
        clearMessage(authMessage);
    });

    // Public Roster Count Update
    async function updatePublicRosterCount() {
        try {
            const response = await fetch('/api/public/roster-count');
            if (response.ok) {
                const count = await response.text();
                rosterCountSpan.textContent = count;
            }
        } catch (error) {
            console.error('Error fetching roster count:', error);
        }
    }

    // Handle Login Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(authMessage);

        const id = loginIdInput.value.trim();
        const password = loginPasswordInput.value;

        try {
            const params = new URLSearchParams();
            params.append('id', id);
            params.append('password', password);

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            if (response.ok) {
                const user = await response.json();
                
                // Safety check: ensure role matches the selected tab role
                if (user.role !== selectedRole) {
                    showMessage(authMessage, `Error: Unauthorized. Please log in using the correct role tab.`, 'error');
                    return;
                }

                loggedInUser = user;
                loginForm.reset();
                showDashboard();
            } else {
                const errorText = await response.text();
                showMessage(authMessage, errorText.startsWith('Error:') ? errorText : 'Error: Invalid login credentials.', 'error');
            }
        } catch (error) {
            showMessage(authMessage, 'Error: Failed to connect to authentication server.', 'error');
            console.error('Login error:', error);
        }
    });

    // Switch to Dashboard Mode
    function showDashboard() {
        authCard.style.display = 'none';
        dashboardView.style.display = 'block';

        userDisplayName.textContent = loggedInUser.name;
        userDisplayRole.textContent = loggedInUser.role;

        if (loggedInUser.role === 'EMPLOYEE') {
            employeePanel.style.display = 'block';
            employerPanel.style.display = 'none';
            loadEmployeeProfile();
        } else if (loggedInUser.role === 'EMPLOYER') {
            employerPanel.style.display = 'block';
            employeePanel.style.display = 'none';
            loadEmployerDashboard();
        }
        updatePublicRosterCount();
    }

    // Load Employee Profile details
    function loadEmployeeProfile() {
        empProfileName.textContent = loggedInUser.name;
        empProfileId.textContent = loggedInUser.userId;
        empProfilePayroll.textContent = formatCurrency(loggedInUser.payroll);
    }

    // Load Employer data: employee table and dropdowns
    async function loadEmployerDashboard() {
        try {
            const response = await fetch(`/api/employees?requesterId=${encodeURIComponent(loggedInUser.userId)}`);
            if (response.ok) {
                const employees = await response.json();
                
                // Populate Table
                if (employees.length === 0) {
                    rosterTbody.innerHTML = `
                        <tr>
                            <td colspan="4" class="empty-state">No users registered yet.</td>
                        </tr>
                    `;
                } else {
                    rosterTbody.innerHTML = employees.map(emp => {
                        return `
                            <tr>
                                <td>${escapeHtml(emp.name)}</td>
                                <td><code>${escapeHtml(emp.userId)}</code></td>
                                <td><span class="user-role-badge" style="font-size:0.75rem;">${emp.role}</span></td>
                                <td style="font-weight: 600; color: #4ade80;">${formatCurrency(emp.payroll)}</td>
                            </tr>
                        `;
                    }).join('');
                }

                // Populate Dropdown for Payroll Modifier
                const currentSelection = payrollTargetSelect.value;
                payrollTargetSelect.innerHTML = '<option value="">-- Choose Employee --</option>';
                employees.forEach(emp => {
                    if (emp.role === 'EMPLOYEE') {
                        const option = document.createElement('option');
                        option.value = emp.userId;
                        option.textContent = `${emp.name} (${emp.userId})`;
                        payrollTargetSelect.appendChild(option);
                    }
                });
                payrollTargetSelect.value = currentSelection;

            } else {
                console.error('Failed to load roster directory');
            }
        } catch (error) {
            console.error('Error loading roster directory:', error);
        }
    }

    // Handle Employer registering new user
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(registerMessage);

        const name = regNameInput.value.trim();
        const id = regIdInput.value.trim();
        const role = regRoleSelect.value;
        const payroll = regPayrollInput.value ? parseFloat(regPayrollInput.value) : 0.0;
        const password = regPasswordInput.value;

        try {
            const params = new URLSearchParams();
            params.append('name', name);
            params.append('id', id);
            params.append('role', role);
            params.append('password', password);
            params.append('payroll', payroll);

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const resultText = await response.text();

            if (response.ok && !resultText.startsWith('Error:')) {
                showMessage(registerMessage, 'User onboarded successfully!', 'success');
                registerForm.reset();
                loadEmployerDashboard();
            } else {
                showMessage(registerMessage, resultText, 'error');
            }
        } catch (error) {
            showMessage(registerMessage, 'Error: Failed to register user.', 'error');
            console.error('Registration error:', error);
        }
    });

    // Handle Employer modifying employee payroll
    payrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessage(payrollMessage);

        const targetId = payrollTargetSelect.value;
        const newPayroll = parseFloat(payrollNewAmountInput.value);

        if (!targetId) {
            showMessage(payrollMessage, 'Error: Please select a valid employee.', 'error');
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('requesterId', loggedInUser.userId);
            params.append('targetId', targetId);
            params.append('newPayroll', newPayroll);

            const response = await fetch('/api/payroll/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            });

            const resultText = await response.text();

            if (response.ok && !resultText.startsWith('Error:')) {
                showMessage(payrollMessage, 'Payroll updated successfully!', 'success');
                payrollForm.reset();
                loadEmployerDashboard();
            } else {
                showMessage(payrollMessage, resultText, 'error');
            }
        } catch (error) {
            showMessage(payrollMessage, 'Error: Failed to update payroll.', 'error');
            console.error('Payroll update error:', error);
        }
    });

    // Handle Sign Out
    btnSignout.addEventListener('click', () => {
        loggedInUser = null;
        dashboardView.style.display = 'none';
        authCard.style.display = 'block';
        clearMessage(authMessage);
        updatePublicRosterCount();
    });

    // Helpers
    function showMessage(element, text, type) {
        element.textContent = text;
        element.className = `message-container ${type}`;
        element.style.display = 'block';
    }

    function clearMessage(element) {
        element.className = 'message-container';
        element.style.display = 'none';
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initial Roster Count loading on page entry
    updatePublicRosterCount();
});
