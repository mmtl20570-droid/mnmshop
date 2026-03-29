const IMGBB_API_KEY = "f94afa0a5c6ec1467a570e79b1ca2f14";
// --- Firebase Configuration ---
// Replace these with your own Firebase Project settings
const firebaseConfig = {
  apiKey: "AIzaSyD-VieCw1hcgMALCmptGVAAq4dtHAh2Gbw",
  authDomain: "mnm-shop-901c9.firebaseapp.com",
  projectId: "mnm-shop-901c9",
  storageBucket: "mnm-shop-901c9.firebasestorage.app",
  messagingSenderId: "549507929902",
  appId: "1:549507929902:web:85ae6b9f1214b26ddd4cbf",
  measurementId: "G-TR2V28BRCF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// --- Animation Observer ---
const observerOptions = {
  threshold: 0.25, // Trigger when 25% of the element is visible
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Simple per-element reveal. This naturally staggers
      // as each individual piece enters the viewport during scroll.
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function initObservers() {
  // We observe every .reveal item individually.
  // This includes product-cards which now have individual reveal logic.
  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.classList.contains('active')) {
      observer.observe(el);
    }
  });

  // Also observe any dynamic product cards that might be added later
  document.querySelectorAll('.product-card').forEach(el => {
    if (!el.classList.contains('active')) {
      observer.observe(el);
    }
  });
}

// --- Dynamic Rendering ---
async function loadItems() {
  const archiveGrid = document.querySelector('.product-grid');
  const featuredGrid = document.querySelector('.featured-grid');

  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      initObservers();
      return;
    }

    // Clear dynamic targets
    archiveGrid.innerHTML = '';
    if (featuredGrid) featuredGrid.innerHTML = '';

    let featuredCount = 0;

    snapshot.forEach(doc => {
      const item = doc.data();
      const mainImg = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.imageUrl || '');

      const cardHtml = `
      <div class="product-card reveal" style="position:relative;">
        <button class="admin-edit-btn" onclick="openEditMode('${doc.id}', event)">✎</button>
        <button class="admin-delete-btn" onclick="deleteItem('${doc.id}', event)">×</button>
        <a href="product.html?id=${doc.id}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column;">
          <div class="product-img-container" style="background: #151515; aspect-ratio: 4/5; border-radius: 8px; overflow: hidden; position: relative;">
            <img class="product-img" src="${mainImg}" alt="${item.name}" 
                 onerror="this.style.display='none'; this.parentElement.querySelector('.img-error').style.display='flex';"
                 style="width: 100%; height: 100%; object-fit: cover; display: block;">
            <div class="img-error" style="display: none; position: absolute; inset: 0; align-items: center; justify-content: center; color: #444; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em;">Image Not Found</div>
          </div>
          <div class="product-info" style="padding: 1rem 0;">
            <div class="product-name" style="font-family: 'Outfit', sans-serif; font-size: 0.7rem; font-weight: 600; line-height: 1.1; margin-bottom: 0.1rem;">${item.name}</div>
            <div class="product-meta" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.6rem; letter-spacing: 0.05em; text-transform: uppercase;">
              <span class="product-brand" style="color: var(--gray);">${item.brand}</span>
              <span class="product-status ${item.status === 'sold' ? 'status-sold' : ''}" style="color: ${item.status === 'sold' ? 'var(--accent)' : 'var(--off-white)'}">${item.status === 'sold' ? '[ SOLD ]' : (String(item.price).toUpperCase().includes('TND') ? item.price : item.price + ' TND')}</span>
            </div>
            ${item.viewCount ? `
              <div class="product-views">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>${item.viewCount} View${item.viewCount !== 1 ? 's' : ''}</span>
              </div>
            ` : ''}

          </div>
        </a>
      </div>
    `;

      // Add to main Archive
      archiveGrid.insertAdjacentHTML('beforeend', cardHtml);

      // Add to Featured if flagged (max 18 for layout consistency)
      if (item.isFeatured && featuredCount < 18 && featuredGrid) {
        const featItem = document.createElement('div');
        featItem.className = 'featured-item-grid';
        featItem.innerHTML = `
            <a href="product.html?id=${doc.id}" style="display:block; height:100%; width:100%;">
                <div class="featured-img-container">
                    <img src="${mainImg}" alt="${item.name}">
                    <div class="featured-overlay">
                        <div class="featured-item-info">
                            <p class="brand">${item.brand}</p>
                            <p class="name">${item.name}</p>
                            <p class="price">${item.status === 'sold' ? 'SOLD' : (String(item.price).toUpperCase().includes('TND') ? item.price : item.price + ' TND')}</p>
                            ${item.viewCount ? `
                              <div class="product-views" style="color: rgba(255,255,255,0.7); margin-top: 5px;">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <span style="font-size: 0.55rem; letter-spacing: 0.05em;">${item.viewCount} VIEW${item.viewCount !== 1 ? 'S' : ''}</span>
                              </div>
                            ` : ''}

                        </div>
                    </div>
                </div>
            </a>
        `;
        featuredGrid.appendChild(featItem);
        featuredCount++;
      }
    });

    initObservers();
    updateAdminView(); // Ensure buttons show if already logged in
  } catch (err) {
    console.log("Firebase error:", err);
    initObservers();
  }
}

