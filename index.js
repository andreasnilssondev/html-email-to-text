const htmlparser = require('htmlparser2');

var textString = '';

const htmlToText = html => {
  if (typeof(html) !== 'string') {
    return new Error(`Expected a string but got ${typeof(html)}`);
  }

  parser.write(html);
  parser.end();

  return textString;
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
    current: false,
    href: '',
    text: ''
  },
  img: {
    current: false,
    alt: ''
  },
  style: {
    current: false
  },
  script: {
    current: false
  },
  title: {
    current: false
  }
};

const formatText = text => {
  if (/^\s*$/.test(text)) {
    return;
  }

  if (elements.a.current) {
    elements.a.text += ` ${text}`;
  } else if (elements.title.current) {
    textString += `${text.toUpperCase()}\n\n--------------------\n\n`;
  } else if (!elements.style.current && !elements.style.script) {
    text = text.replace(/[\s]{2,}$/g, '');
    text = text.replace(/^[\s]{2,}/g, '\n\n');
    textString += text;
  }
};

const formatElement = (name, attribs, isClosingTag) => {
  switch (name) {
    case 'a':
      if (isClosingTag) {
        if (elements.a.text) {
          textString += elements.a.text;
          elements.a.text = '';
        }

        if (elements.a.href) {
          textString += elements.a.href;
          elements.a.href = '';
        }

        elements.a.current = false;
        return;
      }

      if (attribs.href) {
        elements.a.href = ` [${attribs.href.replace(/^\s+/g,'')}]`;
      }

      elements.a.current = true;
      break;

    case 'img':
      if (isClosingTag) {
        elements.img.current = false;

        if (elements.img.alt) {
          if (!textString.match(/[\n]{2,}$/g)) {
            textString += '\n\n';
          }

          textString += `${elements.img.alt}\n`;
          elements.img.alt = '';

          if (elements.a.href) {
            elements.a.href = `${elements.a.href.replace(/^\s+/g, '')}\n\n`;
          }
        }

        return;
      }

      if (!attribs) {
        return;
      }

      if (attribs.alt) {
        elements.img.alt = attribs.alt.replace(/^\s\s+/g, '\n\n');
      }

      elements.img.current = true;
      break;

    case 'style':
      elements.style.current = !isClosingTag;
      break;

    case 'script':
      elements.script.current = !isClosingTag;
      break;

    case 'title':
      elements.title.current = !isClosingTag;
      break;
  }
}

module.exports = htmlToText;
