// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyD-VieCw1hcgMALCmptGVAAq4dtHAh2Gbw",
  authDomain: "mnm-shop-901c9.firebaseapp.com",
  projectId: "mnm-shop-901c9",
  storageBucket: "mnm-shop-901c9.firebasestorage.app",
  messagingSenderId: "549507929902",
  appId: "1:549507929902:web:85ae6b9f1214b26ddd4cbf",
  measurementId: "G-TR2V28BRCF"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get Product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

let currentItem = null;

async function fetchProduct() {
  if (!productId) {
    document.body.innerHTML = "<h2 style='text-align:center; padding-top:200px;'>Product Not Found</h2>";
    return;
  }

  try {
    const doc = await db.collection('products').doc(productId).get();
    if (!doc.exists) {
      document.getElementById('product-name').innerText = "Item no longer available";
      return;
    }

    currentItem = doc.data();
    
    // Increment view count
    db.collection('products').doc(productId).update({
      viewCount: firebase.firestore.FieldValue.increment(1)
    }).catch(err => console.error("Error incrementing view count:", err));

    document.getElementById('brand-name').innerText = currentItem.brand;
    document.getElementById('product-name').innerText = currentItem.name;
    document.getElementById('product-price').innerText = currentItem.status === 'sold' ? '[ SOLD ]' : (String(currentItem.price).toUpperCase().includes('TND') ? currentItem.price : currentItem.price + ' TND');

    const views = currentItem.viewCount !== undefined ? currentItem.viewCount + 1 : 1;
    document.getElementById('product-views').innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.6;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      <span>${views} View${views !== 1 ? 's' : ''}</span>
    `;



    // Handle multiple images
    const gallery = document.getElementById('gallery-images');
    const placeholder = document.getElementById('image-placeholder');
    const counter = document.getElementById('image-counter');
    const nextArr = document.getElementById('next-arrow');
    const prevArr = document.getElementById('prev-arrow');
    gallery.innerHTML = '';
    
    const images = currentItem.imageUrls || [currentItem.imageUrl];
    
    if (images.length > 1) {
      counter.style.display = 'block';
      counter.innerText = `1 / ${images.length}`;
      nextArr.style.display = 'flex';
      prevArr.style.display = 'flex';
    } else {
      counter.style.display = 'none';
      nextArr.style.display = 'none';
      prevArr.style.display = 'none';
    }

    images.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.className = 'product-main-img';
      img.alt = currentItem.name;
      gallery.appendChild(img);
    });
    
    // Update counter on swipe
    gallery.addEventListener('scroll', () => {
      const index = Math.round(gallery.scrollLeft / gallery.clientWidth);
      counter.innerText = `${index + 1} / ${images.length}`;
    });

    placeholder.style.display = 'none';
    
    document.title = `${currentItem.name} - MNM Thriftshop`;

  } catch (err) {
    console.error("Error fetching product:", err);
  }
}

function scrollGallery(direction) {
  const gallery = document.getElementById('gallery-images');
  const scrollAmount = gallery.clientWidth;
  gallery.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
}

function getInquiryData() {
  const name = document.getElementById('cust-name').value || "[Name Not Provided]";
  const size = document.getElementById('cust-size').value;
  const location = document.getElementById('cust-location').value || "[Location Not Provided]";
  const phone = document.getElementById('cust-phone').value || "[No Phone]";
  
  const currentPrice = (String(currentItem.price).toUpperCase().includes('TND') ? currentItem.price : currentItem.price + ' TND');
  const text = `INQUIRY FOR: ${currentItem.name}\nBRAND: ${currentItem.brand}\nPRICE: ${currentPrice}\n---\nCLIENT: ${name}\nSIZE: ${size}\nLOCATION: ${location}\nPHONE: ${phone}`;
  
  return { text, name };
}

function sendViaInstagram() {
  const data = getInquiryData();
  
  // Copy to clipboard
  navigator.clipboard.writeText(data.text).then(() => {
    showToast();
    // Wait a bit then redirect
    setTimeout(() => {
      window.open('https://www.instagram.com/mnm_thriftshop/', '_blank');
    }, 1500);
  });
}

function sendViaEmail() {
  const data = getInquiryData();
  const subject = `Purchase Inquiry: ${currentItem.name}`;
  const mailtoLink = `mailto:mnmthriftshop@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(data.text)}`;
  window.location.href = mailtoLink;
}

function showToast() {
  const toast = document.getElementById('copy-toast');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

document.addEventListener('DOMContentLoaded', fetchProduct);
