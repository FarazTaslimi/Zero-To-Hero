// ==================== Element References ====================

const line1 = document.querySelector('.line1');
const line2 = document.querySelector('.line2');
const line3 = document.querySelector('.line3');
const navbar = document.querySelector('.header div:last-child');

// ==================== State ====================

// Tracks whether the hamburger menu is currently open
let isOpen = false;

// ==================== Hamburger Toggle ====================

function hamburger() {
    isOpen = !isOpen;

    if (isOpen) {
        // Open state: rotate top/bottom lines into an X, hide middle line
        line1.style.transform = "rotate(33deg)";
        line2.style.visibility = "hidden";
        line3.style.transform = "rotate(-33deg)";

        // Slide the navbar into view
        navbar.classList.add('open');
    } else {
        // Closed state: reset lines back to their original position
        line1.style.transform = "rotate(0)";
        line2.style.visibility = "visible";
        line3.style.transform = "rotate(0)";

        // Slide the navbar back out of view
        navbar.classList.remove('open');
    }
}