import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc,
    doc,
    orderBy, 
    query 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAVFvyuOauxGNNdNoCuZhwdHpPF1xIgGag",
    authDomain: "pso-career-hub-c083a.firebaseapp.com",
    projectId: "pso-career-hub-c083a",
    storageBucket: "pso-career-hub-c083a.firebasestorage.app",
    messagingSenderId: "145259853379",
    appId: "1:145259853379:web:41955f7b763e0b873c86f6",
    measurementId: "G-R98WD2C298"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allPostsData = [];
let currentCategory = "ALL";
let showOnlySaved = false;
let savedPostIds = JSON.parse(localStorage.getItem("pso_saved_posts") || "[]");

let allMaterialsData = [];
let currentMaterialLevel = "ALL";

// =========================================================
// 1. CAREER TABS & THEME TOGGLE
// =========================================================
window.openCareerTab = function(tabId, btnElement) {
    document.querySelectorAll(".career-tab-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

    const target = document.getElementById(tabId);
    if (target) target.style.display = "block";
    if (btnElement) btnElement.classList.add("active");
};

window.toggleTheme = function() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("pso_theme", isDark ? "dark" : "light");
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = isDark ? "☀️ Light" : "🌙 Dark";
};

// =========================================================
// 2. NEWS POSTS FILTER & BOOKMARKS
// =========================================================
window.setCategoryFilter = function(category, btnElement) {
    currentCategory = category;
    showOnlySaved = false;
    const savedBtn = document.getElementById("savedToggleBtn");
    if (savedBtn) savedBtn.classList.remove("active");

    document.querySelectorAll(".posts-section .pill-btn").forEach(b => b.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
    filterPosts();
};

window.toggleSavedView = function() {
    showOnlySaved = !showOnlySaved;
    const savedBtn = document.getElementById("savedToggleBtn");
    if (savedBtn) savedBtn.classList.toggle("active", showOnlySaved);
    filterPosts();
};

window.toggleBookmark = function(postId) {
    if (savedPostIds.includes(postId)) {
        savedPostIds = savedPostIds.filter(id => id !== postId);
    } else {
        savedPostIds.push(postId);
    }
    localStorage.setItem("pso_saved_posts", JSON.stringify(savedPostIds));
    updateSavedCount();
    filterPosts();
};

function updateSavedCount() {
    const countEl = document.getElementById("savedCount");
    if (countEl) countEl.textContent = savedPostIds.length;
}

window.filterPosts = function() {
    const searchInput = document.getElementById("searchInput");
    const searchVal = searchInput ? searchInput.value.toLowerCase() : "";

    const filtered = allPostsData.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchVal) || 
                              post.desc.toLowerCase().includes(searchVal) ||
                              post.category.toLowerCase().includes(searchVal);
        const matchesCategory = currentCategory === "ALL" || post.category === currentCategory;
        const matchesSaved = !showOnlySaved || savedPostIds.includes(post.id);
        return matchesSearch && matchesCategory && matchesSaved;
    });

    renderPosts(filtered);
};

