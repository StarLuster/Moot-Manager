// Make Buttons on Popup Clickable and tie them to certain functions
document.getElementById('saveMutuals').addEventListener('click', saveUrls);
document.getElementById('open-all').addEventListener('click', openAllUrls);
document.getElementById('open-all-reviews').addEventListener('click', openAllUrlsWithReviews);
document.getElementById('scrape-and-open').addEventListener('click', scrapeAndOpen);

// Block the Recent Reviews button from triggering when the dropdown is clicked
const numberDropdown = document.getElementById('number-dropdown');
numberDropdown.addEventListener('click', function (event) {
  event.stopPropagation();
});

// Load saved URLs  from text field and Selected Number from dropdown
chrome.storage.sync.get(['mutualsUrls', 'selectedNumber'], function (data) {
  if (data.mutualsUrls) {
    document.getElementById('urls').value = data.mutualsUrls.join('\n');
  }
  if (data.selectedNumber) {
    numberDropdown.value = data.selectedNumber;
  }
});

// Save the selected number from dropdown whenever it changes
numberDropdown.addEventListener('change', function () {
  const selectedNumber = this.value;
  chrome.storage.sync.set({ selectedNumber: selectedNumber });
});

// Save mutuals URLs to Chrome storage
function saveUrls() {
  const urls = document.getElementById('urls').value.split('\n').filter(url => url.trim() !== '');
  chrome.storage.sync.set({ mutualsUrls: urls });
}

// Open all Profile Pages
function openAllUrls() {
  chrome.storage.sync.get(['mutualsUrls'], function (data) {
    if (data.mutualsUrls) {
      data.mutualsUrls.forEach(url => {
        chrome.tabs.create({ url: url });
      });
    }
  });
}

// Open All Review Pages
function openAllUrlsWithReviews() {
  chrome.storage.sync.get(['mutualsUrls'], function (data) {
    if (data.mutualsUrls) {
      data.mutualsUrls.forEach(url => {
        const fullUrl = url.endsWith('/') ? `${url}films/reviews/` : `${url}/films/reviews/`;
        chrome.tabs.create({ url: fullUrl });
      });
    }
  });
}

// Open X ammount of Recent Reviews
function scrapeAndOpen() {
  const selectedNumber = parseInt(numberDropdown.value, 10);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: activeTab },
      function: scrapeHrefs,
      args: [selectedNumber] // Pass the selected number to the scraping function
    }, (results) => {
      if (results && results[0].result) {
        results[0].result.forEach(url => {
          chrome.tabs.create({ url: url });
        });
      }
    });
  });
}

// Scrape the X ammount of recent reviews for their URL"
function scrapeHrefs(selectedNumber) {
  const headlines = document.querySelectorAll('h2.headline-2.prettify');
  const urls = [];
  for (let i = 0; i < Math.min(selectedNumber, headlines.length); i++) {
    const link = headlines[i].querySelector('a');
    if (link) {
      urls.push(link.href);
    }
  }
  return urls;
}