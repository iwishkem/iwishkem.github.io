const circle = document.querySelector('.circle');
const text = circle.innerHTML; // Note I am being lazy here and assuming the string has no unwanted whitespace
circle.innerHTML = '';
circle.style.setProperty('--numchs', text.length);
for (let i = 0; i < text.length; i++) {
  circle.innerHTML = circle.innerHTML + '<div class="char" style="--char-index: ' + i + ';">' + text.charAt(i) + '</div>';
}

// Block Ctrl+A
document.addEventListener('keydown', function(event) {
  // Check if the key combination is Ctrl+A
  if (event.ctrlKey && event.key === 'a') {
    // Prevent the default behavior of the event
    event.preventDefault();
  }
});

// Block right-click
document.addEventListener('contextmenu', function(event) {
  // Prevent the default behavior of the event
  event.preventDefault();
});