// =========================================================
// 3. CAREER QUIZ REPORT GENERATOR
// =========================================================
window.generateFullCareerReport = function() {
    const stage = document.getElementById("qStage").value;
    const interest = document.getElementById("qInterest").value;
    const goal = document.getElementById("qGoal").value;
    const reportDiv = document.getElementById("fullQuizReport");

    const recommendations = {
        math: {
            course: stage === "10th" ? "Intermediate (MPC) లేదా Polytechnic Diploma (CSE/ECE)" : stage === "inter" ? "B.Tech (CSE / AI & ML / ECE) లేదా B.Sc Computer Science" : "Full Stack Software Development / Data Science / GATE M.Tech",
            exams: "POLYCET, EAPCET, JEE Main, NDA, SSC CGL",
            jobs: "Software Engineer, AI Developer, Defence Officer, Banking & Central Govt Jobs"
        },
        bio: {
            course: stage === "10th" ? "Intermediate (BiPC) లేదా Paramedical Diploma (DMLT)" : stage === "inter" ? "MBBS, BDS, B.Pharm, B.Sc Agriculture, B.Sc Nursing" : "Clinical Research / Hospital Management / Govt Medical & Agri Officer",
            exams: "NEET (UG), AP/TS EAPCET (Agri & Pharmacy)",
            jobs: "Doctor, Pharmacist, Agriculture Officer, Staff Nurse, Lab Technologist"
        },
        commerce: {
            course: stage === "10th" ? "Intermediate (CEC లేదా MEC)" : stage === "inter" ? "B.Com (Computers/General), BBA, CA, CMA, CS" : "MBA (Finance) / Bank PO & SSC CGL Coaching",
            exams: "CA Foundation, CMA, CUET, ICET, IBPS/SBI PO",
            jobs: "Chartered Accountant, Bank Manager, Financial Analyst, Tax Consultant"
        },
        arts: {
            course: stage === "10th" ? "Intermediate (HEC)" : stage === "inter" ? "B.A (History, Polity, Economics) లేదా 5-Year Integrated Law (BA LLB)" : "UPSC Civil Services / APPSC-TSPSC Groups / B.Ed",
            exams: "CLAT, LAWCET, CUET, UPSC CSE, APPSC Group-1 & Group-2",
            jobs: "IAS/IPS Officer, Group-1/2 Officer, Advocate/Judge, Journalist, Lecturer"
        },
        skills: {
            course: stage === "10th" ? "ITI (Electrician/Fitter) లేదా 3-Year Polytechnic Diploma" : "B.Tech (Lateral Entry via ECET) లేదా Skill Certification Courses",
            exams: "POLYCET, ECET, RRB ALP & Technician, SSC JE",
            jobs: "Railway Loco Pilot/Technician, Junior Engineer (JE), Industrial Supervisor"
        }
    };

    const goalTips = {
        govt: "ప్రభుత్వ ఉద్యోగం మీ లక్ష్యం కాబట్టి ఇప్పటి నుండే రోజుకు 1 గంట General Knowledge, Current Affairs మరియు Arithmetic ప్రాక్టీస్ ప్రారంభించండి.",
        private: "కార్పొరేట్/IT ఉద్యోగం కోసం డిగ్రీతో పాటు ప్రాక్టికల్ స్కిల్స్ (Coding, English Communication, Projects) తప్పనిసరిగా నేర్చుకోండి.",
        quick: "త్వరగా ఉద్యోగం పొందడానికి 1-3 ఏళ్ల వృత్తి విద్యా కోర్సులు (ITI / Polytechnic / Paramedical) ఉత్తమ ఎంపిక.",
        business: "సొంతంగా ఎదగడానికి మీ రంగంలో ప్రాక్టికల్ అనుభవంతో పాటు ప్రభుత్వ MSME / Mudra లోన్ పథకాలపై అవగాహన పెంచుకోండి."
    };

    const rec = recommendations[interest];
    const tip = goalTips[goal];

    reportDiv.style.display = "block";
    reportDiv.innerHTML = `
        <h3 style="margin-top:0; color:var(--primary-color);">📋 మీ పర్సనలైజ్డ్ PSO కెరీర్ రిపోర్ట్:</h3>
        <p><strong>🎓 సూచించబడిన కోర్సు:</strong> ${rec.course}</p>
        <p><strong>📝 రాయవలసిన ముఖ్య పరీక్షలు:</strong> ${rec.exams}</p>
        <p><strong>💼 భవిష్యత్తు ఉద్యోగ అవకాశాలు:</strong> ${rec.jobs}</p>
        <p style="background:rgba(16,185,129,0.12); padding:10px; border-radius:8px; border-left:3px solid #10b981;">
            <strong>💡 ప్రత్యేక సలహా:</strong> ${tip}
        </p>
        <a href="https://wa.me/919392962003?text=${encodeURIComponent(`Hello PSO Team, నా Quiz Result ప్రకారం (${rec.course}) గురించి మరింత గైడెన్స్ కావాలి.`)}" 
           target="_blank" class="submit-btn" style="display:inline-block; text-align:center; text-decoration:none; background:#25D366; margin-top:10px;">
           💬 ఈ రిపోర్ట్‌పై PSO టీమ్‌తో మాట్లాడండి
        </a>
    `;
};