// --- Admin Logic ---
function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  panel.classList.toggle('visible');
}

function openNewPost() {
  resetAdminForm();
  toggleAdminPanel();
}

document.getElementById('admin-login-btn').addEventListener('click', openNewPost);

function updateAdminView() {
  const isAdmin = (document.getElementById('auth-section').style.display === 'none');
  document.querySelectorAll('.admin-delete-btn, .admin-edit-btn').forEach(btn => {
    btn.style.display = isAdmin ? 'flex' : 'none';
  });
}

async function loginAdmin() {
  let email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value;

  if (!email) {
    alert("Please enter your staff ID or email.");
    return;
  }

  // Support shorthand: if no '@' is present, assume it's '@admin.com'
  // (adjust this domain based on your Firebase setup)
  if (!email.includes('@')) {
    email += "@admin.com";
  }

  try {
    await auth.signInWithEmailAndPassword(email, pass);
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('add-item-section').style.display = 'block';
    updateAdminView();
  } catch (err) {
    if (err.code === 'auth/invalid-email') {
      alert("Invalid format. Please use 'admin' or your full staff email.");
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      alert("Access Denied: Incorrect staff ID or password.");
    } else {
      alert("Login failed: " + err.message);
    }
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('add-item-section').style.display = 'block';
    updateAdminView();
  } else {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('add-item-section').style.display = 'none';
    updateAdminView();
  }
});

function previewImages() {
  const container = document.getElementById('image-preview-container');
  container.innerHTML = '';
  const files = document.getElementById('item-img').files;

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'preview-thumb';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

let activeEditId = null;

async function openEditMode(id, event) {
  if (event) event.stopPropagation();
  try {
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) return;
    const data = doc.data();

    // Populate form
    document.getElementById('item-name').value = data.name;
    document.getElementById('item-brand').value = data.brand;
    document.getElementById('item-price').value = data.price;
    document.getElementById('item-status').value = data.status;
    document.getElementById('item-featured').checked = data.isFeatured || false;
    document.getElementById('item-url').value = (data.imageUrls || [data.imageUrl]).join(',');

    activeEditId = id;

    // Change UI state
    document.getElementById('imgbb-upload-btn').innerHTML = "UPDATE ARCHIVE ENTRY";
    document.getElementById('imgbb-upload-btn').style.background = "#44aaff";

    // Scroll to panel
    toggleAdminPanel();
    document.getElementById('admin-panel').scrollTop = 0;

    document.getElementById('status-msg').innerText = `Editing: ${data.name}`;

  } catch (err) {
    alert("Error loading item for edit: " + err.message);
  }
}

