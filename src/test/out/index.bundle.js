var _ea8c_ = 0;
function _einit941_ () {
  if (_ea8c_) 
    return _einit941_;
  else _ea8c_++;
  const Loader = function () {
    const element = _eb77_(
      "div", 
      { "class": "Loader" }, 
      []
    );
    return element;
  };
  _einit941_.Loader = Loader;
  return _einit941_;
}
function _eb77_ (
  tag, 
  attributes, 
  children
) {
  if (children === undefined) 
    children = arguments[2] = [];
  if (attributes === undefined) 
    attributes = arguments[1] = {};
  var element = document.createElement(tag);
  function stylize (object) {
    let styleString = "";
    Object.entries(object).forEach((entry) => {
      if (entry[1] === null || entry[1] === void 0 
        ? void 0
        : entry[1].length && !(entry[0].slice(0, 2) === "--")) {
        let i = 0;
        while (i < entry[0].length) {
          if (entry[0][i].toUpperCase() === entry[0][i]) 
            styleString += '-' + entry[0][i++].toLowerCase();
          else styleString += entry[0][i++];
        }
        styleString += ':' + entry[1] + '; ';
      } else if (entry[0].slice(0, 2) === "--") 
        styleString += entry[0] + ':' + entry[1] + '; ';
    });
    return styleString;
  }
  Object.entries(attributes).forEach(function (attribute) {
    switch (true) {
      case attribute[0] === 'style' && typeof attribute[1] === 'object':
        element.setAttribute(attribute[0], stylize(attribute[1]));
        break;
      case attribute[0] === 'className':
        element.setAttribute('class', attribute[1]);
        break;
      case attribute[0].slice(0, 2) === 'on':
        element.addEventListener(attribute[0].slice(2).toLowerCase(), attribute[1]);
        break;
      default:
        element.setAttribute(attribute[0], attribute[1]);
    }
  });
  children.flat().forEach((child) => {
    if (typeof child === 'string') 
      element.append(document.createTextNode(child.replace(/\&amp\;/, '&').replace(/\&copy\;/, '©')));
    else element.append(child);
  });
  return element;
}
_einit941_()