// =========================================================
// 4. CONTACT MODAL & BACK TO TOP
// =========================================================
window.openContactModal = function() {
    const modal = document.getElementById("contactModal");
    if (modal) modal.style.display = "flex";
};

window.closeContactModal = function() {
    const modal = document.getElementById("contactModal");
    if (modal) modal.style.display = "none";
};

window.outsideModalClick = function(event) {
    const modal = document.getElementById("contactModal");
    if (event.target === modal) closeContactModal();
};

window.scrollToTop = function() {
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.addEventListener("scroll", () => {
    const btn = document.getElementById("backToTop");
    if (btn) btn.style.display = window.scrollY > 350 ? "block" : "none";
});

// =========================================================
// 5. ADMIN POSTS & MESSAGES
// =========================================================
window.deletePost = async function(id) {
    const pass = prompt("🔑 అడ్మిన్ పాస్‌వర్డ్ ఎంటర్ చేయండి:");
    if (pass !== "pso123") {
        alert("❌ తప్పుడు పాస్‌వర్డ్!");
        return;
    }
    if (confirm("మీరు నిజంగా ఈ పోస్ట్‌ను తొలగించాలనుకుంటున్నారా?")) {
        try {
            await deleteDoc(doc(db, "pso_posts", id));
            alert("🗑️ పోస్ట్ విజయవంతంగా తొలగించబడింది!");
            fetchPosts();
        } catch (e) {
            alert("ఎర్రర్: " + e.message);
        }
    }
};

window.loadAdminMessages = async function() {
    const pass = prompt("🔑 విద్యార్థుల మెసేజ్‌లు చూడటానికి Admin Password ఎంటర్ చేయండి:");
    if (pass !== "pso123") {
        alert("❌ తప్పుడు పాస్‌వర్డ్!");
        return;
    }

    const container = document.getElementById("adminMessagesContainer");
    if (!container) return;
    container.innerHTML = "<p style='text-align:center;'>సందేశాలు లోడ్ అవుతున్నాయి...</p>";

    try {
        const q = query(collection(db, "pso_messages"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = "<p style='text-align:center;'>ఇప్పటివరకు ఎలాంటి విద్యార్థుల సందేశాలు లేవు.</p>";
            return;
        }

        container.innerHTML = "";
        snapshot.forEach(docSnap => {
            const m = docSnap.data();
            const cleanPhone = m.phone.replace(/\D/g, "");
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const replyText = encodeURIComponent(`నమస్కారం ${m.name} గారు! PSO Career Hub నుండి మీ సందేహానికి ("${m.message}") సమాధానం: `);

            container.innerHTML += `
                <div style="border:1px solid var(--border-color); padding:15px; margin-bottom:12px; border-radius:10px; background:var(--subcard-bg);">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;">
                        <strong>👤 ${m.name} (${m.phone})</strong>
                        <span style="font-size:12px; opacity:0.75;">📅 ${m.date || ""}</span>
                    </div>
                    ${m.topic ? `<span style="display:inline-block; margin-top:6px; background:var(--primary-color); color:white; padding:2px 8px; border-radius:4px; font-size:11px;">${m.topic}</span>` : ""}
                    <p style="margin:8px 0;">💬 ${m.message}</p>
                    <a href="https://wa.me/${waPhone}?text=${replyText}" target="_blank" style="display:inline-block; background:#25D366; color:white; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12.5px; font-weight:bold;">
                        📲 Reply on WhatsApp
                    </a>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = `<p style='color:red;'>లోపం: ${error.message}</p>`;
    }
};

async function addNewUpdate(event) {
    event.preventDefault();

    const adminPass = document.getElementById('adminPass').value;
    if (adminPass !== "pso123") {
        alert("❌ తప్పుడు అడ్మిన్ పాస్‌వర్డ్!");
        return;
    }

    const category = document.getElementById('postCategory').value;
    const title = document.getElementById('postTitle').value.trim();
    const desc = document.getElementById('postDesc').value.trim();
    const link = document.getElementById('postLink').value.trim();

    try {
        await addDoc(collection(db, "pso_posts"), {
            category,
            title,
            desc,
            link: link || "#",
            date: new Date().toLocaleDateString('te-IN'),
            createdAt: Date.now()
        });

        alert('✨ పోస్ట్ విజయవంతంగా అప్‌లోడ్ అయింది!');
        document.getElementById("postForm").reset();
        fetchPosts();
    } catch (error) {
        alert("పోస్ట్ విఫలమైంది: " + error.message);
    }
}

async function sendContactMessage(event) {
    event.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const topicEl = document.getElementById('contactTopic');
    const topic = topicEl ? topicEl.value : "General";
    const message = document.getElementById('contactMessage').value.trim();

    try {
        await addDoc(collection(db, "pso_messages"), {
            name,
            phone,
            topic,
            message,
            date: new Date().toLocaleDateString('te-IN'),
            createdAt: Date.now()
        });

        closeContactModal();
        document.getElementById("contactForm").reset();

        const targetPhone = "919392962003"; 
        const waMessage = encodeURIComponent(`Hello PSO Team,\n\nName: ${name}\nPhone: ${phone}\nTopic: ${topic}\nQuery: ${message}`);
        window.open(`https://wa.me/${targetPhone}?text=${waMessage}`, '_blank');

    } catch (error) {
        alert("సందేశం పంపడంలో లోపం జరిగింది: " + error.message);
    }
}

async function fetchPosts() {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    try {
        const q = query(collection(db, "pso_posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            postsContainer.innerHTML = "<p style='text-align:center;'>ప్రస్తుతానికి ఎలాంటి పోస్ట్‌లు లేవు.</p>";
            return;
        }

        allPostsData = [];
        querySnapshot.forEach((docSnap) => {
            allPostsData.push({ id: docSnap.id, ...docSnap.data() });
        });

        const tickerEl = document.getElementById("liveTickerText");
        if (tickerEl && allPostsData.length > 0) {
            const headlines = allPostsData.slice(0, 3).map(p => `🔥 [${p.category}] ${p.title}`).join("   |   ");
            tickerEl.textContent = headlines;
        }

        renderPosts(allPostsData);
    } catch (error) {
        postsContainer.innerHTML = "<p style='text-align:center; color:red;'>డేటా లోడ్ చేయడంలో సమస్య ఏర్పడింది.</p>";
    }
}

function renderPosts(posts) {
    const postsContainer = document.getElementById("postsContainer");
    if (!postsContainer) return;

    if (posts.length === 0) {
        postsContainer.innerHTML = "<p style='text-align:center;'>ఎలాంటి పోస్ట్‌లు లభించలేదు.</p>";
        return;
    }

    postsContainer.innerHTML = "";
    posts.forEach((data) => {
        const isSaved = savedPostIds.includes(data.id);
        const shareText = encodeURIComponent(`📢 *${data.title}*\n\n${data.desc}\n\nమరిన్ని వివరాలకు చూడండి: https://psoorghub.netlify.app`);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

        const postCard = `
            <div style="border:1px solid var(--border-color); padding:18px; margin-bottom:15px; border-radius:12px; background:var(--subcard-bg);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <span style="background:var(--primary-color); color:#fff; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:700;">${data.category}</span>
                    <button onclick="toggleBookmark('${data.id}')" style="background:${isSaved ? '#f59e0b' : 'transparent'}; color:${isSaved ? '#000' : 'var(--text-color)'}; border:1px solid var(--border-color); padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">
                        ${isSaved ? '🔖 Saved' : '📑 Save'}
                    </button>
                </div>
                <h3 style="margin:10px 0 6px 0;">${data.title}</h3>
                <p style="margin:0 0 10px 0;">${data.desc}</p>
                <small style="opacity:0.75;">📅 తేదీ: ${data.date}</small>
                <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    ${data.link && data.link !== '#' ? `<a href="${data.link}" target="_blank" style="color:var(--primary-color); font-weight:700; text-decoration:none;">మరిన్ని వివరాలు 🔗</a>` : ''}
                    <a href="${whatsappUrl}" target="_blank" style="background:#25D366; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:12.5px; font-weight:bold; margin-left:auto;">
                        💬 WhatsApp Share
                    </a>
                    <button onclick="deletePost('${data.id}')" style="background:#dc2626; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px;">🗑️ Delete</button>
                </div>
            </div>
        `;
        postsContainer.innerHTML += postCard;
    });
}

// =========================================================
// 6. STUDY MATERIALS & IMP QUESTIONS (100% FREE FIRESTORE)
// =========================================================
window.setMaterialLevel = function(level, btnElement) {
    currentMaterialLevel = level;
    document.querySelectorAll(".filter-pills .pill-btn").forEach(b => b.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
    filterMaterials();
};

window.filterMaterials = function() {
    const searchEl = document.getElementById("materialSearchInput");
    const typeEl = document.getElementById("materialTypeFilter");
    const searchVal = searchEl ? searchEl.value.toLowerCase() : "";
    const typeVal = typeEl ? typeEl.value : "ALL";

    const filtered = allMaterialsData.filter(item => {
        const matchesLevel = currentMaterialLevel === "ALL" || item.level === currentMaterialLevel;
        const matchesType = typeVal === "ALL" || item.type === typeVal;
        const matchesSearch = item.title.toLowerCase().includes(searchVal) ||
                              item.subject.toLowerCase().includes(searchVal) ||
                              item.desc.toLowerCase().includes(searchVal);
        return matchesLevel && matchesType && matchesSearch;
    });

    renderMaterials(filtered);
};

window.deleteMaterial = async function(id) {
    const pass = prompt("🔑 అడ్మిన్ పాస్‌వర్డ్ ఎంటర్ చేయండి:");
    if (pass !== "pso123") {
        alert("❌ తప్పుడు పాస్‌వర్డ్!");
        return;
    }
    if (confirm("మీరు నిజంగా ఈ మెటీరియల్‌ను తొలగించాలనుకుంటున్నారా?")) {
        try {
            await deleteDoc(doc(db, "pso_materials", id));
            alert("🗑️ మెటీరియల్ తొలగించబడింది!");
            fetchMaterials();
        } catch (e) {
            alert("ఎర్రర్: " + e.message);
        }
    }
};

// Helper: Compress Image automatically so it fits cleanly in Free Firestore
function compressImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxWidth = 1200;
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.78));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Helper: Read PDF as Base64 Data URL
function readPdfAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
    });
}

// Helper: Open Base64 PDF/Image safely in a new browser tab
window.openMaterialFile = function(index) {
    const item = allMaterialsData[index];
    if (!item || !item.link) return;

    if (item.link.startsWith("data:")) {
        const win = window.open();
        if (win) {
            win.document.write(`<iframe src="${item.link}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
            alert("దయచేసి పాపప్ (Popup) బ్లాకర్ ఆఫ్ చేసి మళ్లీ క్లిక్ చేయండి.");
        }
    } else {
        window.open(item.link, "_blank");
    }
};

async function addNewMaterial(event) {
    event.preventDefault();

    const adminPass = document.getElementById("matAdminPass").value;
    if (adminPass !== "pso123") {
        alert("❌ తప్పుడు అడ్మిన్ పాస్‌వర్డ్!");
        return;
    }

    const level = document.getElementById("matLevel").value;
    const type = document.getElementById("matType").value;
    const subject = document.getElementById("matSubject").value.trim();
    const title = document.getElementById("matTitle").value.trim();
    const desc = document.getElementById("matDesc").value.trim();
    const fileInput = document.getElementById("matFile");
    const externalLink = document.getElementById("matLink").value.trim();

    const file = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;

    if (!file && !externalLink) {
        alert("⚠️ దయచేసి PDF/Image ఫైల్ సెలెక్ట్ చేయండి లేదా Google Drive లింక్ ఇవ్వండి!");
        return;
    }

    const statusBox = document.getElementById("uploadStatusBox");
    const progressText = document.getElementById("uploadProgressText");
    const submitBtn = document.getElementById("matSubmitBtn");

    try {
        submitBtn.disabled = true;
        let finalFileUrl = externalLink;
        let fileFormat = "Link";
        let fileName = "";

        if (file) {
            if (statusBox) statusBox.style.display = "block";
            if (progressText) progressText.textContent = "Processing...";
            fileName = file.name;

            if (file.type.startsWith("image/")) {
                fileFormat = "Image";
                finalFileUrl = await compressImageFile(file);
            } else if (file.type === "application/pdf") {
                if (file.size > 720 * 1024) {
                    alert("⚠️ ఫ్రీ డేటాబేస్ పరిమితి ప్రకారం నేరుగా 700 KB లోపు PDF మాత్రమే అప్‌లోడ్ అవుతుంది. పెద్ద PDF ఫైల్స్ కోసం Google Drive లో అప్‌లోడ్ చేసి ఆ లింక్‌ను కింద బాక్స్‌లో పేస్ట్ చేయండి!");
                    submitBtn.disabled = false;
                    if (statusBox) statusBox.style.display = "none";
                    return;
                }
                fileFormat = "PDF";
                finalFileUrl = await readPdfAsDataUrl(file);
            } else {
                alert("⚠️ దయచేసి PDF లేదా Image (JPG, PNG) ఫైల్ మాత్రమే ఎంచుకోండి.");
                submitBtn.disabled = false;
                if (statusBox) statusBox.style.display = "none";
                return;
            }
        }

        await addDoc(collection(db, "pso_materials"), {
            level,
            type,
            subject,
            title,
            desc,
            link: finalFileUrl,
            fileFormat,
            fileName,
            date: new Date().toLocaleDateString("te-IN"),
            createdAt: Date.now()
        });

        alert("📚 Study Material / IMP Questions విజయవంతంగా అప్‌లోడ్ అయింది!");
        document.getElementById("materialForm").reset();
    } catch (error) {
        alert("అప్‌లోడ్ విఫలమైంది: " + error.message);
    } finally {
        submitBtn.disabled = false;
        if (statusBox) statusBox.style.display = "none";
    }
}

async function fetchMaterials() {
    const container = document.getElementById("materialsContainer");
    if (!container) return;

    try {
        const q = query(collection(db, "pso_materials"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = "<p style='text-align:center;'>ప్రస్తుతానికి మెటీరియల్స్ ఇంకా అప్‌లోడ్ కాలేదు. త్వరలోనే అప్‌డేట్ అవుతాయి!</p>";
            return;
        }

        allMaterialsData = [];
        snapshot.forEach(docSnap => {
            allMaterialsData.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderMaterials(allMaterialsData);
    } catch (error) {
        container.innerHTML = "<p style='text-align:center; color:red;'>మెటీరియల్స్ లోడ్ చేయడంలో సమస్య ఏర్పడింది.</p>";
    }
}

function renderMaterials(items) {
    const container = document.getElementById("materialsContainer");
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>ఈ విభాగంలో మెటీరియల్స్ లభించలేదు.</p>";
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const globalIndex = allMaterialsData.findIndex(m => m.id === item.id);
        const isImage = item.fileFormat === "Image" || item.link.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(item.link);
        const shareText = encodeURIComponent(`📚 *${item.title}* (${item.level} - ${item.subject})\n\n${item.desc}\n\nమరిన్ని మెటీరియల్స్ & IMP Questions కోసం: https://psoorghub.netlify.app/materials.html`);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

        const imagePreviewHtml = isImage ? `
            <div style="margin: 12px 0; text-align: center;">
                <img src="${item.link}" alt="${item.title}" onclick="openMaterialFile(${globalIndex})" style="cursor:pointer; max-width: 100%; max-height: 360px; border-radius: 10px; border: 1px solid var(--border-color); object-fit: contain; background: #fff;">
            </div>
        ` : "";

        container.innerHTML += `
            <div style="border:1px solid var(--border-color); border-left:4px solid #2563eb; padding:18px; margin-bottom:16px; border-radius:12px; background:var(--subcard-bg);">
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
                    <span style="background:#2563eb; color:#fff; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:700;">${item.level}</span>
                    <span style="background:#059669; color:#fff; padding:3px 10px; border-radius:6px; font-size:12px; font-weight:700;">${item.type}</span>
                    <span style="background:#7c3aed; color:#fff; padding:3px 9px; border-radius:6px; font-size:11.5px; font-weight:700;">${isImage ? '🖼️ Image' : '📄 PDF / Doc'}</span>
                    <span style="font-size:12.5px; font-weight:700; color:var(--primary-color);">📘 ${item.subject}</span>
                </div>
                <h3 style="margin:6px 0;">${item.title}</h3>
                <p style="margin:0 0 10px 0;">${item.desc}</p>
                ${imagePreviewHtml}
                <small style="opacity:0.75;">📅 అప్‌లోడ్ తేదీ: ${item.date}</small>
                <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <button onclick="openMaterialFile(${globalIndex})" style="background:var(--primary-color); color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:13px; font-weight:700;">
                        ${isImage ? '🖼️ View Full Image' : '📄 View / Open PDF'}
                    </button>
                    <a href="${item.link}" download="${item.fileName || 'PSO_Material'}" style="background:#0f172a; color:#fff; padding:7px 13px; border-radius:6px; text-decoration:none; font-size:13px; font-weight:700;">
                        ⬇️ Download
                    </a>
                    <a href="${whatsappUrl}" target="_blank" style="background:#25D366; color:#fff; padding:7px 12px; border-radius:6px; text-decoration:none; font-size:12.5px; font-weight:bold; margin-left:auto;">
                        💬 Share
                    </a>
                    <button onclick="deleteMaterial('${item.id}')" style="background:#dc2626; color:white; border:none; padding:7px 10px; border-radius:6px; cursor:pointer; font-size:12px;">🗑️ Delete</button>
                </div>
            </div>
        `;
    });
}

// =========================================================
// 7. INITIALIZE ON PAGE LOAD
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("pso_theme") === "dark") {
        document.body.classList.add("dark-mode");
        const btn = document.getElementById("themeToggle");
        if (btn) btn.textContent = "☀️ Light";
    }

    updateSavedCount();
    fetchPosts();
    fetchMaterials();

    const postForm = document.getElementById("postForm");
    if (postForm) postForm.addEventListener("submit", addNewUpdate);

    const contactForm = document.getElementById("contactForm");
    if (contactForm) contactForm.addEventListener("submit", sendContactMessage);

    const materialForm = document.getElementById("materialForm");
    if (materialForm) materialForm.addEventListener("submit", addNewMaterial);
});

