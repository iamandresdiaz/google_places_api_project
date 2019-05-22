function htmlToElement(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const element = wrapper.firstElementChild;
    return element;
  }
  
  export default htmlToElement;