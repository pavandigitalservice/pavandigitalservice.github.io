/**
 * Resume / CV Maker Interactive Engine
 * Pavan Digital Service
 */
document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'pds_resume_builder_v1';

    const OBJECTIVE_PRESETS = {
        fresher: 'To work in a challenging and growth-oriented organization where I can utilize my educational background, quick learning ability, and dedication to contribute meaningfully toward team goals while enhancing my professional skills.',
        office: 'To obtain a responsible administrative or office executive position where I can apply my computer proficiency, documentation accuracy, and organizational skills to streamline daily operations and support business efficiency.',
        tech: 'To secure a Software / Web Development role where I can leverage my programming, problem-solving, and modern UI/application building skills to deliver reliable, user-friendly digital solutions.'
    };

    const SAMPLE_STATE = {
        theme: 'navy',
        photoDataUrl: '',
        fullName: 'Rahul Kumar',
        jobTitle: 'Office Executive & Computer Operator',
        fatherName: 'Shri Ramesh Kumar',
        dob: '2001-08-15',
        gender: 'Male',
        maritalStatus: 'Unmarried',
        mobile: '+91 98765 43210',
        email: 'rahul.kumar@example.com',
        address: '42, Shastri Nagar, Near Central Park, Jaipur, Rajasthan - 302016',
        objective: OBJECTIVE_PRESETS.office,
        education: [
            { exam: '10th (High School)', board: 'CBSE / RBSE Board', year: '2017', score: '82.4%' },
            { exam: '12th (Intermediate)', board: 'CBSE / RBSE Board', year: '2019', score: '85.0%' },
            { exam: 'Graduation (B.Com)', board: 'University of Rajasthan', year: '2022', score: '76.5%' }
        ],
        skills: 'MS Office (Word, Excel, PowerPoint), Tally Prime with GST, Hindi & English Typing, Data Entry, Internet & Email Management',
        isFresher: false,
        experience: [
            {
                role: 'Computer Operator & Back Office Executive',
                company: 'Shree Ganesh Enterprises, Jaipur',
                duration: 'July 2022 - Present',
                desc: 'Managed daily billing, Excel reporting, GST invoice preparation in Tally Prime, and customer documentation.'
            }
        ],
        checkedLangs: ['Hindi', 'English'],
        extraLangs: ''
    };

    const EMPTY_DEFAULT_STATE = {
        theme: 'navy',
        photoDataUrl: '',
        fullName: '',
        jobTitle: '',
        fatherName: '',
        dob: '',
        gender: 'Male',
        maritalStatus: 'Unmarried',
        mobile: '',
        email: '',
        address: '',
        objective: OBJECTIVE_PRESETS.fresher,
        education: [
            { exam: '10th (High School)', board: '', year: '', score: '' },
            { exam: '12th (Intermediate)', board: '', year: '', score: '' },
            { exam: 'Graduation', board: '', year: '', score: '' }
        ],
        skills: '',
        isFresher: false,
        experience: [
            { role: '', company: '', duration: '', desc: '' }
        ],
        checkedLangs: ['Hindi', 'English'],
        extraLangs: ''
    };

    let state = loadSavedState();

    // DOM References
    const workspace = document.getElementById('rm-workspace');
    const paper = document.getElementById('resume-paper');
    const paperViewport = document.getElementById('rm-paper-viewport');
    const a4ScaleBox = document.getElementById('rm-a4-scale-box');

    const inputIds = [
        'fullName', 'jobTitle', 'fatherName', 'dob', 'gender',
        'maritalStatus', 'mobile', 'email', 'address', 'objective', 'skills'
    ];

    const photoInput = document.getElementById('rm-photo-input');
    const photoThumb = document.getElementById('rm-photo-thumb');
    const removePhotoBtn = document.getElementById('btn-rm-remove-photo');

    const eduListEl = document.getElementById('rm-edu-list');
    const addEduBtn = document.getElementById('btn-rm-add-edu');

    const isFresherCheck = document.getElementById('rm-is-fresher');
    const expWrapper = document.getElementById('rm-exp-wrapper');
    const expListEl = document.getElementById('rm-exp-list');
    const addExpBtn = document.getElementById('btn-rm-add-exp');

    const langChecks = document.querySelectorAll('.rm-lang-check');
    const extraLangsInput = document.getElementById('rm-extra-langs');

    const swatchBtns = document.querySelectorAll('.rm-swatch-btn');
    const sampleBtn = document.getElementById('btn-rm-sample');
    const resetBtn = document.getElementById('btn-rm-reset');
    const resetConfirmBanner = document.getElementById('rm-reset-confirm');
    const confirmResetBtn = document.getElementById('btn-rm-confirm-reset');
    const cancelResetBtn = document.getElementById('btn-rm-cancel-reset');

    const printBtn = document.getElementById('btn-rm-print');
    const printMobileBtn = document.getElementById('btn-rm-print-mobile');
    const mobileTabs = document.querySelectorAll('.rm-mobile-tab');

    // Storage Helpers
    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function loadSavedState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return clone(EMPTY_DEFAULT_STATE);
            const parsed = JSON.parse(raw);
            return Object.assign(clone(EMPTY_DEFAULT_STATE), parsed);
        } catch (e) {
            return clone(EMPTY_DEFAULT_STATE);
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Ignore quota errors if very large photo uploaded
        }
    }

    // Format Date DD/MM/YYYY
    function formatDate(iso) {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length !== 3) return iso;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Populate static form fields from state
    function syncFormFromState() {
        inputIds.forEach(id => {
            const el = document.getElementById(`rm-${id}`);
            if (el) el.value = state[id] || '';
        });

        isFresherCheck.checked = Boolean(state.isFresher);
        expWrapper.style.display = state.isFresher ? 'none' : 'block';

        langChecks.forEach(cb => {
            cb.checked = Array.isArray(state.checkedLangs) && state.checkedLangs.includes(cb.value);
        });
        extraLangsInput.value = state.extraLangs || '';

        // Theme buttons
        swatchBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-cv-theme') === state.theme);
        });

        renderPhotoThumbnail();
        renderEducationEditor();
        renderExperienceEditor();
        renderPreview();
    }

    function renderPhotoThumbnail() {
        if (state.photoDataUrl) {
            photoThumb.innerHTML = '';
            const img = document.createElement('img');
            img.src = state.photoDataUrl;
            img.alt = 'Uploaded Photo Preview';
            photoThumb.appendChild(img);
            removePhotoBtn.style.display = 'inline-flex';
        } else {
            photoThumb.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
            removePhotoBtn.style.display = 'none';
        }
    }

    // Render Repeatable Education Rows
    function renderEducationEditor() {
        eduListEl.innerHTML = '';
        state.education.forEach((edu, index) => {
            const row = document.createElement('div');
            row.className = 'rm-repeat-row';

            const head = document.createElement('div');
            head.className = 'rm-repeat-head';

            const title = document.createElement('span');
            title.className = 'rm-repeat-title';
            title.textContent = `Qualification #${index + 1}`;
            head.appendChild(title);

            if (state.education.length > 1) {
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'rm-icon-remove';
                delBtn.innerHTML = '<i class="fas fa-trash-can"></i> Remove';
                delBtn.addEventListener('click', () => {
                    state.education.splice(index, 1);
                    saveState();
                    renderEducationEditor();
                    renderPreview();
                });
                head.appendChild(delBtn);
            }

            row.appendChild(head);

            const grid1 = document.createElement('div');
            grid1.className = 'rm-grid-2';

            grid1.appendChild(createInputField('Exam / Degree', edu.exam, 'e.g. 10th / Graduation', val => {
                state.education[index].exam = val;
                saveState();
                renderPreview();
            }));
            grid1.appendChild(createInputField('Board / University', edu.board, 'e.g. CBSE / State Board', val => {
                state.education[index].board = val;
                saveState();
                renderPreview();
            }));

            const grid2 = document.createElement('div');
            grid2.className = 'rm-grid-2';

            grid2.appendChild(createInputField('Passing Year', edu.year, 'e.g. 2022', val => {
                state.education[index].year = val;
                saveState();
                renderPreview();
            }));
            grid2.appendChild(createInputField('Percentage / CGPA', edu.score, 'e.g. 78.5%', val => {
                state.education[index].score = val;
                saveState();
                renderPreview();
            }));

            row.appendChild(grid1);
            row.appendChild(grid2);
            eduListEl.appendChild(row);
        });
    }

    // Render Repeatable Work Experience Rows
    function renderExperienceEditor() {
        expListEl.innerHTML = '';
        state.experience.forEach((exp, index) => {
            const row = document.createElement('div');
            row.className = 'rm-repeat-row';

            const head = document.createElement('div');
            head.className = 'rm-repeat-head';

            const title = document.createElement('span');
            title.className = 'rm-repeat-title';
            title.textContent = `Experience #${index + 1}`;
            head.appendChild(title);

            if (state.experience.length > 1) {
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'rm-icon-remove';
                delBtn.innerHTML = '<i class="fas fa-trash-can"></i> Remove';
                delBtn.addEventListener('click', () => {
                    state.experience.splice(index, 1);
                    saveState();
                    renderExperienceEditor();
                    renderPreview();
                });
                head.appendChild(delBtn);
            }
            row.appendChild(head);

            const grid = document.createElement('div');
            grid.className = 'rm-grid-2';
            grid.appendChild(createInputField('Job Role / Title', exp.role, 'e.g. Computer Operator', val => {
                state.experience[index].role = val;
                saveState();
                renderPreview();
            }));
            grid.appendChild(createInputField('Duration', exp.duration, 'e.g. 2022 - Present', val => {
                state.experience[index].duration = val;
                saveState();
                renderPreview();
            }));
            row.appendChild(grid);

            row.appendChild(createInputField('Company / Organization', exp.company, 'e.g. ABC Infotech Pvt Ltd', val => {
                state.experience[index].company = val;
                saveState();
                renderPreview();
            }));

            row.appendChild(createTextareaField('Key Responsibilities (Optional)', exp.desc, 'Briefly describe your role and duties...', val => {
                state.experience[index].desc = val;
                saveState();
                renderPreview();
            }));

            expListEl.appendChild(row);
        });
    }

    function createInputField(labelText, initialValue, placeholder, onInput) {
        const wrap = document.createElement('div');
        wrap.className = 'rm-field';
        const lbl = document.createElement('label');
        lbl.textContent = labelText;
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = initialValue || '';
        inp.placeholder = placeholder;
        inp.addEventListener('input', () => onInput(inp.value));
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        return wrap;
    }

    function createTextareaField(labelText, initialValue, placeholder, onInput) {
        const wrap = document.createElement('div');
        wrap.className = 'rm-field';
        const lbl = document.createElement('label');
        lbl.textContent = labelText;
        const ta = document.createElement('textarea');
        ta.rows = 2;
        ta.value = initialValue || '';
        ta.placeholder = placeholder;
        ta.addEventListener('input', () => onInput(ta.value));
        wrap.appendChild(lbl);
        wrap.appendChild(ta);
        return wrap;
    }

    // Render Live A4 Resume Preview
    function renderPreview() {
        paper.setAttribute('data-theme', state.theme || 'navy');

        // Header Name & Role
        const outName = document.getElementById('cv-out-name');
        const displayName = (state.fullName || '').trim() || 'YOUR FULL NAME';
        outName.textContent = displayName;

        const outRole = document.getElementById('cv-out-role');
        const trimmedRole = (state.jobTitle || '').trim();
        if (trimmedRole) {
            outRole.textContent = trimmedRole;
            outRole.style.display = 'block';
        } else {
            outRole.style.display = 'none';
        }

        // Contact Line
        const outContact = document.getElementById('cv-out-contact');
        outContact.innerHTML = '';
        const contacts = [
            { icon: 'fa-phone', val: (state.mobile || '').trim() || '+91 98765 43210' },
            { icon: 'fa-envelope', val: (state.email || '').trim() || 'email@example.com' },
            { icon: 'fa-location-dot', val: (state.address || '').trim() || 'City, State, India' }
        ];
        contacts.forEach(item => {
            const span = document.createElement('span');
            span.className = 'cv-contact-item';
            const ic = document.createElement('i');
            ic.className = `fas ${item.icon}`;
            ic.setAttribute('aria-hidden', 'true');
            const txt = document.createElement('span');
            txt.textContent = item.val;
            span.appendChild(ic);
            span.appendChild(txt);
            outContact.appendChild(span);
        });

        // Photo
        const photoBox = document.getElementById('cv-out-photo-box');
        const photoImg = document.getElementById('cv-out-photo');
        if (state.photoDataUrl) {
            photoImg.src = state.photoDataUrl;
            photoBox.style.display = 'block';
        } else {
            photoImg.removeAttribute('src');
            photoBox.style.display = 'none';
        }

        // Career Objective
        const secObj = document.getElementById('cv-sec-objective');
        const outObj = document.getElementById('cv-out-objective');
        const objText = (state.objective || '').trim();
        if (objText) {
            outObj.textContent = objText;
            secObj.style.display = 'block';
        } else {
            secObj.style.display = 'none';
        }

        // Educational Qualification Table
        const secEdu = document.getElementById('cv-sec-edu');
        const outEduBody = document.getElementById('cv-out-edu-body');
        outEduBody.innerHTML = '';
        const validEdu = (state.education || []).filter(e =>
            (e.exam && e.exam.trim()) || (e.board && e.board.trim()) || (e.year && e.year.trim()) || (e.score && e.score.trim())
        );

        if (validEdu.length > 0) {
            secEdu.style.display = 'block';
            validEdu.forEach(e => {
                const tr = document.createElement('tr');
                [e.exam || '-', e.board || '-', e.year || '-', e.score || '-'].forEach(cellText => {
                    const td = document.createElement('td');
                    td.textContent = cellText;
                    tr.appendChild(td);
                });
                outEduBody.appendChild(tr);
            });
        } else {
            secEdu.style.display = 'none';
        }

        // Computer & Technical Skills
        const secSkills = document.getElementById('cv-sec-skills');
        const outSkills = document.getElementById('cv-out-skills');
        outSkills.innerHTML = '';
        const skillList = (state.skills || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        if (skillList.length > 0) {
            secSkills.style.display = 'block';
            skillList.forEach(skill => {
                const tag = document.createElement('span');
                tag.className = 'cv-skill-tag';
                tag.textContent = skill;
                outSkills.appendChild(tag);
            });
        } else {
            secSkills.style.display = 'none';
        }

        // Work Experience
        const secExp = document.getElementById('cv-sec-exp');
        const outExp = document.getElementById('cv-out-exp');
        outExp.innerHTML = '';

        if (state.isFresher) {
            secExp.style.display = 'block';
            const p = document.createElement('p');
            p.className = 'cv-objective-text';
            p.textContent = 'Fresher — Dedicated, adaptable, and eager to contribute skills and learn within a collaborative team environment.';
            outExp.appendChild(p);
        } else {
            const validExp = (state.experience || []).filter(x =>
                (x.role && x.role.trim()) || (x.company && x.company.trim()) || (x.desc && x.desc.trim())
            );
            if (validExp.length > 0) {
                secExp.style.display = 'block';
                validExp.forEach(x => {
                    const item = document.createElement('div');
                    item.className = 'cv-exp-item';

                    const top = document.createElement('div');
                    top.className = 'cv-exp-top';

                    const roleEl = document.createElement('span');
                    roleEl.className = 'cv-exp-role';
                    roleEl.textContent = x.role || 'Position';

                    const durEl = document.createElement('span');
                    durEl.className = 'cv-exp-duration';
                    durEl.textContent = x.duration || '';

                    top.appendChild(roleEl);
                    top.appendChild(durEl);
                    item.appendChild(top);

                    if (x.company && x.company.trim()) {
                        const compEl = document.createElement('div');
                        compEl.className = 'cv-exp-company';
                        compEl.textContent = x.company.trim();
                        item.appendChild(compEl);
                    }

                    if (x.desc && x.desc.trim()) {
                        const descEl = document.createElement('p');
                        descEl.className = 'cv-exp-desc';
                        descEl.textContent = x.desc.trim();
                        item.appendChild(descEl);
                    }

                    outExp.appendChild(item);
                });
            } else {
                secExp.style.display = 'none';
            }
        }

        // Personal Profile & Languages Known
        const outPersonal = document.getElementById('cv-out-personal');
        outPersonal.innerHTML = '';

        const langs = [...(state.checkedLangs || [])];
        if (state.extraLangs && state.extraLangs.trim()) {
            state.extraLangs.split(',').forEach(l => {
                const trimmed = l.trim();
                if (trimmed && !langs.includes(trimmed)) langs.push(trimmed);
            });
        }

        const personalRows = [
            { label: "Father's Name", val: (state.fatherName || '').trim() || '-' },
            { label: 'Date of Birth', val: formatDate(state.dob) || '-' },
            { label: 'Gender', val: state.gender || '-' },
            { label: 'Marital Status', val: state.maritalStatus || '-' },
            { label: 'Languages Known', val: langs.length > 0 ? langs.join(', ') : '-', full: true },
            { label: 'Address', val: (state.address || '').trim() || '-', full: true }
        ];

        personalRows.forEach(r => {
            const rowDiv = document.createElement('div');
            rowDiv.className = `cv-personal-row${r.full ? ' full-span' : ''}`;

            const lblSpan = document.createElement('span');
            lblSpan.className = 'cv-personal-label';
            lblSpan.textContent = `${r.label}:`;

            const valSpan = document.createElement('span');
            valSpan.className = 'cv-personal-val';
            valSpan.textContent = r.val;

            rowDiv.appendChild(lblSpan);
            rowDiv.appendChild(valSpan);
            outPersonal.appendChild(rowDiv);
        });

        // Declaration Footer
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        document.getElementById('cv-out-date').textContent = `${dd}/${mm}/${yyyy}`;

        // Try extracting city/place from address tail or leave clean blank line
        const addrParts = (state.address || '').split(',').map(p => p.trim()).filter(Boolean);
        document.getElementById('cv-out-place').textContent = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : '____________';
        document.getElementById('cv-out-sign-name').textContent = (state.fullName || '').trim() || '(Signature)';

        updateA4Scale();
    }

    // Smoothly scale 794px A4 sheet to fit preview pane cleanly on all screen sizes
    function updateA4Scale() {
        if (!paperViewport || !a4ScaleBox || !paper) return;
        if (window.matchMedia && window.matchMedia('print').matches) {
            a4ScaleBox.style.transform = 'none';
            paperViewport.style.height = 'auto';
            return;
        }
        const availWidth = paperViewport.clientWidth;
        if (availWidth <= 0) return;

        const scale = Math.min(1, availWidth / 794);
        a4ScaleBox.style.transform = `scale(${scale})`;
        const naturalHeight = paper.offsetHeight || 1123;
        paperViewport.style.height = `${Math.ceil(naturalHeight * scale)}px`;
    }

    // Bind standard text/select/date inputs
    inputIds.forEach(id => {
        const el = document.getElementById(`rm-${id}`);
        if (!el) return;
        const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(eventName, () => {
            state[id] = el.value;
            saveState();
            renderPreview();
        });
    });

    // Objective Presets
    document.querySelectorAll('[data-obj-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-obj-preset');
            if (OBJECTIVE_PRESETS[key]) {
                state.objective = OBJECTIVE_PRESETS[key];
                document.getElementById('rm-objective').value = state.objective;
                saveState();
                renderPreview();
            }
        });
    });

    // Skill Quick Chips
    document.querySelectorAll('[data-skill-add]').forEach(btn => {
        btn.addEventListener('click', () => {
            const skill = btn.getAttribute('data-skill-add');
            const currentList = (state.skills || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            if (!currentList.includes(skill)) {
                currentList.push(skill);
                state.skills = currentList.join(', ');
                document.getElementById('rm-skills').value = state.skills;
                saveState();
                renderPreview();
            }
        });
    });

    // Photo Upload Handler
    photoInput?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            state.photoDataUrl = ev.target.result;
            saveState();
            renderPhotoThumbnail();
            renderPreview();
        };
        reader.readAsDataURL(file);
    });

    removePhotoBtn?.addEventListener('click', () => {
        state.photoDataUrl = '';
        if (photoInput) photoInput.value = '';
        saveState();
        renderPhotoThumbnail();
        renderPreview();
    });

    // Add More Qualification
    addEduBtn?.addEventListener('click', () => {
        state.education.push({ exam: '', board: '', year: '', score: '' });
        saveState();
        renderEducationEditor();
        renderPreview();
    });

    // Fresher Toggle & Add Experience
    isFresherCheck?.addEventListener('change', () => {
        state.isFresher = isFresherCheck.checked;
        expWrapper.style.display = state.isFresher ? 'none' : 'block';
        saveState();
        renderPreview();
    });

    addExpBtn?.addEventListener('click', () => {
        state.experience.push({ role: '', company: '', duration: '', desc: '' });
        saveState();
        renderExperienceEditor();
        renderPreview();
    });

    // Languages Checkboxes & Extra Input
    langChecks.forEach(cb => {
        cb.addEventListener('change', () => {
            const selected = [];
            langChecks.forEach(item => {
                if (item.checked) selected.push(item.value);
            });
            state.checkedLangs = selected;
            saveState();
            renderPreview();
        });
    });

    extraLangsInput?.addEventListener('input', () => {
        state.extraLangs = extraLangsInput.value;
        saveState();
        renderPreview();
    });

    // Color Theme Swatches
    swatchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-cv-theme');
            state.theme = theme;
            swatchBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveState();
            renderPreview();
        });
    });

    // Sample Data & Inline Reset
    sampleBtn?.addEventListener('click', () => {
        const preservedPhoto = state.photoDataUrl;
        state = clone(SAMPLE_STATE);
        if (preservedPhoto) state.photoDataUrl = preservedPhoto;
        saveState();
        syncFormFromState();
        resetConfirmBanner.classList.remove('visible');
    });

    resetBtn?.addEventListener('click', () => {
        resetConfirmBanner.classList.toggle('visible');
    });

    cancelResetBtn?.addEventListener('click', () => {
        resetConfirmBanner.classList.remove('visible');
    });

    confirmResetBtn?.addEventListener('click', () => {
        state = clone(EMPTY_DEFAULT_STATE);
        if (photoInput) photoInput.value = '';
        saveState();
        syncFormFromState();
        resetConfirmBanner.classList.remove('visible');
    });

    // Print / Save as PDF Handler
    function triggerPrint() {
        const originalTitle = document.title;
        const cleanName = (state.fullName || '').trim().replace(/\s+/g, '_');
        if (cleanName) {
            document.title = `${cleanName}_Resume`;
        }
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    }

    printBtn?.addEventListener('click', triggerPrint);
    printMobileBtn?.addEventListener('click', () => {
        // Ensure preview is rendered cleanly before printing on mobile
        if (workspace) workspace.setAttribute('data-mobile-view', 'preview');
        mobileTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-view') === 'preview'));
        setTimeout(() => {
            updateA4Scale();
            triggerPrint();
        }, 100);
    });

    // Mobile Tab Switcher (Edit vs Preview)
    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            mobileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            workspace.setAttribute('data-mobile-view', view);
            if (view === 'preview') {
                setTimeout(updateA4Scale, 30);
            }
        });
    });

    // ResizeObserver for seamless A4 scaling
    if (typeof ResizeObserver !== 'undefined' && paperViewport) {
        const ro = new ResizeObserver(() => updateA4Scale());
        ro.observe(paperViewport);
    }
    window.addEventListener('resize', updateA4Scale);
    window.addEventListener('afterprint', updateA4Scale);

    // Initialize UI
    syncFormFromState();
});