function resetAdminForm() {
  document.getElementById('item-name').value = '';
  document.getElementById('item-brand').value = '';
  document.getElementById('item-price').value = '';
  document.getElementById('item-status').value = 'available';
  document.getElementById('item-featured').checked = false;
  document.getElementById('item-url').value = '';
  document.getElementById('image-preview-container').innerHTML = '';
  document.getElementById('status-msg').innerText = '';

  activeEditId = null;
  document.getElementById('imgbb-upload-btn').innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 8px; vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
    UPLOAD & REVEAL (FIREBASE)
`;
  document.getElementById('imgbb-upload-btn').style.background = "var(--accent)";
}

async function deleteItem(id, event) {
  event.stopPropagation();
  if (!confirm("Are you sure you want to delete this piece from the archive?")) return;

  try {
    await db.collection('products').doc(id).delete();
    loadItems(); // Refresh grid
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

async function uploadAndActivate() {
  const files = document.getElementById('item-img').files;
  const msg = document.getElementById('status-msg');

  // If no new files and we are editing, just save the form data
  if ((!files || files.length === 0) && activeEditId) {
    await addNewItem();
    return;
  }

  // If no files and no URL, tell the user to provide something
  if ((!files || files.length === 0) && !document.getElementById('item-url').value) {
    alert("Please select at least one photo or provide a link.");
    return;
  }

  // If there are no files but there is a URL, just save
  if (!files || files.length === 0) {
    await addNewItem();
    return;
  }

  try {
    const imageUrls = [];
    const total = files.length;
    msg.classList.add('status-active');

    for (let i = 0; i < total; i++) {
      const file = files[i];
      msg.innerText = `Uploading image ${i + 1} of ${total} to ImgBB...`;

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        imageUrls.push(result.data.url);
      } else {
        throw new Error(result.error.message || "ImgBB Upload Failed");
      }
    }

    msg.innerText = "All images uploaded! Syncing database...";
    msg.classList.remove('status-active');

    // Store URLs as a comma-separated list for the manual field
    document.getElementById('item-url').value = imageUrls.join(',');
    await addNewItem();

  } catch (err) {
    msg.innerText = "Upload Error: " + err.message;
    console.error(err);
    alert("Failed to upload: " + err.message);
  }
}

async function addNewItem() {
  const name = document.getElementById('item-name').value;
  const brand = document.getElementById('item-brand').value;
  const price = document.getElementById('item-price').value;
  const status = document.getElementById('item-status').value;
  const urlInput = document.getElementById('item-url').value;
  const isFeatured = document.getElementById('item-featured').checked;
  const file = document.getElementById('item-img').files[0];
  const msg = document.getElementById('status-msg');

  if (!name) {
    alert("Please enter a name for the piece");
    return;
  }

  try {
    msg.innerText = "Processing archive entry...";
    let imageUrls = [];

    if (urlInput) {
      imageUrls = urlInput.split(',').map(u => u.trim()).filter(u => u !== "");
    } else {
      alert("Missing Media: Please upload at least one photo first.");
      msg.innerText = "";
      return;
    }

    // 2. Save to Firestore
    msg.innerText = "Syncing with archive database...";
    const payload = {
      name, brand, price, status,
      imageUrls: imageUrls,
      imageUrl: imageUrls[0], // Keep for backward compatibility
      isFeatured,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (activeEditId) {
      await db.collection('products').doc(activeEditId).update(payload);
      msg.innerText = "Updated successfully!";
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').add(payload);
      msg.innerText = "Uploaded successfully!";
    }

    await loadItems();
    resetAdminForm();

    setTimeout(() => {
      toggleAdminPanel();
      document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  } catch (err) {
    console.error("Firestore Error:", err);
    if (err.code === 'permission-denied') {
      msg.innerText = "Error: Check Firestore Rules (Permissions)";
    } else if (err.message.includes("database")) {
      msg.innerText = "Error: Database not initialized in console.";
    } else {
      msg.innerText = "Database Error: " + err.message;
    }
  }
}

// Final Init
document.addEventListener('DOMContentLoaded', () => {
  loadItems();
});
