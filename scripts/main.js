document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const themeToggle = document.getElementById('themeToggle');
    const previewBtn = document.getElementById('previewBtn');
    const resetBtn = document.getElementById('resetBtn');
    const addEducationBtn = document.getElementById('addEducation');
    const addExperienceBtn = document.getElementById('addExperience');
    const educationContainer = document.getElementById('education-container');
    const experienceContainer = document.getElementById('experience-container');

    // Modal Elements
    const modal = document.getElementById('previewModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalTemplates = modal.querySelectorAll('.template');
    const downloadBtn = document.getElementById('downloadBtn');
    const cvPreview = document.getElementById('cvPreview');

    // --- STATE ---
    let educationCount = 0;
    let experienceCount = 0;
    let dynamicStyleElement = null;

    // --- INITIALIZATION ---
    function initialize() {
        dynamicStyleElement = document.createElement('style');
        dynamicStyleElement.id = 'dynamic-template-style';
        document.head.appendChild(dynamicStyleElement);

        loadTheme();
        addEducationField();
        addExperienceField();
    }

    // --- THEME ---
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }

    // --- DYNAMIC FIELD GENERATION ---
    function generateExperienceCardContent(card) {
        const type = card.dataset.experienceType;
        const id = card.dataset.id;
        let fieldsHtml = '';

        if (type === 'company') {
            fieldsHtml = `
                <div class="form-group"><label for="position${id}">Position/Title</label><input type="text" id="position${id}" placeholder="Cybersecurity Analyst (Tier 2)"></div>
                <div class="form-group"><label for="company${id}">Company & Location</label><input type="text" id="company${id}" placeholder="Acme Corp, New York, NY"></div>
                <div class="form-group"><label for="expDates${id}">Dates</label><input type="text" id="expDates${id}" placeholder="MONTH 20XX - PRESENT"></div>
                <div class="form-group"><label for="expDesc${id}">Responsibilities (one per line)</label><textarea id="expDesc${id}" rows="4" placeholder="Reduced Mean Time to Detect (MTTD) by X%..."></textarea></div>
            `;
        } else { // type is 'other'
            fieldsHtml = `
                <div class="form-group"><label for="experienceTitle${id}">Title</label><input type="text" id="experienceTitle${id}" placeholder="Personal Project: AI Chatbot"></div>
                <div class="form-group"><label for="experienceDescription${id}">Description</label><textarea id="experienceDescription${id}" rows="4" placeholder="Developed a full-stack web application..."></textarea></div>
            `;
        }

        const switcherHtml = `
            <div class="type-switcher">
                <button class="switch-option company-btn ${type === 'company' ? 'active' : ''}" data-type="company">Company</button>
                <button class="switch-option other-btn ${type === 'other' ? 'active' : ''}" data-type="other">Other</button>
            </div>
        `;

        card.innerHTML = `
            <button type="button" class="remove-btn" title="Remove">X</button>
            <div class="item-header">
                <h3>Experience #${id}</h3>
                <div class="item-controls">
                    ${switcherHtml}
                </div>
            </div>
            ${fieldsHtml}
        `;

        card.querySelector('.remove-btn').addEventListener('click', () => card.remove());
        card.querySelectorAll('.switch-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const newType = e.target.dataset.type;
                if (card.dataset.experienceType !== newType) {
                    card.dataset.experienceType = newType;
                    generateExperienceCardContent(card);
                }
            });
        });
    }

    function addExperienceField() {
        experienceCount++;
        const card = document.createElement('div');
        card.className = 'experience-item';
        card.dataset.id = experienceCount;
        card.dataset.experienceType = 'company';
        experienceContainer.appendChild(card);
        generateExperienceCardContent(card);
    }

    function addEducationField() {
        educationCount++;
        const id = educationCount;
        const div = document.createElement('div');
        div.className = 'education-level';
        div.innerHTML = `
            <button type="button" class="remove-btn" data-id="${id}">X</button>
            <div class="item-header">
                <h3>Education #${id}</h3>
            </div>
            <div class="form-group"><label for="degree${id}">Degree / Field of Study</label><input type="text" id="degree${id}" placeholder="Bachelor's degree in Computer Science"></div>
            <div class="form-group"><label for="university${id}">School Name, Location</label><input type="text" id="university${id}" placeholder="State University, Anytown, ST"></div>
            <div class="form-group"><label for="eduDates${id}">Dates</label><input type="text" id="eduDates${id}" placeholder="MONTH 20XX - MONTH 20XX"></div>
        `;
        educationContainer.appendChild(div);
        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    }

    // --- MODAL & PREVIEW LOGIC ---
    function openModal() {
        updatePreview();
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    async function updatePreview() {
        const selectedTemplateName = modal.querySelector('.template.active').dataset.template;
        try {
            const response = await fetch(`ats_templates/${selectedTemplateName}.html`);
            if (!response.ok) throw new Error(`Template not found: ${selectedTemplateName}.html`);
            let templateText = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(templateText, 'text/html');
            const styleElement = doc.querySelector('style');
            let templateBody = doc.body.innerHTML;

            if (dynamicStyleElement) {
                dynamicStyleElement.textContent = styleElement ? styleElement.textContent : '';
            }

            // The main template now consists of the header and a placeholder for all body sections
            let finalHtml = templateBody.split('{{bodySections}}');
            let headerHtml = finalHtml[0];
            let footerHtml = finalHtml.length > 1 ? finalHtml[1] : '';

            const data = gatherData();
            
            // Populate header
            for (const key in data.header) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                headerHtml = headerHtml.replace(regex, data.header[key]);
            }

            // Join all non-empty body sections
            const bodySectionsHtml = data.bodySections.join('');

            cvPreview.innerHTML = `<div class="cv-preview-content ${selectedTemplateName.toLowerCase()}">${headerHtml}${bodySectionsHtml}${footerHtml}</div>`;
        } catch (error) {
            console.error('Error loading template:', error);
            cvPreview.innerHTML = `<div class="error-message" style="padding: 20px; text-align: center; color: red;">Could not load template. Error: ${error.message}</div>`;
        }
    }

    function gatherData() {
        // --- HEADER DATA ---
        const header = {
            name: document.getElementById('fullName').value || 'Jane Doe',
            jobTitle: document.getElementById('jobTitle').value || 'Cybersecurity Analyst',
            contactInfo: [
                document.getElementById('address').value,
                document.getElementById('phone').value,
                document.getElementById('email').value,
                document.getElementById('websites').value
            ].filter(Boolean).join(' | ')
        };

        // --- BODY SECTIONS (built conditionally) ---
        const bodySections = [];

        // Summary Section
        const summaryValue = document.getElementById('summary').value;
        if (summaryValue.trim() !== '') {
            bodySections.push(`<div class="section">
                                 <div class="section-title">Summary</div>
                                 <p>${summaryValue.replace(/\n/g, '<br>')}</p>
                               </div>`);
        }

        // Experience Section
        const experienceContent = Array.from(experienceContainer.children).map((div) => {
            const id = div.dataset.id;
            const expType = div.dataset.experienceType;

            if (expType === 'company') {
                const position = div.querySelector(`#position${id}`)?.value;
                const company = div.querySelector(`#company${id}`)?.value;
                if (!position && !company) return ''; // Skip empty items

                const dates = div.querySelector(`#expDates${id}`)?.value;
                const descValue = div.querySelector(`#expDesc${id}`)?.value;
                const description = `<ul>${(descValue || '')
                                    .split('\n')
                                    .map(line => line.trim() ? `<li>${line.trim()}</li>` : '')
                                    .join('')}</ul>`;
                return `<div class="item">
                            <h3>${position}</h3>
                            <div class="subtitle">${company}</div>
                            <div class="date">${dates}</div>
                            ${descValue.trim() !== '' ? description : ''}
                        </div>`;
            } else { // 'other'
                const title = div.querySelector(`#experienceTitle${id}`)?.value;
                if (!title) return ''; // Skip empty items

                const description = div.querySelector(`#experienceDescription${id}`)?.value.replace(/\n/g, '<br>');
                return `<div class="item">
                            <h3>${title}</h3>
                            <p>${description}</p>
                        </div>`;
            }
        }).filter(Boolean).join('');
        
        if (experienceContent) {
            bodySections.push(`<div class="section">
                                 <div class="section-title">Experience</div>
                                 ${experienceContent}
                               </div>`);
        }

        // Skills Section
        const skillsValue = document.getElementById('skills').value;
        if (skillsValue.trim() !== '') {
            const skillsList = `<ul>${skillsValue.split(',').map(s => `<li>${s.trim()}</li>`).join('')}</ul>`;
            bodySections.push(`<div class="section">
                                 <div class="section-title">Skills &amp; Tools</div>
                                 <div class="skills-list">${skillsList}</div>
                               </div>`);
        }

        // Certifications Section
        const certificatesValue = document.getElementById('certificates').value;
        if (certificatesValue.trim() !== '') {
            const certificatesList = `<ul>${certificatesValue.split(',').map(c => `<li>${c.trim()}</li>`).join('')}</ul>`;
            bodySections.push(`<div class="section">
                                 <div class="section-title">Certifications</div>
                                 <div class="certificates-list">${certificatesList}</div>
                               </div>`);
        }

        // Education Section
        const educationContent = Array.from(educationContainer.children).map((div) => {
            const id = div.querySelector('.remove-btn').dataset.id;
            const degree = div.querySelector(`#degree${id}`)?.value;
            const institution = div.querySelector(`#university${id}`)?.value;
            if (!degree && !institution) return ''; // Skip empty items

            const dates = div.querySelector(`#eduDates${id}`)?.value;
            return `<div class="item">
                        <h3>${degree}</h3>
                        <div class="subtitle">${institution}</div>
                        <div class="date">${dates}</div>
                    </div>`;
        }).filter(Boolean).join('');

        if (educationContent) {
             bodySections.push(`<div class="section">
                                 <div class="section-title">Education</div>
                                 ${educationContent}
                               </div>`);
        }

        return { header, bodySections };
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }

    // --- ACTIONS ---
    function downloadPDF() {
        const contentToPrint = cvPreview.querySelector('.cv-preview-content');
        if (!contentToPrint) {
            alert("Preview content not found.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'letter',
            putOnlyUsedFonts: true
        });

        pdf.html(contentToPrint, {
            callback: function (pdf) {
                pdf.save('resume.pdf');
            },
            margin: [36, 36, 36, 36],
            autoPaging: 'text',
            x: 0,
            y: 0,
            width: 540,
            windowWidth: 1200
        });
    }

    function resetForm() {
        if (confirm('Are you sure you want to reset all fields?')) {
            const form = document.querySelector('.form-section');
            if (form) form.reset();
            educationContainer.innerHTML = '';
            experienceContainer.innerHTML = '';
            educationCount = 0;
            experienceCount = 0;
            addEducationField();
            addExperienceField();
        }
    }

    // --- EVENT LISTENERS ---
    themeToggle.addEventListener('click', toggleTheme);
    previewBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    resetBtn.addEventListener('click', resetForm);
    addEducationBtn.addEventListener('click', addEducationField);
    addExperienceBtn.addEventListener('click', addExperienceField);
    downloadBtn.addEventListener('click', downloadPDF);

    modalTemplates.forEach(template => {
        template.addEventListener('click', () => {
            if (!template.classList.contains('active')) {
                modalTemplates.forEach(t => t.classList.remove('active'));
                template.classList.add('active');
                updatePreview();
            }
        });
    });

    // --- RUN ---
    initialize();
});