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
        document.getElementById("app").style.display = "block";
        document.getElementById("footer").style.display = "block";
});

function checkBrowserChoice() {
    if (localStorage.getItem("browserChoice") === "keep") {
        document.getElementById("install-popup").style.display = "none";
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        document.getElementById("app").style.display = "block";
        document.getElementById("footer").style.display = "block";
        setTimeout(() => {
            document.getElementById("install-popup").remove();
        }, 1000);
    }
}

window.addEventListener('load', checkBrowserChoice);

document.getElementById("settingsPannelOpenerInstall").addEventListener("click", function() {
	document.getElementById("settings-panel").style.display = "block";
	document.getElementById("overlay").style.display = "block";
});

document.getElementById("settingsPannelOpenerLanding").addEventListener("click", function() {
	document.getElementById("settings-panel").style.display = "block";
	document.getElementById("overlay").style.display = "block";
});