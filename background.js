class Box {
  constructor({ w, h }) {
    this.width = w;
    this.height = h;
  }
}

const ACTIVE_TAB_QUERY = {
  active: true,
  currentWindow: true,
};

const getCurrentWindow = (options = {}) =>
  new Promise((resolve, reject) => {
    chrome.windows.getCurrent(options, resolve);
  });

const createWindow = ({ url, window }) => {
  const page = new Box({ w: window.width, h: window.height });
  const popup = new Box({ w: 400, h: 300 });
  
  return new Promise((resolve, reject) => {
    chrome.windows.create({
      url,
      left:  Math.floor((page.width - popup.width) / 2),
      top: Math.floor((page.height - popup.height) / 2),
      width: popup.width,
      height: popup.height,
      type: 'popup',
    }, resolve);
  });
};

// After a window is created, we need to wait til its tab is loaded
// before we can reliably interact with it
const onWindowCreate = (window) => {
  const windowTab = window.tabs[0];

  return new Promise((resolve, reject) => {
    chrome.tabs.onUpdated.addListener((tabId, meta) => {
      if (tabId === windowTab.id && meta.status === 'complete') {
        resolve(tabId);
      }
    });
  });
};

const sendMessage = (windowId, messageObj) =>
  chrome.tabs.sendMessage(windowId, messageObj);

const handleContextClick = () => (info, tab) => {
  const url = 'word-count.html';

  getCurrentWindow()
    .then(window => createWindow({ url, window }))
    .then(onWindowCreate)
    .then(id =>
      sendMessage(id, {
        action: 'onSelect',
        message: info.selectionText,
        id,
      })
    );
};

chrome.contextMenus.create({
  title: 'Word Count',
  type: 'normal',
  contexts: ['selection'],
  onclick: handleContextClick()
});
