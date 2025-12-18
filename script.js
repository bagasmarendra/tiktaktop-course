// script.js - Final Version (Google Sheets Integration)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYaaP7BCf1MSW4gwjkt85Cb0-8DYJZIHche6qYnzi9mqEtkhDim7mIcZ6VJB4quxufsA/exec';

document.addEventListener('DOMContentLoaded', function () {
  // Mobile Menu Toggle
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const dropdowns = document.querySelectorAll('.dropdown');

  // Toggle mobile menu (guard biar tidak error kalau elemen tidak ada)
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // Close mobile menu when clicking a link
  if (navLinks && navLinks.length) {
    navLinks.forEach((link) => {
      link.addEventListener('click', function () {
        if (hamburger) hamburger.classList.remove('active');
        if (navMenu) navMenu.classList.remove('active');

        // Update active link
        navLinks.forEach((item) => item.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  // Handle dropdowns on mobile
  if (dropdowns && dropdowns.length) {
    dropdowns.forEach((dropdown) => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (!toggle) return;

      toggle.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 60, // Sesuai tinggi navbar
          behavior: 'smooth',
        });
      }
    });
  });

  // Back to Top Button (guard biar tidak error kalau tombol tidak ada)
  const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', function () {
    if (!backToTopBtn) return;

    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  // FORM SUBMISSION KE GOOGLE SHEETS
  const form = document.getElementById('pendaftaranForm');
  const formMessage = document.getElementById('formMessage');

  if (form && formMessage) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = {
        nama: (formData.get('nama') || '').trim(),
        program: (formData.get('program') || '').trim(),
        nik: (formData.get('nik') || '').trim(),
        alamat: (formData.get('alamat') || '').trim(),
        whatsapp: (formData.get('whatsapp') || '').trim(),
      };

      // Validasi
      if (!data.nama || !data.program || !data.whatsapp) {
        showFormMessage('❌ Harap isi Nama, Program, dan WhatsApp!', 'error');
        return;
      }

      // Validasi WhatsApp
      if (!/^[0-9\+]{10,15}$/.test(data.whatsapp)) {
        showFormMessage('❌ Format WhatsApp tidak valid!', 'error');
        return;
      }

      // Loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM...';
        submitBtn.disabled = true;
      }

      try {
        // ✅ Kirim sebagai x-www-form-urlencoded (paling stabil untuk Apps Script + no-cors)
        const body = new URLSearchParams(data);

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Penting untuk bypass CORS (response memang tidak bisa dibaca)
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body,
        });

        // Simpan ke localStorage sebagai backup
        saveToLocalStorage(data);

        // Tampilkan pesan sukses
        showFormMessage('✅ Pendaftaran berhasil dikirim! Data Anda telah disimpan.', 'success');

        // Reset form
        form.reset();

        // Log untuk debugging
        console.log('📤 Data dikirim ke Google Sheets:', data);

        // Efek sukses
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
          formContainer.classList.add('success-glow');
          setTimeout(() => formContainer.classList.remove('success-glow'), 2000);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        showFormMessage('⚠️ Gagal mengirim. Data disimpan lokal. Coba lagi nanti.', 'warning');

        // Simpan ke localStorage sebagai fallback
        saveToLocalStorage(data);
      } finally {
        // Reset button state
        if (submitBtn) {
          submitBtn.innerHTML = originalBtnHTML;
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Fungsi tampilkan pesan form
  function showFormMessage(message, type) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = 'form-message ' + type;

    // Auto hide setelah 5 detik
    setTimeout(() => {
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }, 5000);
  }

  // Simpan ke localStorage sebagai backup
  function saveToLocalStorage(data) {
    try {
      const timestamp = new Date().toISOString();
      const entry = {
        timestamp,
        ...data,
        synced: false, // Belum sync ke Google Sheets
      };

      // Ambil data lama
      let storedData = localStorage.getItem('tikTakTopRegistrations');
      storedData = storedData ? JSON.parse(storedData) : [];

      // Tambah data baru
      storedData.push(entry);

      // Simpan (max 100 entri)
      if (storedData.length > 100) {
        storedData = storedData.slice(-100);
      }

      localStorage.setItem('tikTakTopRegistrations', JSON.stringify(storedData));
      console.log('💾 Data disimpan di localStorage:', entry);

      // Tampilkan jumlah data lokal di console
      console.log(`📊 Total data di localStorage: ${storedData.length}`);
    } catch (error) {
      console.error('❌ Gagal menyimpan ke localStorage:', error);
    }
  }

  // Cek dan tampilkan data dari localStorage
  function checkLocalStorage() {
    const storedData = localStorage.getItem('tikTakTopRegistrations');
    if (storedData) {
      const data = JSON.parse(storedData);
      console.log(`📱 Data tersimpan lokal: ${data.length} entri`);
    }
  }

  // Jalankan saat load
  checkLocalStorage();

  // Tambahkan animasi untuk form success (tetap sama)
  const style = document.createElement('style');
  style.textContent = `
        .success-glow {
            animation: successGlow 2s ease;
        }

        @keyframes successGlow {
            0% { box-shadow: 0 0 0 rgba(0, 243, 255, 0); }
            50% { box-shadow: 0 0 30px rgba(0, 243, 255, 0.7); }
            100% { box-shadow: 0 0 0 rgba(0, 243, 255, 0); }
        }

        .form-message.warning {
            background-color: rgba(255, 255, 0, 0.1);
            border: 1px solid rgba(255, 255, 0, 0.3);
            color: #ffff00;
        }
    `;
  document.head.appendChild(style);

  // Add active class to nav links based on scroll
  window.addEventListener('scroll', function () {
    if (!navLinks || !navLinks.length) return;

    const sections = document.querySelectorAll('section');
    const scrollPos = window.pageYOffset + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  // Console welcome message
  console.log('%c🎮 TIK TAK TOP COURSE 🎮', 'color: #00f3ff; font-size: 24px; font-weight: bold;');
  console.log('%c🚀 System: Online | Theme: Cyberpunk | Version: 2.0', 'color: #ff00ff;');
  console.log('%c📡 Google Sheets API: Ready', 'color: #00ff00;');
});
