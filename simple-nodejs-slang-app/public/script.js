document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resultContainer = document.getElementById('resultContainer');
  const resultText = document.getElementById('resultText');
  const reportBtn = document.getElementById('reportBtn');
  const trendingList = document.getElementById('trendingList');
  const showMoreBtn = document.getElementById('showMoreBtn');

  // Configuration
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'your_service_id',
    TEMPLATE_ID: 'your_template_id',
    USER_ID: 'your_user_id'
  };

  // State
  let visibleTrendingCount = 6;
  const trendingItemsToLoad = 6;
  let allTrendingSlangs = [];

  // Search function
  async function searchSlang(term) {
    if (!term) return;

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<div class="spinner"></div>';
    resultContainer.classList.add('hidden');
    reportBtn.style.display = 'none';

    try {
      const response = await fetch(`/api/slang/search?term=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to search');

      displayResult(data);
      updateUIAfterSearch(data);
      refreshTrendingList();
    } catch (error) {
      console.error('Search error:', error);
      resultText.textContent = error.message || 'Error searching. Please try again.';
      resultContainer.classList.remove('hidden');
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'SEARCH';
    }
  }

  // Display results
  function displayResult(data) {
    resultText.textContent = data.meaning;
    resultContainer.classList.remove('hidden');
  }

  // Update UI after search
  function updateUIAfterSearch(data) {
    if (data.exists) {
      reportBtn.textContent = 'Report Incorrect Meaning';
      reportBtn.dataset.type = 'incorrect';
    } else {
      reportBtn.textContent = 'Report Missing Slang';
      reportBtn.dataset.type = 'missing';
    }
    reportBtn.style.display = 'block';
  }

  // Refresh trending list
  async function refreshTrendingList() {
    try {
      const response = await fetch('/api/slang');
      allTrendingSlangs = await response.json();
      
      renderTrendingList();
    } catch (err) {
      console.error('Error refreshing trending list:', err);
    }
  }

  // Render trending list with pagination
  function renderTrendingList() {
    trendingList.innerHTML = allTrendingSlangs
      .slice(0, visibleTrendingCount)
      .map(slang => `
        <div class="trending-item" data-term="${slang.term}">
          ${slang.term} <span>(${slang.count})</span>
        </div>
      `).join('');

    showMoreBtn.style.display = 
      allTrendingSlangs.length > visibleTrendingCount ? 'block' : 'none';

    // Reattach event listeners
    document.querySelectorAll('.trending-item').forEach(item => {
      item.addEventListener('click', () => {
        searchInput.value = item.dataset.term;
        searchSlang(item.dataset.term);
        
        // Scroll to top on mobile
        if (window.innerWidth <= 768) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  // Report function
  async function sendReport() {
    const term = searchInput.value.trim();
    const type = reportBtn.dataset.type;

    if (!term) return;

    reportBtn.disabled = true;
    reportBtn.innerHTML = '<div class="spinner"></div>';

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: EMAILJS_CONFIG.SERVICE_ID,
          template_id: EMAILJS_CONFIG.TEMPLATE_ID,
          user_id: EMAILJS_CONFIG.USER_ID,
          template_params: {
            slang: term,
            type: type,
            message: type === 'missing' 
              ? `The slang "${term}" is missing from the database` 
              : `The meaning for "${term}" appears to be incorrect`
          }
        })
      });

      if (!response.ok) throw new Error('Failed to submit report');
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Report error:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      reportBtn.disabled = false;
      reportBtn.textContent = type === 'missing' 
        ? 'Report Missing Slang' 
        : 'Report Incorrect Meaning';
    }
  }

  // Load more trending items
  showMoreBtn.addEventListener('click', () => {
    visibleTrendingCount += trendingItemsToLoad;
    renderTrendingList();
  });

  // Event listeners
  searchBtn.addEventListener('click', () => searchSlang(searchInput.value.trim()));
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchSlang(searchInput.value.trim());
  });
  reportBtn.addEventListener('click', sendReport);

  // Initial load
  refreshTrendingList();
});