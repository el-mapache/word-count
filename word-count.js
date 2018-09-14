let windowControlEl;

class Selection {
  constructor({ selection }) {
    this.selection = selection || window.getSelection();
  }

  toString() {
    return this.selection.toString();
  }
}

class WordCount extends Selection {
  constructor(props) {
    super(props);
    
    this.wordBoundaryRegex = /[\s.\/]+/;
    this.wordRegex = /[A-Za-z\-]/;
    this.newLineRegex = /\n/g;
    this.spaceRegex = /\s+/g;
  }

  wordCount() {
    const text = this.toString();
    const rawWordList = text
      .replace(this.newLineRegex, ' ')
      .split(this.wordBoundaryRegex);

    const sanitizedWordList = rawWordList.reduce((memo, maybeWord) => {
      if (maybeWord.length) {
        memo.push(maybeWord);
      }

      return memo;
    }, []);
    
    return {
      wordCount: sanitizedWordList.length,
      characterCount: text.replace(this.newLineRegex, '').length,
      characterNoSpaceCount: text.replace(this.spaceRegex, '').length,
    };
  }
}

const insertData = (selector, datum) => {
  const el = document.querySelector(selector);
  const textNode = document.createTextNode(datum);
  
  el.appendChild(textNode);
};

const getWindow = () =>
  new Promise((resolve, reject) => {
    chrome.windows.getCurrent({}, resolve);
  });

const handleWindowClose = (event) => {
  getWindow()
    .then(window => Promise.resolve(chrome.windows.remove(window.id)))
    .then(() =>
      windowControlEl.removeEventListener('click', handleWindowClose)
    );
};

const handleSelectionMessage = (request) => {
  if (request.action !== 'onSelect') {
    console.log(request.action)
    return;
  }

  const counter = new WordCount({ selection: request.message });
  const countData = counter.wordCount();

  windowControlEl = document.getElementById('close-window');
  windowControlEl.addEventListener('click', handleWindowClose);
  insertData('#word-count', countData.wordCount);
  insertData('#character-count-spaces', countData.characterCount);
  insertData('#character-count', countData.characterNoSpaceCount);
};

chrome.runtime.onMessage.addListener(handleSelectionMessage); 
