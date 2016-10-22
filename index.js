const htmlparser = require('htmlparser2');

var output = [''];
var lastType = '';

const htmlToText = html => {
  if (typeof(html) !== 'string') {
    return new Error(`Expected a string but got ${typeof(html)}`);
  }

  parser.write(html);
  parser.end();

  return output.join('');
};

const parser = new htmlparser.Parser({
  onopentag: (name, attribs) => {
    formatElement(name, attribs, false);
  },

  ontext: text => {
    formatText(text);
  },

  onclosetag: tagname => {
    formatElement(tagname, {}, true);
  }
}, {decodeEntities: true});

const elements = {
  a: {
    isOpen: false,
    href: '',
    text: ''
  },
  img: {
    isOpen: false,
    alt: ''
  },
  style: {
    isOpen: false,
    ignore: true
  },
  script: {
    isOpen: false
  },
  title: {
    isOpen: false
  }
};

const formatText = text => {
  if (/^\s*$/.test(text)) {
    // ignore text with only whitespace
    return;
  }

  if (elements.script.isOpen || elements.style.isOpen) {
    // ignore script and style elements
    return;
  }

  if (elements.title.isOpen) {
    // set uppercase title and add divider
    output.push(`${text.toUpperCase()}\n\n--------------------\n\n`);
    lastType = 'title';
    return;
  }

  if (lastType === 'title') {
    // Don't break divider after title
    text = text.replace(/^\s+/, '');
  }

  // Always end text with a space
  if (!/\s+$/.test(text) && text.length > 1) {
    text += ' ';
  } else {
    text = text.replace(/\s+$/, ' ');
  }

  if (elements.a.isOpen) {
    elements.a.text = `${text}`;
    return;
  }

  if (lastType === 'a.href') {
    if (text.startsWith('.') || text.startsWith(',') || text.startsWith('!') || text.startsWith('?')) {
      // Remove space if matching any of [.,!?]
      output[output.length - 1] = output[output.length - 1].replace(/ $/, '');
    } else {
      text = text.replace(/^\s+/, '');
    }
  }

  // Use a maximum of two line breaks for whitespace in beginning of text
  if (/^\s{2,}/.test(text)) {
    if (lastType === 'img') {
      text = text.replace(/^\s+/, '');
    } else {
      text = text.replace(/^\s+/, '\n\n');
    }
  }

  if (lastType === 'img.href') {
    // If img link was used last string, add line breaks
    if (/^\s/.test(text)) {
      text.replace(/^\s+/, '\n\n');
    } else {
      text = `\n\n${text}`;
    }
  }

  output.push(text);
  lastType = 'text';
};

const formatElement = (name, attribs, isClosingTag) => {
  switch (name) {
    case 'a':
      elements.a.isOpen = !isClosingTag;

      if (elements.a.isOpen) {
        if (!attribs) {
          return;
        }

        if (attribs.href) {
          elements.a.href = `[${attribs.href}] `;
        }
      } else {
        if (elements.a.text) {
          output.push(elements.a.text);
          elements.a.text = '';
          lastType = 'a.text';
        }

        if (elements.a.href) {
          output.push(elements.a.href);
          elements.a.href = '';
          lastType = lastType === 'img' ? 'img.href' : 'a.href';
        }
      }

      break;

    case 'img':
      elements.img.isOpen = !isClosingTag;

      if (elements.img.isOpen) {
        if (!attribs) {
          return;
        }

        if (attribs.alt) {
          elements.img.alt = `\n\n${attribs.alt}\n`;
        }
      } else {
        if (elements.img.alt) {
          output.push(`${elements.img.alt}`);
          elements.img.alt = '';
          lastType = 'img';
        }
      }

      break;

    case 'style':
      elements.style.isOpen = !isClosingTag;
      break;

    case 'script':
      elements.script.isOpen = !isClosingTag;
      break;

    case 'title':
      elements.title.isOpen = !isClosingTag;
      break;
  }
}

module.exports = htmlToText;