// =========================================================
// 8. HOME PAGE INTERACTIVE TOOLS (AGE CALC, CGPA & DAILY GK)
// =========================================================
window.calculateGovtExamAge = function() {
    const dobVal = document.getElementById("calcDob").value;
    const relax = parseInt(document.getElementById("calcCategory").value, 10);
    const resDiv = document.getElementById("ageCalcResult");

    if (!dobVal) {
        alert("⚠️ దయచేసి మీ పుట్టిన తేదీని (Date of Birth) ఎంచుకోండి!");
        return;
    }

    const dob = new Date(dobVal);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    const exams = [
        { name: "SSC CHSL / MTS / Constable", min: 18, max: 27 + relax },
        { name: "SSC CGL / Railways NTPC / Bank PO", min: 20, max: 30 + relax },
        { name: "UPSC Civil Services (IAS/IPS)", min: 21, max: 32 + relax },
        { name: "APPSC / TSPSC Groups & DSC Teacher", min: 18, max: 42 + relax }
    ];

    let listHtml = `<p style="margin:0 0 8px 0;"><strong>🎂 మీ ప్రస్తుత వయస్సు:</strong> ${age} సంవత్సరాలు (Category Relaxation: +${relax} Yrs)</p><ul style="margin:0; padding-left:18px;">`;
    exams.forEach(ex => {
        const eligible = age >= ex.min && age <= ex.max;
        listHtml += `<li><strong>${ex.name}</strong> (${ex.min}-${ex.max} Yrs): ${eligible ? '<span style="color:#059669; font-weight:800;">✅ అర్హులు (Eligible)</span>' : '<span style="color:#dc2626; font-weight:700;">❌ వయస్సు పరిమితి దాటింది / తక్కువ</span>'}</li>`;
    });
    listHtml += "</ul>";

    resDiv.style.display = "block";
    resDiv.innerHTML = listHtml;
};

