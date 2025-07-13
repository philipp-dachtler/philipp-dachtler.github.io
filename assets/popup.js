document.getElementById("installPageBtn").addEventListener("click", function() {
    document.getElementById("install-container").classList.remove("hidden");
    document.getElementById("landing-container").classList.add("hidden");
});

document.getElementById("returnToLanding").addEventListener("click", function() {
    document.getElementById("landing-container").classList.remove("hidden");
    document.getElementById("install-container").classList.add("hidden");
});

document.getElementById("keepBrowser").addEventListener("click", function() {
    localStorage.setItem("browserChoice", "keep");
    document.getElementById("install-popup").style.display = "none";
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';
});

function checkBrowserChoice() {
    if (localStorage.getItem("browserChoice") === "keep") {
        document.getElementById("install-popup").style.display = "none";
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        document.getElementById("app").style.display = "block";
    }
}

window.addEventListener('load', checkBrowserChoice);