window.convertCgpaToPercent = function() {
    const cgpa = parseFloat(document.getElementById("calcCgpa").value);
    const formula = document.getElementById("calcFormula").value;
    const resDiv = document.getElementById("cgpaCalcResult");

    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        alert("⚠️ దయచేసి 0 నుండి 10 మధ్య సరైన CGPA ఎంటర్ చేయండి!");
        return;
    }

    let percent = 0;
    if (formula === "9.5") percent = cgpa * 9.5;
    else if (formula === "10") percent = Math.max(0, (cgpa - 0.5) * 10);
    else percent = cgpa * 10;

    percent = Math.min(100, percent).toFixed(2);
    const division = percent >= 75 ? "First Class with Distinction 🏆" : percent >= 60 ? "First Class 🥇" : percent >= 50 ? "Second Class 🥈" : "Pass Class";

    resDiv.style.display = "block";
    resDiv.innerHTML = `
        <p style="margin:0;"><strong>📊 మీ మార్కుల శాతం (Percentage):</strong> <span style="font-size:18px; color:var(--primary-color); font-weight:800;">${percent}%</span></p>
        <p style="margin:6px 0 0 0;"><strong>🏅 గ్రేడ్ / డివిజన్:</strong> ${division}</p>
    `;
};

window.checkGkAnswer = function(btnEl, isCorrect, feedbackId) {
    const parent = btnEl.parentElement;
    parent.querySelectorAll("button").forEach(b => {
        b.style.background = "";
        b.style.color = "";
    });

    const feedbackEl = document.getElementById(feedbackId);
    feedbackEl.style.display = "block";

    if (isCorrect) {
        btnEl.style.background = "#10b981";
        btnEl.style.color = "#ffffff";
        feedbackEl.style.color = "#059669";
        feedbackEl.textContent = "✅ సరైన సమాధానం! అభినందనలు.";
    } else {
        btnEl.style.background = "#dc2626";
        btnEl.style.color = "#ffffff";
        feedbackEl.style.color = "#dc2626";
        feedbackEl.textContent = "❌ తప్పు సమాధానం! మళ్లీ ప్రయత్నించండి.";
    }
};
